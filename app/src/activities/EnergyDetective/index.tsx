import React, { useState } from 'react'
import { useEco } from '../../context/EcoContext'
import { sound } from '../../utils/audio'
import { 
  Zap, 
  CheckCircle2, 
  RotateCcw, 
  Star, 
  ArrowRight, 
  Sun,
  Tv,
  Lightbulb,
  Fan,
  ThermometerSnowflake,
  Info,
  Award
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface EnergyDevice {
  id: string
  name: string
  room: string
  icon: React.ReactNode
  initialWatts: number
  optimizedWatts: number
  issueDescription: string
  solutionDescription: string
  trivia: string
  isOptimized: boolean
}

export const EnergyDetective: React.FC = () => {
  const { completeActivity, setActiveActivity } = useEco()

  const [devices, setDevices] = useState<EnergyDevice[]>([
    {
      id: 'incandescent',
      name: 'Old Incandescent Light Fixtures',
      room: 'Living Room & Hallway',
      icon: <Lightbulb size={28} color="#fbbf24" />,
      initialWatts: 480, // 8 x 60W
      optimizedWatts: 64, // 8 x 8W LED
      issueDescription: '8 old incandescent bulbs are burning 480 Watts! Over 90% of their electricity is wasted as heat instead of light.',
      solutionDescription: 'Upgrade all fixtures to high-efficiency Warm LED bulbs that produce identical brightness using 85% less electricity.',
      trivia: 'LED bulbs last up to 25 times longer than incandescent bulbs, saving money and reducing manufacturing waste.',
      isOptimized: false,
    },
    {
      id: 'vampire_tv',
      name: 'TV & Console Vampire Standby',
      room: 'Media Center',
      icon: <Tv size={28} color="#f59e0b" />,
      initialWatts: 75,
      optimizedWatts: 0,
      issueDescription: 'Televisions and gaming consoles draw "phantom load" even when turned off to keep clocks and standby sensors active 24/7.',
      solutionDescription: 'Plug media devices into a Smart Surge Strip that completely cuts power when appliances are turned off.',
      trivia: 'Vampire power accounts for nearly 10% of an average home\'s electric bill across the globe!',
      isOptimized: false,
    },
    {
      id: 'window_ac',
      name: 'AC Unit with Cracked Window',
      room: 'Master Bedroom',
      icon: <ThermometerSnowflake size={28} color="#38bdf8" />,
      initialWatts: 1800,
      optimizedWatts: 900,
      issueDescription: 'The air conditioner is churning at maximum power while a cracked window lets hot summer air pour right back inside!',
      solutionDescription: 'Latch the window shut, seal weatherstripping, and set smart eco-thermostat to 24°C.',
      trivia: 'For every 1°C you adjust your thermostat closer to the outdoor temperature, you save 3–5% on cooling energy.',
      isOptimized: false,
    },
    {
      id: 'empty_fan',
      name: 'Ceiling Fan in Empty Study',
      room: 'Home Office',
      icon: <Fan size={28} color="#a855f7" />,
      initialWatts: 80,
      optimizedWatts: 0,
      issueDescription: 'A ceiling fan has been left whirring all day in an empty room with nobody inside.',
      solutionDescription: 'Turn the fan off! Fans cool people by evaporating skin moisture via wind chill, not empty rooms.',
      trivia: 'Leaving a ceiling fan on in an unoccupied room doesn\'t cool the room down—the motor actually warms the air slightly!',
      isOptimized: false,
    },
    {
      id: 'solar_roof',
      name: 'Bare Rooftop (No Generation)',
      room: 'Rooftop',
      icon: <Sun size={28} color="#eab308" />,
      initialWatts: 1000,
      optimizedWatts: -500, // Generates clean power!
      issueDescription: 'The open sunny roof is doing nothing while the home relies entirely on fossil-fueled grid power.',
      solutionDescription: 'Mount an array of high-efficiency rooftop photovoltaic solar panels to generate clean energy and export power.',
      trivia: 'More solar energy hits the Earth in 1 single hour than the entire human population uses in a whole year!',
      isOptimized: false,
    },
  ])

  const [selectedDevice, setSelectedDevice] = useState<EnergyDevice>(devices[0])
  const [isCompleted, setIsCompleted] = useState<boolean>(false)

  const currentWatts = devices.reduce((acc, d) => acc + (d.isOptimized ? d.optimizedWatts : d.initialWatts), 0)
  const totalWattsSaved = devices.reduce((acc, d) => acc + (d.isOptimized ? (d.initialWatts - d.optimizedWatts) : 0), 0)
  const optimizedCount = devices.filter(d => d.isOptimized).length

  const handleOptimizeDevice = (deviceId: string) => {
    sound.playSwitch()

    setDevices(prev => {
      const updated = prev.map(d => {
        if (d.id === deviceId) {
          return { ...d, isOptimized: true }
        }
        return d
      })

      const allDone = updated.every(d => d.isOptimized)
      if (allDone) {
        setTimeout(() => {
          handleAllDone(updated)
        }, 600)
      }

      return updated
    })

    if (selectedDevice.id === deviceId) {
      setSelectedDevice(prev => ({ ...prev, isOptimized: true }))
    }
  }

  const handleAllDone = (finalDevices: EnergyDevice[]) => {
    setIsCompleted(true)
    sound.playFanfare()
    try {
      confetti({ particleCount: 110, spread: 85, origin: { y: 0.6 } })
    } catch {}

    const totalSaved = finalDevices.reduce((acc, d) => acc + (d.initialWatts - d.optimizedWatts), 0)
    const points = 800

    completeActivity(
      'energy',
      points,
      3,
      { wattsEnergySaved: totalSaved },
      ['energy_detective']
    )
  }

  const handleRestart = () => {
    sound.playTap()
    setDevices(prev => prev.map(d => ({ ...d, isOptimized: false })))
    setSelectedDevice(devices[0])
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
          borderLeft: '5px solid var(--accent-amber)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-amber">Home Wattage Audit</span>
            <span className="badge badge-emerald">Audited: {optimizedCount}/5 Zones</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
            Energy Detective: Vampire Power & Wattage Audit
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Defeat phantom vampire loads, switch to LEDs, and transform the house into a clean energy producer!
          </p>
        </div>

        {/* Live Wattmeter */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 22px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Live Household Load
          </div>
          <div style={{ 
            fontSize: '1.7rem', 
            fontWeight: 900, 
            color: currentWatts <= 500 ? 'var(--emerald-400)' : '#fbbf24',
            lineHeight: 1.1
          }}>
            {currentWatts} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Watts</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--emerald-400)', fontWeight: 600 }}>
            ⚡ -{totalWattsSaved} Watts Reduced
          </div>
        </div>
      </div>

      {!isCompleted ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '24px' }}>
          {/* Left Column: Device Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fde68a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Household Power Checkpoints
            </h3>
            {devices.map((device) => {
              const isSelected = selectedDevice.id === device.id
              return (
                <div
                  key={device.id}
                  onClick={() => {
                    sound.playTap()
                    setSelectedDevice(device)
                  }}
                  className="glass-card"
                  style={{
                    padding: '16px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: isSelected ? '2px solid var(--accent-amber)' : undefined,
                    background: isSelected ? 'rgba(245, 158, 11, 0.18)' : undefined
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {device.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
                        {device.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {device.room}
                      </div>
                    </div>
                  </div>

                  <div>
                    {device.isOptimized ? (
                      <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                        <CheckCircle2 size={13} /> {device.optimizedWatts}W
                      </span>
                    ) : (
                      <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                        {device.initialWatts}W Draw
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Device Inspection & Eco Upgrade */}
          <div>
            <div 
              className="glass-panel"
              style={{
                padding: '28px',
                position: 'sticky',
                top: '90px',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {selectedDevice.icon}
                </div>
                <div>
                  <span className="badge badge-amber" style={{ marginBottom: '4px' }}>
                    {selectedDevice.room}
                  </span>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                    {selectedDevice.name}
                  </h3>
                </div>
              </div>

              {/* Status Comparison */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '18px'
              }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.12)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#fca5a5', textTransform: 'uppercase', fontWeight: 700 }}>Wasteful Load</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f87171' }}>{selectedDevice.initialWatts} W</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#86efac', textTransform: 'uppercase', fontWeight: 700 }}>Optimized Load</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#34d399' }}>{selectedDevice.optimizedWatts} W</div>
                </div>
              </div>

              {/* Issue & Solution Description */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '18px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Energy Investigation
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.45, marginBottom: '10px' }}>
                  {selectedDevice.issueDescription}
                </p>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--emerald-400)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Smart Solution
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  {selectedDevice.solutionDescription}
                </p>
              </div>

              {/* Eco Trivia */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                gap: '12px',
                marginBottom: '22px'
              }}>
                <Info size={20} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--accent-amber)' }}>Did you know? </strong>
                  {selectedDevice.trivia}
                </div>
              </div>

              {/* Action Button */}
              {selectedDevice.isOptimized ? (
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
                  <span>Efficiency Upgrade Active (-{selectedDevice.initialWatts - selectedDevice.optimizedWatts} W Saved)</span>
                </div>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={() => handleOptimizeDevice(selectedDevice.id)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, var(--accent-amber) 0%, #d97706 100%)',
                    boxShadow: '0 4px 18px rgba(245, 158, 11, 0.4)'
                  }}
                >
                  <Zap size={18} />
                  <span>Apply Energy-Saving Upgrade</span>
                </button>
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
            border: '2px solid var(--accent-amber)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(245, 158, 11, 0.3)'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            border: '2px solid var(--accent-amber)'
          }}>
            <Award size={44} color="var(--accent-amber)" />
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
            Watt Whisperer Certified!
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            You eliminated phantom vampire electricity, upgraded to high-efficiency LEDs, sealed thermal leaks, and powered the roof with solar!
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
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fbbf24' }}>
                {totalWattsSaved} W
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Continuous Power Cut</div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--emerald-400)' }}>
                800 pts
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Eco Score Rewarded</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={handleRestart}>
              <RotateCcw size={16} />
              <span>Audit Again</span>
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
