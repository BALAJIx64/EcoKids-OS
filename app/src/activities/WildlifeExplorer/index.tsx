import React, { useState } from 'react'
import { useEco } from '../../context/EcoContext'
import { sound } from '../../utils/audio'
import { 
  RotateCcw, 
  Star, 
  ArrowRight, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface Animal {
  id: string
  name: string
  scientificName: string
  icon: string
  correctBiomeId: string
  adaptation: string
  threat: string
  conservationShield: string
  shieldActionText: string
  isMatched: boolean
  isShielded: boolean
}

interface Biome {
  id: string
  name: string
  climate: string
  icon: string
  bgGradient: string
  accentColor: string
}

const BIOMES: Biome[] = [
  { id: 'rainforest', name: 'Tropical Rainforest', climate: 'Warm, humid, high rainfall', icon: '🌴', bgGradient: 'linear-gradient(135deg, rgba(6, 78, 59, 0.4) 0%, rgba(2, 44, 34, 0.7) 100%)', accentColor: '#34d399' },
  { id: 'arctic', name: 'Arctic Tundra & Ice', climate: 'Freezing, permafrost, pack ice', icon: '❄️', bgGradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.3) 0%, rgba(3, 105, 161, 0.6) 100%)', accentColor: '#7dd3fc' },
  { id: 'reef', name: 'Coral Reef Marine Sanctuary', climate: 'Warm sunlit tropical ocean', icon: '🪸', bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(2, 132, 199, 0.6) 100%)', accentColor: '#38bdf8' },
  { id: 'savanna', name: 'African Savanna', climate: 'Warm grasslands, wet/dry seasons', icon: '🦁', bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(180, 83, 9, 0.6) 100%)', accentColor: '#fbbf24' },
  { id: 'mountain', name: 'Temperate Forest & Mountains', climate: 'Seasonal, conifers, steep slopes', icon: '⛰️', bgGradient: 'linear-gradient(135deg, rgba(109, 40, 217, 0.3) 0%, rgba(76, 29, 149, 0.6) 100%)', accentColor: '#c084fc' },
]

const INITIAL_ANIMALS: Animal[] = [
  {
    id: 'polar_bear',
    name: 'Polar Bear',
    scientificName: 'Ursus maritimus',
    icon: '🐻‍❄️',
    correctBiomeId: 'arctic',
    adaptation: 'Translucent hollow guard hairs channel sunlight straight to black skin to maximize heat absorption on freezing sea ice.',
    threat: 'Rapidly shrinking sea ice reduces seal hunting grounds, forcing bears to swim exhausting distances.',
    conservationShield: 'International Arctic Sea Ice Sanctuary & Renewable Transition',
    shieldActionText: 'Establish Arctic Marine Refuge',
    isMatched: false,
    isShielded: false,
  },
  {
    id: 'jaguar',
    name: 'Amazon Jaguar',
    scientificName: 'Panthera onca',
    icon: '🐆',
    correctBiomeId: 'rainforest',
    adaptation: 'Possesses the most powerful bite force of any big cat relative to size, capable of piercing armored river turtle shells.',
    threat: 'Forest clearing for cattle and logging divides territories, leading to deadly highway vehicle strikes.',
    conservationShield: 'Canopy Wildlife Overpass Corridors & Protected Rainforest Corridors',
    shieldActionText: 'Build Vegetated Wildlife Corridors',
    isMatched: false,
    isShielded: false,
  },
  {
    id: 'sea_turtle',
    name: 'Green Sea Turtle',
    scientificName: 'Chelonia mydas',
    icon: '🐢',
    correctBiomeId: 'reef',
    adaptation: 'Equipped with specialized salt glands behind their eyes that excrete excess ocean salt, making them look like they are crying.',
    threat: 'Plastic grocery bags and floating plastic waste are frequently mistaken for edible jellyfish.',
    conservationShield: 'Single-Use Plastics Ban & Marine Protected Sanctuary Patrols',
    shieldActionText: 'Deploy Ocean Cleanup & Plastic Ban',
    isMatched: false,
    isShielded: false,
  },
  {
    id: 'elephant',
    name: 'Savanna Elephant',
    scientificName: 'Loxodonta africana',
    icon: '🐘',
    correctBiomeId: 'savanna',
    adaptation: 'Enormous ears act as cooling radiators; blood pumped through thousands of capillary veins cools body temperatures by up to 5°C.',
    threat: 'Severe seasonal droughts dry up natural watering holes, forcing herds into dangerous conflict with farms.',
    conservationShield: 'Solar-Powered Borehole Water Reservoirs & Community Range Scouts',
    shieldActionText: 'Install Solar Water Boreholes',
    isMatched: false,
    isShielded: false,
  },
  {
    id: 'lynx',
    name: 'Eurasian Mountain Lynx',
    scientificName: 'Lynx lynx',
    icon: '🐱',
    correctBiomeId: 'mountain',
    adaptation: 'Massive, thickly padded paws function like natural snowshoes, allowing silent stealth walking on deep winter snowdrifts.',
    threat: 'Illegal clearcutting of old-growth conifers destroys denning hollows for newborn lynx kittens.',
    conservationShield: 'Old-Growth National Park Sanctuary & Drone Anti-Logging Patrols',
    shieldActionText: 'Establish Strict National Park Sanctuary',
    isMatched: false,
    isShielded: false,
  },
]

export const WildlifeExplorer: React.FC = () => {
  const { completeActivity, setActiveActivity } = useEco()

  const [animals, setAnimals] = useState<Animal[]>(INITIAL_ANIMALS)
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(INITIAL_ANIMALS[0].id)
  const [isCompleted, setIsCompleted] = useState<boolean>(false)

  const activeAnimal = animals.find(a => a.id === selectedAnimalId) || animals[0]
  const allShielded = animals.every(a => a.isShielded)

  const handleMatchBiome = (biomeId: string) => {
    if (activeAnimal.isMatched) return

    if (biomeId === activeAnimal.correctBiomeId) {
      sound.playSuccess()
      setAnimals(prev => prev.map(a => a.id === activeAnimal.id ? { ...a, isMatched: true } : a))
    } else {
      sound.playError()
    }
  }

  const handleDeployShield = (animalId: string) => {
    sound.playSuccess()

    setAnimals(prev => {
      const updated = prev.map(a => a.id === animalId ? { ...a, isShielded: true } : a)
      if (updated.every(a => a.isMatched && a.isShielded)) {
        setTimeout(() => handleFinishGame(updated), 700)
      }
      return updated
    })
  }

  const handleFinishGame = (finalAnimals: Animal[]) => {
    setIsCompleted(true)
    sound.playFanfare()
    try {
      confetti({ particleCount: 110, spread: 85, origin: { y: 0.6 } })
    } catch {}

    const points = 900
    completeActivity(
      'wildlife',
      points,
      3,
      { speciesProtected: finalAnimals.length },
      ['wildlife_champion']
    )
  }

  const handleRestart = () => {
    sound.playTap()
    setAnimals(INITIAL_ANIMALS)
    setSelectedAnimalId(INITIAL_ANIMALS[0].id)
    setIsCompleted(false)
  }

  return (
    <div className="container" style={{ maxWidth: '980px', paddingBottom: '40px' }}>
      {/* Header Bar */}
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
          borderLeft: '5px solid var(--emerald-400)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-emerald">Biodiversity & Ecosystems</span>
            <span className="badge badge-sky">
              Shielded: {animals.filter(a => a.isShielded).length}/{animals.length} Species
            </span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
            Wildlife Explorer: Habitats & Threat Shields
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Match animals to their biomes, explore unique adaptations, and deploy conservation action shields!
          </p>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(192, 132, 252, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Sanctuary Status
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#c084fc', lineHeight: 1.1 }}>
            {allShielded ? '100% Protected' : `${animals.filter(a => a.isMatched).length} / 5 Biomes`}
          </div>
        </div>
      </div>

      {!isCompleted ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 1.6fr', gap: '24px' }}>
          {/* Left: Animal Selection Strip */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d8b4fe', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Endangered Wildlife Field Guide
            </h3>

            {animals.map((animal) => {
              const isSelected = animal.id === activeAnimal.id
              return (
                <div
                  key={animal.id}
                  onClick={() => {
                    sound.playTap()
                    setSelectedAnimalId(animal.id)
                  }}
                  className="glass-card"
                  style={{
                    padding: '14px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: isSelected ? '2px solid #a855f7' : undefined,
                    background: isSelected ? 'rgba(168, 85, 247, 0.2)' : undefined
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '2rem' }}>{animal.icon}</div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
                        {animal.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {animal.scientificName}
                      </div>
                    </div>
                  </div>

                  <div>
                    {animal.isShielded ? (
                      <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                        <ShieldCheck size={12} /> Shielded
                      </span>
                    ) : animal.isMatched ? (
                      <span className="badge badge-sky" style={{ fontSize: '0.65rem' }}>
                        Matched
                      </span>
                    ) : (
                      <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                        Needs Biome
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right: Active Animal Exploration & Biome Choice */}
          <div>
            <div 
              className="glass-panel"
              style={{
                padding: '28px',
                border: '1px solid rgba(192, 132, 252, 0.35)',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '16px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(192, 132, 252, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem'
                }}>
                  {activeAnimal.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>
                    {activeAnimal.name}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#c084fc', fontStyle: 'italic' }}>
                    {activeAnimal.scientificName}
                  </div>
                </div>
              </div>

              {/* Step 1: Biome Matching */}
              {!activeAnimal.isMatched ? (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                    Step 1: Match to Native Biome
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    Where does this species naturally thrive? Click the correct planetary biome below:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                    {BIOMES.map((biome) => (
                      <button
                        key={biome.id}
                        onClick={() => handleMatchBiome(biome.id)}
                        className="btn btn-secondary"
                        style={{
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          justifyContent: 'flex-start',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <span style={{ fontSize: '1.5rem' }}>{biome.icon}</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff' }}>{biome.name}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{biome.climate}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Step 2: Biological Adaptation & Threat Shield */
                <div>
                  {/* Biome confirmed tag */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid var(--emerald-400)',
                    color: 'var(--emerald-300)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginBottom: '16px'
                  }}>
                    <CheckCircle2 size={14} /> Native Biome Verified: {BIOMES.find(b => b.id === activeAnimal.correctBiomeId)?.name}
                  </div>

                  {/* Evolutionary Adaptation Card */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '4px' }}>
                      🌟 Evolutionary Adaptation
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                      {activeAnimal.adaptation}
                    </p>
                  </div>

                  {/* Environmental Threat Card */}
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', marginBottom: '4px' }}>
                      <AlertTriangle size={14} /> Current Environmental Threat
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#fecaca', lineHeight: 1.4 }}>
                      {activeAnimal.threat}
                    </p>
                  </div>

                  {/* Shield Action */}
                  {activeAnimal.isShielded ? (
                    <div style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                      textAlign: 'center',
                      color: 'var(--emerald-400)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <ShieldCheck size={20} />
                      <span>Conservation Shield Active: {activeAnimal.conservationShield}</span>
                    </div>
                  ) : (
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleDeployShield(activeAnimal.id)}
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: 'linear-gradient(135deg, #a855f7 0%, #6d28d9 100%)',
                        boxShadow: '0 4px 18px rgba(168, 85, 247, 0.4)'
                      }}
                    >
                      <ShieldCheck size={18} />
                      <span>Deploy: {activeAnimal.shieldActionText}</span>
                    </button>
                  )}
                </div>
              )}
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
            border: '2px solid #a855f7',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(168, 85, 247, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            border: '2px solid #a855f7'
          }}>
            <Award size={44} color="#c084fc" />
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
            Planetary Wildlife Shield Champion!
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            You matched every animal to its correct biome and enacted 5 vital conservation shields across the globe!
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
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '28px'
          }}>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#c084fc' }}>
                5 / 5
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Species Protected</div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--emerald-400)' }}>
                900 pts
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Eco Score Rewarded</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={handleRestart}>
              <RotateCcw size={16} />
              <span>Explore Again</span>
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
