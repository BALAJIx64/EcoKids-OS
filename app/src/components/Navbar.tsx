import React from 'react'
import { useEco } from '../context/EcoContext'
import { sound } from '../utils/audio'
import { 
  Trophy, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  ArrowLeft,
  Sparkles
} from 'lucide-react'

interface NavbarProps {
  onOpenAchievements: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAchievements }) => {
  const { 
    score, 
    rank, 
    nextRank, 
    rankProgressPercent, 
    isMuted, 
    toggleMute, 
    activeActivity, 
    setActiveActivity,
    achievements,
    resetProgress
  } = useEco()

  const unlockedCount = achievements.filter(a => a.unlocked).length

  const handleBackToHub = () => {
    sound.playTap()
    setActiveActivity(null)
  }

  const handleResetConfirm = () => {
    if (window.confirm('Reset all EcoKids OS progress, score, and badges to start fresh?')) {
      resetProgress()
    }
  }

  return (
    <header className="glass-panel" style={{
      margin: '16px 20px 0 20px',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexWrap: 'wrap',
      position: 'sticky',
      top: '12px',
      zIndex: 50
    }}>
      {/* Left: Brand or Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {activeActivity ? (
          <button 
            className="btn btn-secondary" 
            onClick={handleBackToHub}
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            title="Return to Eco Planet Hub"
          >
            <ArrowLeft size={18} />
            <span>Planet Hub</span>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #34d399 0%, #047857 70%, #064e3b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(52, 211, 153, 0.5)',
              fontSize: '1.4rem'
            }}>
              🌍
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  EcoKids <span style={{ color: 'var(--emerald-400)' }}>OS</span>
                </h1>
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                  v2.0 EdGame
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Planetary Environmental Academy
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Center: Rank Progress & Status */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        background: 'rgba(255, 255, 255, 0.16)', 
        padding: '6px 16px', 
        borderRadius: 'var(--radius-full)',
        border: '1px solid rgba(255, 255, 255, 0.35)',
        backdropFilter: 'blur(16px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>{rank.badge}</span>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff' }}>
              {rank.title}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Level {rank.level}
            </div>
          </div>
        </div>

        {nextRank && (
          <div style={{ width: '110px' }} title={`Next rank: ${nextRank.title} at ${nextRank.minScore} pts`}>
            <div style={{ 
              height: '6px', 
              width: '100%', 
              background: 'rgba(255, 255, 255, 0.18)', 
              borderRadius: '3px',
              overflow: 'hidden' 
            }}>
              <div style={{ 
                height: '100%', 
                width: `${rankProgressPercent}%`, 
                background: 'linear-gradient(90deg, var(--emerald-400), var(--sky-blue))',
                borderRadius: '3px',
                transition: 'width 0.4s ease'
              }} />
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '2px' }}>
              {rankProgressPercent}% to {nextRank.badge}
            </div>
          </div>
        )}
      </div>

      {/* Right: Eco Score, Achievements, Sound, Reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Prominent Eco Score */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.18)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(16px)',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
        }}>
          <Sparkles size={16} color="var(--emerald-300)" />
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              ECO SCORE
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
              {score.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Trophy / Achievements button */}
        <button 
          className="btn btn-secondary" 
          onClick={() => {
            sound.playTap()
            onOpenAchievements()
          }}
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          title="View Badges & Achievements"
        >
          <Trophy size={16} color="var(--accent-amber)" />
          <span>{unlockedCount}/{achievements.length}</span>
        </button>

        {/* Audio Toggle */}
        <button 
          className="btn btn-icon" 
          onClick={toggleMute}
          title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
        >
          {isMuted ? <VolumeX size={18} color="#ef4444" /> : <Volume2 size={18} color="var(--emerald-400)" />}
        </button>

        {/* Reset button */}
        <button 
          className="btn btn-icon" 
          onClick={handleResetConfirm}
          title="Reset Game Progress"
          style={{ opacity: 0.7 }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </header>
  )
}
