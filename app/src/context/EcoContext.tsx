import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import type { ActivityId, ActivityMeta, Achievement, EcoRank, UserStats, EcoSaveData } from '../types'
import { INITIAL_ACTIVITIES } from '../data/activities'
import { ECO_RANKS, INITIAL_ACHIEVEMENTS } from '../data/achievements'
import { sound } from '../utils/audio'
import confetti from 'canvas-confetti'

const STORAGE_KEY = 'ecokids_os_save_data_v1'

interface EcoContextType {
  score: number
  rank: EcoRank
  nextRank: EcoRank | null
  rankProgressPercent: number
  activities: Record<ActivityId, ActivityMeta>
  achievements: Achievement[]
  stats: UserStats
  isMuted: boolean
  activeActivity: ActivityId | null
  recentAchievement: Achievement | null
  dismissAchievement: () => void
  toggleMute: () => void
  setActiveActivity: (id: ActivityId | null) => void
  completeActivity: (
    id: ActivityId,
    earnedScore: number,
    stars: number,
    statsDelta?: Partial<UserStats>,
    achievementTriggerIds?: string[]
  ) => void
  unlockAchievement: (achievementId: string) => void
  resetProgress: () => void
}

const EcoContext = createContext<EcoContextType | undefined>(undefined)

const DEFAULT_STATS: UserStats = {
  totalScore: 0,
  activitiesCompleted: 0,
  totalItemsRecycled: 0,
  litersWaterSaved: 0,
  wattsEnergySaved: 0,
  treesPlanted: 0,
  speciesProtected: 0,
  co2ReducedKg: 0,
  bambooCollected: 0,
  longestRunMeters: 0,
}

export const EcoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [score, setScore] = useState<number>(0)
  const [activities, setActivities] = useState<Record<ActivityId, ActivityMeta>>(INITIAL_ACTIVITIES)
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS)
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [activeActivity, setActiveActivity] = useState<ActivityId | null>(null)
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null)

  // 1. Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: EcoSaveData = JSON.parse(saved)
        if (parsed.version === 1) {
          setScore(parsed.score || 0)
          setStats(parsed.stats || DEFAULT_STATS)
          setIsMuted(parsed.isMuted || false)
          sound.setMuted(parsed.isMuted || false)

          // Merge activities
          setActivities((prev) => {
            const next = { ...prev }
            for (const key of Object.keys(next) as ActivityId[]) {
              if (parsed.activities && parsed.activities[key]) {
                next[key] = {
                  ...next[key],
                  ...parsed.activities[key],
                }
              }
            }
            return next
          })

          // Merge achievements
          if (parsed.achievements) {
            setAchievements((prev) =>
              prev.map((ach) => ({
                ...ach,
                unlocked: !!parsed.achievements[ach.id],
              }))
            )
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load EcoKids save data from localStorage:', e)
    }
  }, [])

  // 2. Save to localStorage whenever state changes
  useEffect(() => {
    try {
      const saveData: EcoSaveData = {
        version: 1,
        score,
        activities: Object.entries(activities).reduce((acc, [key, act]) => {
          acc[key as ActivityId] = {
            completed: act.completed,
            stars: act.stars,
            bestScore: act.bestScore,
            playsCount: act.playsCount,
          }
          return acc
        }, {} as EcoSaveData['activities']),
        achievements: achievements.reduce((acc, ach) => {
          acc[ach.id] = ach.unlocked
          return acc
        }, {} as Record<string, boolean>),
        stats,
        isMuted,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData))
    } catch (e) {
      console.warn('Failed to persist EcoKids save data:', e)
    }
  }, [score, activities, achievements, stats, isMuted])

  // Sound toggle
  const toggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    sound.setMuted(next)
    if (!next) {
      sound.playTap()
    }
  }

  // Dismiss current achievement popover
  const dismissAchievement = () => {
    setRecentAchievement(null)
  }

  // Unlock achievement
  const unlockAchievement = (achievementId: string) => {
    setAchievements((prev) => {
      const existing = prev.find((a) => a.id === achievementId)
      if (existing && !existing.unlocked) {
        sound.playFanfare()
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          })
        } catch {}
        const updated = {
          ...existing,
          unlocked: true,
          unlockedAt: new Date().toISOString(),
        }
        setRecentAchievement(updated)
        return prev.map((a) => (a.id === achievementId ? updated : a))
      }
      return prev
    })
  }

  // Calculate current EcoRank and progression
  const rank = useMemo(() => {
    for (let i = ECO_RANKS.length - 1; i >= 0; i--) {
      if (score >= ECO_RANKS[i].minScore) {
        return ECO_RANKS[i]
      }
    }
    return ECO_RANKS[0]
  }, [score])

  const nextRank = useMemo(() => {
    const currentIndex = ECO_RANKS.findIndex((r) => r.level === rank.level)
    if (currentIndex >= 0 && currentIndex < ECO_RANKS.length - 1) {
      return ECO_RANKS[currentIndex + 1]
    }
    return null
  }, [rank])

  const rankProgressPercent = useMemo(() => {
    if (!nextRank) return 100
    const prevMin = rank.minScore
    const nextMin = nextRank.minScore
    const range = nextMin - prevMin
    const current = Math.max(0, score - prevMin)
    return Math.min(100, Math.round((current / range) * 100))
  }, [score, rank, nextRank])

  // Complete an activity with duplicate-reward protection
  const completeActivity = (
    id: ActivityId,
    earnedScore: number,
    stars: number,
    statsDelta?: Partial<UserStats>,
    achievementTriggerIds?: string[]
  ) => {
    setActivities((prev) => {
      const current = prev[id]
      const isFirstCompletion = !current.completed
      const isNewBestScore = earnedScore > current.bestScore

      // Duplicate-reward protection:
      // If first completion: award full score
      // If replay: award only the positive delta between new score and previous best score!
      let scoreAward = 0
      if (isFirstCompletion) {
        scoreAward = earnedScore
      } else if (isNewBestScore) {
        scoreAward = earnedScore - current.bestScore
      }

      if (scoreAward > 0) {
        setScore((s) => s + scoreAward)
      }

      const updatedActivity: ActivityMeta = {
        ...current,
        completed: true,
        stars: Math.max(current.stars, stars),
        bestScore: Math.max(current.bestScore, earnedScore),
        playsCount: current.playsCount + 1,
      }

      // Update aggregate stats
      setStats((s) => ({
        ...s,
        totalScore: s.totalScore + scoreAward,
        activitiesCompleted: isFirstCompletion ? s.activitiesCompleted + 1 : s.activitiesCompleted,
        totalItemsRecycled: s.totalItemsRecycled + (statsDelta?.totalItemsRecycled || 0),
        litersWaterSaved: s.litersWaterSaved + (statsDelta?.litersWaterSaved || 0),
        wattsEnergySaved: s.wattsEnergySaved + (statsDelta?.wattsEnergySaved || 0),
        treesPlanted: s.treesPlanted + (statsDelta?.treesPlanted || 0),
        speciesProtected: s.speciesProtected + (statsDelta?.speciesProtected || 0),
        co2ReducedKg: s.co2ReducedKg + (statsDelta?.co2ReducedKg || 0),
        bambooCollected: s.bambooCollected + (statsDelta?.bambooCollected || 0),
        longestRunMeters: Math.max(s.longestRunMeters, statsDelta?.longestRunMeters || 0),
      }))

      // Unlock first step achievement
      unlockAchievement('first_step')

      // Check specific triggers
      if (achievementTriggerIds) {
        achievementTriggerIds.forEach((achId) => unlockAchievement(achId))
      }

      // Check Grand Legend achievement (all 6 activities with 3 stars)
      setTimeout(() => {
        setActivities((latest) => {
          const allCompleted = Object.values(latest).every((a) => a.completed && a.stars === 3)
          if (allCompleted) {
            unlockAchievement('gaia_legend')
          }
          return latest
        })
      }, 500)

      return {
        ...prev,
        [id]: updatedActivity,
      }
    })
  }

  // Reset progress (for testing or fresh start)
  const resetProgress = () => {
    localStorage.removeItem(STORAGE_KEY)
    setScore(0)
    setActivities(INITIAL_ACTIVITIES)
    setAchievements(INITIAL_ACHIEVEMENTS)
    setStats(DEFAULT_STATS)
    sound.playTap()
  }

  return (
    <EcoContext.Provider
      value={{
        score,
        rank,
        nextRank,
        rankProgressPercent,
        activities,
        achievements,
        stats,
        isMuted,
        activeActivity,
        recentAchievement,
        dismissAchievement,
        toggleMute,
        setActiveActivity,
        completeActivity,
        unlockAchievement,
        resetProgress,
      }}
    >
      {children}
    </EcoContext.Provider>
  )
}

export const useEco = (): EcoContextType => {
  const context = useContext(EcoContext)
  if (!context) {
    throw new Error('useEco must be used within an EcoProvider')
  }
  return context
}
