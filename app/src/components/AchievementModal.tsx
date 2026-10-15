import React from 'react'
import { useEco } from '../context/EcoContext'
import { sound } from '../utils/audio'
import { ECO_RANKS } from '../data/achievements'
import { X, Award, CheckCircle2, Lock } from 'lucide-react'

interface AchievementModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AchievementModal: React.FC<AchievementModalProps> = ({ isOpen, onClose }) => {
  const { achievements, stats, rank, score } = useEco()

  if (!isOpen) return null

  const handleClose = () => {
    sound.playTap()
    onClose()
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(2, 20, 15, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: '28px 32px',
          position: 'relative',
          border: '1px solid rgba(52, 211, 153, 0.35)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.2)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={28} color="var(--accent-amber)" />
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
                Eco Hall of Trophies
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Your conservation milestones, planetary impact stats, and ranks
            </p>
          </div>
          <button 
            className="btn btn-icon" 
            onClick={handleClose}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Global Impact Dashboard */}
        <div style={{ 
          background: 'rgba(0, 0, 0, 0.3)', 
          borderRadius: 'var(--radius-md)', 
          padding: '16px 20px', 
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--emerald-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Real-World Environmental Impact
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px'
          }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>{stats.totalItemsRecycled}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Items Recycled</div>
            </div>
            <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>{stats.litersWaterSaved.toLocaleString()} L</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Water Conserved</div>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>{stats.wattsEnergySaved.toLocaleString()} W</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Energy Saved</div>
            </div>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4ade80' }}>{stats.treesPlanted}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Trees Planted</div>
            </div>
            <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#c084fc' }}>{stats.speciesProtected}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Species Shielded</div>
            </div>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#67e8f9' }}>{stats.co2ReducedKg.toLocaleString()} kg</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CO2 Prevented</div>
            </div>
          </div>
        </div>

        {/* Rank Progression Path */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--emerald-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Eco Ranks Roadmap
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: '8px' }}>
            {ECO_RANKS.map((r) => {
              const isCurrent = rank.level === r.level
              const isAchieved = score >= r.minScore
              return (
                <div 
                  key={r.level}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center',
                    background: isCurrent 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(6, 78, 59, 0.5) 100%)' 
                      : isAchieved 
                        ? 'rgba(0, 0, 0, 0.25)' 
                        : 'rgba(0, 0, 0, 0.15)',
                    border: isCurrent 
                      ? '1px solid var(--emerald-400)' 
                      : isAchieved 
                        ? '1px solid rgba(52, 211, 153, 0.2)' 
                        : '1px dashed rgba(255, 255, 255, 0.1)',
                    opacity: isAchieved ? 1 : 0.45
                  }}
                >
                  <div style={{ fontSize: '1.4rem' }}>{r.badge}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isCurrent ? '#34d399' : '#ffffff', marginTop: '4px' }}>
                    {r.title}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    {r.minScore} pts
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Badges Grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--emerald-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Badges & Achievements ({unlockedCount}/{achievements.length})
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {achievements.map((ach) => (
              <div 
                key={ach.id}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: ach.unlocked 
                    ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(4, 44, 34, 0.6) 100%)' 
                    : 'rgba(0, 0, 0, 0.25)',
                  border: ach.unlocked 
                    ? '1px solid rgba(52, 211, 153, 0.4)' 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  fontSize: '1.8rem',
                  filter: ach.unlocked ? 'none' : 'grayscale(100%) opacity(35%)',
                  background: 'rgba(0,0,0,0.2)',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  flexShrink: 0
                }}>
                  {ach.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 700, 
                      color: ach.unlocked ? '#ffffff' : 'rgba(255, 255, 255, 0.5)' 
                    }}>
                      {ach.title}
                    </div>
                    {ach.unlocked ? (
                      <CheckCircle2 size={14} color="var(--emerald-400)" />
                    ) : (
                      <Lock size={12} color="rgba(255, 255, 255, 0.3)" />
                    )}
                  </div>
                  <p style={{ 
                    fontSize: '0.72rem', 
                    color: ach.unlocked ? 'var(--text-muted)' : 'rgba(255, 255, 255, 0.35)', 
                    marginTop: '4px',
                    lineHeight: 1.3
                  }}>
                    {ach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Close */}
        <div style={{ marginTop: '28px', textAlign: 'center' }}>
          <button className="btn btn-primary" onClick={handleClose} style={{ padding: '10px 32px' }}>
            Back to Planet
          </button>
        </div>
      </div>
    </div>
  )
}
