import React, { useState } from 'react'
import { useEco } from '../../context/EcoContext'
import { sound } from '../../utils/audio'
import { 
  Trees, 
  RotateCcw, 
  Star, 
  ArrowRight 
} from 'lucide-react'
import confetti from 'canvas-confetti'

type PlantType = 'oak' | 'birch' | 'berry' | 'fern'

interface PlantOption {
  type: PlantType
  name: string
  strata: string
  icon: string
  biodiversityBonus: number
  carbonBonus: number
  description: string
}

const PLANT_OPTIONS: PlantOption[] = [
  {
    type: 'oak',
    name: 'Mighty Native Oak',
    strata: 'Upper Canopy',
    icon: '🌳',
    biodiversityBonus: 15,
    carbonBonus: 25,
    description: 'An ecological keystone tree that supports over 500 insect and bird species.',
  },
  {
    type: 'birch',
    name: 'Pioneer Silver Birch',
    strata: 'Pioneer Canopy',
    icon: '🌲',
    biodiversityBonus: 12,
    carbonBonus: 18,
    description: 'Fast-growing tree that enriches soil nutrients and creates shade for slower saplings.',
  },
  {
    type: 'berry',
    name: 'Wild Blackberry & Hazel',
    strata: 'Understory Shrub',
    icon: '🫐',
    biodiversityBonus: 14,
    carbonBonus: 10,
    description: 'Provides critical food and nesting habitat for small mammals, hedgehogs, and songbirds.',
  },
  {
    type: 'fern',
    name: 'Forest Ferns & Clover',
    strata: 'Forest Floor',
    icon: '🌿',
    biodiversityBonus: 10,
    carbonBonus: 8,
    description: 'Locks moisture into topsoil, prevents rain runoff erosion, and feeds native pollinators.',
  },
]

interface Plot {
  id: number
  plant: PlantOption | null
  health: number // 0-100
  threat: 'kudzu' | 'erosion' | null
}

const INITIAL_PLOTS: Plot[] = Array.from({ length: 9 }, (_, i) => ({
  id: i,
  plant: null,
  health: 30,
  threat: i === 2 ? 'kudzu' : i === 7 ? 'erosion' : null,
}))

export const ForestGuardian: React.FC = () => {
  const { completeActivity, setActiveActivity } = useEco()

  const [plots, setPlots] = useState<Plot[]>(INITIAL_PLOTS)
  const [selectedPlantType, setSelectedPlantType] = useState<PlantType>('oak')
  const [isCompleted, setIsCompleted] = useState<boolean>(false)

  const plantedCount = plots.filter(p => p.plant !== null).length
  const threatsActive = plots.filter(p => p.threat !== null).length

  // Calculate biodiversity index (0-100%)
  const biodiversityScore = Math.min(
    100,
    plots.reduce((acc, p) => acc + (p.plant ? p.plant.biodiversityBonus : 0), 0)
  )

  // Animals that visit based on biodiversity score
  const faunaVisitors = [
    { name: 'Honeybees & Pollinators', threshold: 25, icon: '🐝' },
    { name: 'Woodland Owls & Songbirds', threshold: 50, icon: '🦉' },
    { name: 'Red Squirrels', threshold: 75, icon: '🐿️' },
    { name: 'Majestic Woodland Deer', threshold: 95, icon: '🦌' },
  ]

  const handlePlantOnPlot = (plotId: number) => {
    const plot = plots.find(p => p.id === plotId)
    if (!plot) return

    // If threat exists, user must clear threat first!
    if (plot.threat) {
      sound.playError()
      return
    }

    sound.playLeafRustle()
    const plantObj = PLANT_OPTIONS.find(p => p.type === selectedPlantType)!

    setPlots(prev => {
      const updated = prev.map(p => {
        if (p.id === plotId) {
          return {
            ...p,
            plant: plantObj,
            health: 100,
          }
        }
        return p
      })

      // Check if all plots planted and all threats resolved
      const allPlanted = updated.every(p => p.plant !== null && p.threat === null)
      if (allPlanted) {
        setTimeout(() => handleFinishForest(updated), 700)
      }

      return updated
    })
  }

  const handleClearThreat = (plotId: number) => {
    sound.playLeafRustle()
    sound.playSuccess()

    setPlots(prev => {
      const updated = prev.map(p => {
        if (p.id === plotId) {
          return { ...p, threat: null, health: 60 }
        }
        return p
      })

      const allPlanted = updated.every(p => p.plant !== null && p.threat === null)
      if (allPlanted) {
        setTimeout(() => handleFinishForest(updated), 700)
      }

      return updated
    })
  }

  const handleFinishForest = (finalPlots: Plot[]) => {
    setIsCompleted(true)
    sound.playFanfare()
    try {
      confetti({ particleCount: 110, spread: 85, origin: { y: 0.6 } })
    } catch {}

    const treesPlanted = finalPlots.filter(p => p.plant !== null).length
    const points = 850

    completeActivity(
      'forest',
      points,
      3,
      { treesPlanted: treesPlanted },
      ['forest_builder']
    )
  }

  const handleRestart = () => {
    sound.playTap()
    setPlots(INITIAL_PLOTS)
    setIsCompleted(false)
  }

  return (
    <div className="container" style={{ maxWidth: '980px', paddingBottom: '40px' }}>
      {/* Header */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '20px 28px', 
          marginBottom: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderLeft: '5px solid var(--fresh-green)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-emerald">Agroforestry & Canopy Restorer</span>
            <span className="badge badge-sky">Plots Planted: {plantedCount}/9</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
            Forest Guardian: Biodiversity & Reforestation
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Clear invasive weeds, plant multi-layered native trees, and restore biodiversity to degraded land!
          </p>
        </div>

        {/* Biodiversity Meter */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 22px',
          textAlign: 'center',
          minWidth: '180px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Biodiversity Index
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 900, color: 'var(--fresh-green)', lineHeight: 1.1 }}>
            {biodiversityScore}%
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--emerald-300)' }}>
            {threatsActive > 0 ? `⚠️ ${threatsActive} Threats on Land` : '✨ Safe Canopy Habitat'}
          </div>
        </div>
      </div>

      {!isCompleted ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
          {/* Left Column: 3x3 Restoration Grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--light-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Degraded Valley Parcel (Click Plot to Plant)
              </h3>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px',
              background: 'rgba(6, 44, 34, 0.5)',
              padding: '18px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(52, 211, 153, 0.25)'
            }}>
              {plots.map((plot) => {
                return (
                  <div
                    key={plot.id}
                    onClick={() => {
                      if (plot.threat) {
                        handleClearThreat(plot.id)
                      } else {
                        handlePlantOnPlot(plot.id)
                      }
                    }}
                    className="glass-card"
                    style={{
                      aspectRatio: '1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-md)',
                      background: plot.threat
                        ? 'rgba(239, 68, 68, 0.2)'
                        : plot.plant
                          ? 'rgba(34, 197, 94, 0.22)'
                          : 'rgba(0, 0, 0, 0.35)',
                      border: plot.threat
                        ? '2px dashed #f87171'
                        : plot.plant
                          ? '2px solid rgba(34, 197, 94, 0.6)'
                          : '1px dashed rgba(255, 255, 255, 0.15)',
                      position: 'relative',
                      textAlign: 'center',
                      padding: '10px'
                    }}
                  >
                    {plot.threat ? (
                      <div>
                        <div style={{ fontSize: '2.4rem', marginBottom: '4px' }}>
                          {plot.threat === 'kudzu' ? '🌿⚠️' : '🪨⚠️'}
                        </div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fca5a5' }}>
                          {plot.threat === 'kudzu' ? 'Invasive Kudzu' : 'Soil Erosion'}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#ffffff', background: '#ef4444', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>
                          Click to Clear
                        </div>
                      </div>
                    ) : plot.plant ? (
                      <div>
                        <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
                          {plot.plant.icon}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                          {plot.plant.name}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--emerald-300)' }}>
                          {plot.plant.strata}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '4px' }}>
                          🌱
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Empty Soil
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--emerald-400)', fontWeight: 700, marginTop: '2px' }}>
                          Click to Plant
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Wildlife Attraction Bar */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              marginTop: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--light-green)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Woodland Wildlife Returning to the Forest
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {faunaVisitors.map((fauna) => {
                  const hasArrived = biodiversityScore >= fauna.threshold
                  return (
                    <div 
                      key={fauna.name}
                      style={{
                        textAlign: 'center',
                        padding: '8px',
                        background: hasArrived ? 'rgba(34, 197, 94, 0.15)' : 'rgba(0, 0, 0, 0.2)',
                        border: hasArrived ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 'var(--radius-sm)',
                        opacity: hasArrived ? 1 : 0.35
                      }}
                    >
                      <div style={{ fontSize: '1.8rem' }}>{fauna.icon}</div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: hasArrived ? '#ffffff' : 'var(--text-muted)', marginTop: '2px' }}>
                        {fauna.name}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: hasArrived ? 'var(--emerald-400)' : 'var(--text-dim)' }}>
                        {hasArrived ? 'Arrived!' : `${fauna.threshold}% req.`}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Plant Selection Nursery */}
          <div>
            <div 
              className="glass-panel"
              style={{
                padding: '24px',
                position: 'sticky',
                top: '90px',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)'
              }}
            >
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>
                Eco Nursery: Choose Seedling to Plant
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {PLANT_OPTIONS.map((opt) => {
                  const isSelected = selectedPlantType === opt.type
                  return (
                    <div
                      key={opt.type}
                      onClick={() => {
                        sound.playTap()
                        setSelectedPlantType(opt.type)
                      }}
                      className="glass-card"
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        border: isSelected ? '2px solid var(--fresh-green)' : undefined,
                        background: isSelected ? 'rgba(34, 197, 94, 0.2)' : undefined
                      }}
                    >
                      <div style={{ fontSize: '2.2rem' }}>{opt.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                            {opt.name}
                          </span>
                          <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                            +{opt.biodiversityBonus}% Bio
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {opt.strata}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Plant Detail Card */}
              {(() => {
                const activePlant = PLANT_OPTIONS.find(p => p.type === selectedPlantType)!
                return (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--light-green)', marginBottom: '4px' }}>
                      Ecosystem Role
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {activePlant.description}
                    </p>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      ) : (
        /* Completion Screen */
        <div 
          className="glass-panel"
          style={{
            padding: '40px 32px',
            textAlign: 'center',
            maxWidth: '640px',
            margin: '0 auto',
            border: '2px solid var(--fresh-green)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(34, 197, 94, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            border: '2px solid var(--fresh-green)'
          }}>
            <Trees size={44} color="var(--fresh-green)" />
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
            Forest Guardian Master!
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            You eliminated invasive species, reforested all canopy layers, and brought wildlife back to a flourishing woodland!
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
            {[1, 2, 3].map((starIndex) => (
              <Star 
                key={starIndex} 
                size={42} 
                fill="var(--accent-amber)" 
                color="var(--accent-amber)" 
              />
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '28px'
          }}>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--fresh-green)' }}>
                9 / 9
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Plots Reforested</div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8' }}>
                100%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Biodiversity Index</div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fbbf24' }}>
                850 pts
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Eco Score Rewarded</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={handleRestart}>
              <RotateCcw size={16} />
              <span>Plant Another Forest</span>
            </button>
            <button className="btn btn-primary" onClick={() => setActiveActivity(null)}>
              <span>Return to Planet Hub</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
