import React from 'react'
import { useEco } from '../context/EcoContext'
import { sound } from '../utils/audio'
import type { ActivityId } from '../types'
import { 
  Recycle, 
  Droplets, 
  Zap, 
  Trees, 
  Compass, 
  Globe2, 
  Star, 
  CheckCircle2, 
  Play, 
  Sparkles,
  Info
} from 'lucide-react'

const ACTIVITY_ICONS: Record<ActivityId, React.ReactNode> = {
  recycle: <Recycle size={32} color="#34d399" />,
  water: <Droplets size={32} color="#38bdf8" />,
  energy: <Zap size={32} color="#fbbf24" />,
  forest: <Trees size={32} color="#4ade80" />,
  wildlife: <Compass size={32} color="#c084fc" />,
  climate: <Globe2 size={32} color="#60a5fa" />,
  panda: <span style={{ fontSize: '2.2rem' }}>🐼</span>,
}

export const Hub: React.FC = () => {
  const { activities, setActiveActivity } = useEco()

  const completedCount = Object.values(activities).filter(a => a.completed).length
  const totalStars = Object.values(activities).reduce((acc, a) => acc + a.stars, 0)

  const handleLaunch = (id: ActivityId) => {
    sound.playTap()
    setActiveActivity(id)
  }

  return (
    <div className="container" style={{ paddingBottom: '40px' }}>
      {/* Hero Banner */}
      <div 
        className="glass-panel"
        style={{
          padding: '36px 40px',
          margin: '20px 0 32px 0',
          position: 'relative',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.14)',
          border: '1px solid rgba(255, 255, 255, 0.38)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.35)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span className="badge badge-emerald">
                <Sparkles size={13} /> Mission Control Hub
              </span>
              <span className="badge badge-amber">
                🎋 7 Eco Modules & Arcade Ready
              </span>
            </div>
            <h1 style={{ 
              fontSize: '2.4rem', 
              fontWeight: 900, 
              lineHeight: 1.15, 
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: '12px'
            }}>
              Protect Earth, One Choice at a Time
            </h1>
            <p style={{ fontSize: '1rem', color: '#ffffff', lineHeight: 1.5, opacity: 0.95 }}>
              Step into 7 hands-on environmental interactive simulations & games. Sprint through bamboo temples with Bao Bao the Panda, sort recycling, fix hidden leaks, uncover vampire wattage, reforest biodiversity, protect wildlife, and balance the global climate!
            </p>
          </div>

          {/* Quick Progress Summary Widget */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.16)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '20px 24px',
            minWidth: '240px',
            textAlign: 'center',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Planetary Restoration
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', margin: '4px 0' }}>
              {completedCount} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/ {Object.keys(activities).length}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '10px' }}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div 
                  key={i} 
                  style={{
                    width: '24px',
                    height: '6px',
                    borderRadius: '3px',
                    background: i <= completedCount ? 'var(--emerald-400)' : 'rgba(255, 255, 255, 0.15)'
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
              <Star size={16} fill="var(--accent-amber)" />
              <span>{totalStars} / 21 Stars Collected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Marquee Banner for Bamboo Dash */}
      <div 
        className="glass-card"
        onClick={() => handleLaunch('panda')}
        style={{
          cursor: 'pointer',
          padding: '24px 32px',
          marginBottom: '32px',
          background: 'rgba(255, 255, 255, 0.16)',
          border: '1px solid rgba(255, 255, 255, 0.45)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            fontSize: '3.6rem',
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.22)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
          }}>
            🐼
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                ⭐ NEW 7TH GAME &bull; 3D ARCADE
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                Procedural Soundtrack
              </span>
            </div>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.15 }}>
              Bamboo Dash: Temple Panda Run
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Sprint with Bao Bao! 3-lane reflex runner, jump logs, slide under torii gates, and collect bamboo as speed accelerates!
            </p>
          </div>
        </div>

        <button 
          className="btn btn-primary"
          style={{
            padding: '12px 28px',
            fontSize: '1rem',
            background: 'linear-gradient(135deg, var(--accent-orange) 0%, #ea580c 100%)',
            boxShadow: '0 4px 18px rgba(249, 115, 22, 0.5)'
          }}
        >
          <Play size={18} fill="#ffffff" />
          <span>Play Fullscreen Runner</span>
        </button>
      </div>

      {/* Activities Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {Object.values(activities).map((act) => {
          return (
            <div 
              key={act.id} 
              className="glass-card"
              style={{
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              {/* Top Accent Gradient Bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: act.gradient
              }} />

              <div>
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: `1px solid ${act.accentColor}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 20px ${act.accentColor}25`
                  }}>
                    {ACTIVITY_ICONS[act.id]}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span className="badge" style={{ 
                      background: `${act.accentColor}18`, 
                      color: act.accentColor, 
                      border: `1px solid ${act.accentColor}35` 
                    }}>
                      {act.category}
                    </span>
                    {act.completed && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--emerald-400)', fontWeight: 700 }}>
                        <CheckCircle2 size={13} /> Completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Subtitle */}
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                  {act.title}
                </h3>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: act.accentColor, marginBottom: '12px' }}>
                  {act.subtitle}
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '20px' }}>
                  {act.description}
                </p>
              </div>

              {/* Card Footer: Stars, Score, Play Button */}
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 0', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '16px'
                }}>
                  {/* Star Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {[1, 2, 3].map((starIndex) => (
                      <Star 
                        key={starIndex}
                        size={18}
                        fill={starIndex <= act.stars ? 'var(--accent-amber)' : 'none'}
                        color={starIndex <= act.stars ? 'var(--accent-amber)' : 'rgba(255, 255, 255, 0.25)'}
                      />
                    ))}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                      {act.stars}/3 Stars
                    </span>
                  </div>

                  {/* Best Score */}
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Best: <strong style={{ color: '#ffffff' }}>{act.bestScore}</strong> pts
                  </div>
                </div>

                {/* Launch Button */}
                <button 
                  className="btn btn-primary"
                  onClick={() => handleLaunch(act.id)}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    background: act.gradient,
                    border: 'none',
                    boxShadow: `0 4px 16px ${act.accentColor}40`
                  }}
                >
                  <Play size={18} fill="#ffffff" />
                  <span>{act.completed ? 'Replay Challenge' : 'Launch Activity'}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Daily Eco Wisdom Footer Card */}
      <div 
        className="glass-panel"
        style={{
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: 'rgba(255, 255, 255, 0.14)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Info size={20} color="var(--emerald-400)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--emerald-300)' }}>
            EcoKids Daily Planet Tip:
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Did you know? Recycling a single aluminum soda can saves enough electricity to power a TV for nearly 3 full hours!
          </div>
        </div>
      </div>
    </div>
  )
}
