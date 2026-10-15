export type ActivityId = 'recycle' | 'water' | 'energy' | 'forest' | 'wildlife' | 'climate' | 'panda'

export interface ActivityMeta {
  id: ActivityId
  title: string
  subtitle: string
  category: string
  description: string
  gradient: string
  accentColor: string
  stars: number // 0-3
  completed: boolean
  bestScore: number
  playsCount: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
}

export interface EcoRank {
  level: number
  title: string
  minScore: number
  badge: string
  perk: string
}

export interface UserStats {
  totalScore: number
  activitiesCompleted: number
  totalItemsRecycled: number
  litersWaterSaved: number
  wattsEnergySaved: number
  treesPlanted: number
  speciesProtected: number
  co2ReducedKg: number
  bambooCollected: number
  longestRunMeters: number
}

export interface EcoSaveData {
  version: number
  score: number
  activities: Record<ActivityId, {
    completed: boolean
    stars: number
    bestScore: number
    playsCount: number
  }>
  achievements: Record<string, boolean>
  stats: UserStats
  isMuted: boolean
}
