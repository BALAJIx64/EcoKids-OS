import React, { useState } from 'react'
import { useEco } from '../../context/EcoContext'
import { sound } from '../../utils/audio'
import { 
  Droplets, 
  CheckCircle2, 
  RotateCcw, 
  Star, 
  ArrowRight, 
  AlertTriangle,
  Wrench,
  Info
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface WaterStation {
  id: string
  name: string
  location: string
  icon: string
  initialWasteLiters: number // liters per day wasted
  currentStatus: string
  fixedStatus: string
  issueDescription: string
  fixAction: string
  educationalTrivia: string
  isFixed: boolean
}

const INITIAL_STATIONS: WaterStation[] = [
  {
    id: 'kitchen_tap',
    name: 'Kitchen Sink Faucet',
    location: 'Kitchen',
    icon: '🚰',
    initialWasteLiters: 35,
    currentStatus: 'Dripping rapidly (1 drip/sec)',
    fixedStatus: 'Ceramic valve tightened + 1.5 GPM aerator installed',
    issueDescription: 'A tap dripping once per second wastes thousands of liters of treated drinking water down the drain every month.',
    fixAction: 'Install Aerator & Tighten Valve',
    educationalTrivia: 'Adding an aerator mixes air into the water stream, giving full pressure while cutting water flow by 40%!',
    isFixed: false,
  },
  {
    id: 'toilet_leak',
    name: 'Master Bathroom Toilet',
    location: 'Bathroom',
    icon: '🚽',
    initialWasteLiters: 180,
    currentStatus: 'Silent phantom leak (flapper worn)',
    fixedStatus: 'New silicone flapper + dual-flush converter',
    issueDescription: 'A cracked rubber flapper allows tank water to continuously seep into the bowl unseen. Food coloring dye tests spot it instantly.',
    fixAction: 'Replace Flapper & Install Dual-Flush',
    educationalTrivia: 'A silent toilet leak can waste up to 200 liters of potable water every day without making a loud sound.',
    isFixed: false,
  },
  {
    id: 'shower_head',
    name: 'Family Shower',
    location: 'Bathroom',
    icon: '🚿',
    initialWasteLiters: 120,
    currentStatus: 'Old high-flow head (15 L/min)',
    fixedStatus: 'Low-flow showerhead + 4-minute timer',
    issueDescription: 'Taking 12-minute showers with an older showerhead uses more water than a full bathtub!',
    fixAction: 'Upgrade to Eco Showerhead & 4-Min Timer',
    educationalTrivia: 'Cutting your shower down to 4 minutes saves enough water to fill hundreds of water bottles every week.',
    isFixed: false,
  },
  {
    id: 'garden_sprinkler',
    name: 'Lawn Garden Sprinkler',
    location: 'Backyard',
    icon: '🌱',
    initialWasteLiters: 250,
    currentStatus: 'Noon overhead spraying (high evaporation)',
    fixedStatus: 'Subsurface drip irrigation + wood mulch',
    issueDescription: 'Watering lawns in direct midday sunlight causes up to 60% of water to evaporate before ever reaching root systems.',
    fixAction: 'Install Drip System & Wood Mulch',
    educationalTrivia: 'Organic wood mulch retains moisture in the soil, keeps roots cool, and prevents weeds naturally.',
    isFixed: false,
  },
  {
    id: 'roof_downspout',
    name: 'Roof Rain Downspout',
    location: 'Exterior Roof',
    icon: '🌧️',
    initialWasteLiters: 100,
    currentStatus: 'Rainwater lost to pavement runoff',
    fixedStatus: 'Connected 250L rain barrel with filter',
    issueDescription: 'Stormwater rushing off roofs carries pollutants into rivers and causes erosion instead of being utilized.',
    fixAction: 'Connect 250L Rain Harvesting Barrel',
    educationalTrivia: 'Rainwater is naturally soft and free of chlorine, making it the healthiest water for flowers and vegetable gardens.',
    isFixed: false,
  },
]

export const WaterGuardian: React.FC = () => {
  const { completeActivity, setActiveActivity } = useEco()

  const [stations, setStations] = useState<WaterStation[]>(INITIAL_STATIONS)
  const [selectedStation, setSelectedStation] = useState<WaterStation | null>(INITIAL_STATIONS[0])
  const [isCompleted, setIsCompleted] = useState<boolean>(false)

  const fixedCount = stations.filter(s => s.isFixed).length
  const currentWaste = stations.reduce((acc, s) => acc + (s.isFixed ? 0 : s.initialWasteLiters), 0)
  const totalSaved = stations.reduce((acc, s) => acc + (s.isFixed ? s.initialWasteLiters : 0), 0)

  const handleFixStation = (stationId: string) => {
    sound.playWaterDrop()

    setStations(prev => {
      const updated = prev.map(s => {
        if (s.id === stationId) {
          return { ...s, isFixed: true }
        }
        return s
      })

      // Check if all are now fixed
      const allDone = updated.every(s => s.isFixed)
      if (allDone) {
        setTimeout(() => {
          handleAllFixed(updated)
        }, 600)
      }

      return updated
    })

    if (selectedStation?.id === stationId) {
      setSelectedStation(prev => prev ? { ...prev, isFixed: true } : null)
    }
  }

  const handleAllFixed = (finalStations: WaterStation[]) => {
    setIsCompleted(true)
    sound.playFanfare()
    try {
      confetti({ particleCount: 110, spread: 85, origin: { y: 0.6 } })
    } catch {}

    const totalLitersSaved = finalStations.reduce((acc, s) => acc + s.initialWasteLiters, 0)
    const points = 750

    completeActivity(
      'water',
      points,
      3, // 3 stars
      { litersWaterSaved: totalLitersSaved },
      ['water_hero']
    )
  }

  const handleRestart = () => {
    sound.playTap()
    setStations(INITIAL_STATIONS)
    setSelectedStation(INITIAL_STATIONS[0])
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
          borderLeft: '5px solid var(--sky-blue)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-sky">Household Water Audit</span>
            <span className="badge badge-emerald">Fixed: {fixedCount}/5 Stations</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
            Water Guardian: Leak Detective & Conservation
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Inspect home fixtures, track hidden water loss, and install smart conservation upgrades!
          </p>
        </div>

        {/* Live Water Waste Dial */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(14, 165, 233, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Daily Water Loss
          </div>
          <div style={{ 
            fontSize: '1.6rem', 
            fontWeight: 900, 
            color: currentWaste === 0 ? 'var(--emerald-400)' : '#f87171',
            lineHeight: 1.1
          }}>
            {currentWaste} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>L / day</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            {totalSaved} Liters Saved Today
          </div>
        </div>
      </div>

      {!isCompleted ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '24px' }}>
          {/* Left Column: Station List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--sky-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Home Water Inspection Zones
            </h3>
            {stations.map((station) => {
              const isSelected = selectedStation?.id === station.id
              return (
                <div
                  key={station.id}
                  onClick={() => {
                    sound.playTap()
                    setSelectedStation(station)
                  }}
                  className="glass-card"
                  style={{
                    padding: '16px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: isSelected ? '2px solid var(--sky-blue)' : undefined,
                    background: isSelected ? 'rgba(14, 165, 233, 0.18)' : undefined
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '2rem' }}>{station.icon}</div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                        {station.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {station.location}
                      </div>
                    </div>
                  </div>

                  <div>
                    {station.isFixed ? (
                      <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                        <CheckCircle2 size={13} /> Conserved
                      </span>
                    ) : (
                      <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                        <AlertTriangle size={13} /> -{station.initialWasteLiters} L/day
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Station Detail & Interactive Action */}
          <div>
            {selectedStation && (
              <div 
                className="glass-panel"
                style={{
                  padding: '28px',
                  position: 'sticky',
                  top: '90px',
                  border: '1px solid rgba(14, 165, 233, 0.35)',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)'
                }}
              >
                {/* Station Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'rgba(14, 165, 233, 0.15)',
                    border: '1px solid rgba(14, 165, 233, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem'
                  }}>
                    {selectedStation.icon}
                  </div>
                  <div>
                    <span className="badge badge-sky" style={{ marginBottom: '4px' }}>
                      {selectedStation.location}
                    </span>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                      {selectedStation.name}
                    </h3>
                  </div>
                </div>

                {/* Status Box */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Current Diagnostic
                  </div>
                  <div style={{ 
                    fontSize: '0.95rem', 
                    fontWeight: 700, 
                    color: selectedStation.isFixed ? 'var(--emerald-400)' : '#f87171',
                    margin: '4px 0 8px 0'
                  }}>
                    {selectedStation.isFixed ? `✅ ${selectedStation.fixedStatus}` : `⚠️ ${selectedStation.currentStatus}`}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
                    {selectedStation.issueDescription}
                  </p>
                </div>

                {/* Educational Insight */}
                <div style={{
                  background: 'rgba(14, 165, 233, 0.1)',
                  border: '1px solid rgba(14, 165, 233, 0.25)',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  <Info size={22} color="var(--sky-light)" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    <strong style={{ color: 'var(--sky-light)' }}>Eco Fact: </strong>
                    {selectedStation.educationalTrivia}
                  </div>
                </div>

                {/* Action Button */}
                {selectedStation.isFixed ? (
                  <div style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    textAlign: 'center',
                    color: 'var(--emerald-400)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle2 size={18} />
                    <span>Conservation Upgrade Active (+{selectedStation.initialWasteLiters} L Saved)</span>
                  </div>
                ) : (
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleFixStation(selectedStation.id)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'linear-gradient(135deg, var(--sky-blue) 0%, #0369a1 100%)',
                      boxShadow: '0 4px 18px rgba(14, 165, 233, 0.4)'
                    }}
                  >
                    <Wrench size={18} />
                    <span>{selectedStation.fixAction}</span>
                  </button>
                )}
              </div>
            )}
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
            border: '2px solid var(--sky-blue)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(14, 165, 233, 0.3)'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(14, 165, 233, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            border: '2px solid var(--sky-blue)'
          }}>
            <Droplets size={44} color="var(--sky-light)" />
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
            Certified Water Guardian!
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            You eliminated 100% of household water waste, repaired every faulty valve, and saved over 600 liters of water per day!
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
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--sky-light)' }}>
                {totalSaved.toLocaleString()} L
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Water Conserved</div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fbbf24' }}>
                750 pts
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Eco Score Rewarded</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={handleRestart}>
              <RotateCcw size={16} />
              <span>Inspect Again</span>
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
