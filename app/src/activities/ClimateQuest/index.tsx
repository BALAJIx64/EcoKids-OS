import React, { useState } from 'react'
import { useEco } from '../../context/EcoContext'
import { sound } from '../../utils/audio'
import { 
  Globe2, 
  RotateCcw, 
  Star, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Wind, 
  Train, 
  Sprout, 
  Building 
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface ClimateLever {
  id: string
  name: string
  sector: string
  icon: React.ReactNode
  currentPractice: string
  greenAlternative: string
  co2ReductionPpm: number
  trivia: string
  isActivated: boolean
}

interface WeatherQuizQuestion {
  id: number
  scenario: string
  correctAnswer: 'weather' | 'climate'
  explanation: string
}

const QUIZ_QUESTIONS: WeatherQuizQuestion[] = [
  {
    id: 1,
    scenario: 'It is unusually chilly and snowing outside today in mid-April.',
    correctAnswer: 'weather',
    explanation: 'Weather describes day-to-day atmospheric conditions in a local area. Short-term cold snaps happen even within a globally warming climate.',
  },
  {
    id: 2,
    scenario: 'Average global ocean surface temperatures have risen steadily over the last 50 consecutive years.',
    correctAnswer: 'climate',
    explanation: 'Climate refers to long-term patterns, trends, and averages observed over decades or centuries across the entire planet.',
  },
  {
    id: 3,
    scenario: 'A sudden afternoon rain shower soaked the playground for 20 minutes.',
    correctAnswer: 'weather',
    explanation: 'A brief rainfall event is standard local weather. It does not define the overall multi-decade regional climate.',
  },
]

export const ClimateQuest: React.FC = () => {
  const { completeActivity, setActiveActivity } = useEco()

  const [levers, setLevers] = useState<ClimateLever[]>([
    {
      id: 'clean_grid',
      name: 'Energy Grid Transition',
      sector: 'Energy Sector',
      icon: <Wind size={26} color="#38bdf8" />,
      currentPractice: 'Coal & Gas fossil fuel peaker power plants',
      greenAlternative: '100% Offshore Wind, Solar Arrays & Smart Grid Batteries',
      co2ReductionPpm: 32,
      trivia: 'Solar and wind are now cheaper to build and operate than existing coal power plants in almost every nation on Earth!',
      isActivated: false,
    },
    {
      id: 'mass_transit',
      name: 'Clean Mobility & Rail',
      sector: 'Transportation',
      icon: <Train size={26} color="#a855f7" />,
      currentPractice: 'Single-occupancy fossil fuel cars and congested highways',
      greenAlternative: 'High-speed electric light rail, bus rapid transit & bike highways',
      co2ReductionPpm: 24,
      trivia: 'A single electric commuter train can take up to 1,000 cars off congested highways, reducing tailpipe smog immediately.',
      isActivated: false,
    },
    {
      id: 'regenerative_ag',
      name: 'Rewilding & Mangrove Coastal Buffers',
      sector: 'Land & Agriculture',
      icon: <Sprout size={26} color="#22c55e" />,
      currentPractice: 'Clearing forests for monoculture and chemical soil depletion',
      greenAlternative: 'Restoring coastal mangrove forests & regenerative agriculture',
      co2ReductionPpm: 22,
      trivia: 'Coastal mangroves store up to 10 times more carbon per hectare in their muddy roots than terrestrial forests!',
      isActivated: false,
    },
    {
      id: 'green_buildings',
      name: 'Passive Eco-Architecture',
      sector: 'Built Environment',
      icon: <Building size={26} color="#fbbf24" />,
      currentPractice: 'Poorly insulated concrete buildings wasting heat and AC',
      greenAlternative: 'Passivhaus standards, electric heat pumps & green rooftop gardens',
      co2ReductionPpm: 18,
      trivia: 'Green rooftop gardens insulate buildings, absorb heavy storm runoff, and lower surrounding city temperatures by several degrees.',
      isActivated: false,
    },
  ])

  // Quiz state
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0)
  const [quizScore, setQuizScore] = useState<number>(0)
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null)
  const [isQuizFinished, setIsQuizFinished] = useState<boolean>(false)

  const [isCompleted, setIsCompleted] = useState<boolean>(false)

  // Simulation calculations
  const initialCO2 = 425 // ppm
  const totalReduction = levers.reduce((acc, l) => acc + (l.isActivated ? l.co2ReductionPpm : 0), 0)
  const currentCO2 = initialCO2 - totalReduction // Target: <= 350 ppm
  const currentTempAnomaly = Math.max(1.2, +(2.4 - (totalReduction * 0.0125)).toFixed(2))

  const allLeversActivated = levers.every(l => l.isActivated)

  const handleToggleLever = (leverId: string) => {
    sound.playSwitch()
    setLevers(prev => prev.map(l => l.id === leverId ? { ...l, isActivated: !l.isActivated } : l))
  }

  const handleQuizAnswer = (answer: 'weather' | 'climate') => {
    const question = QUIZ_QUESTIONS[currentQuizIndex]
    const isCorrect = answer === question.correctAnswer

    if (isCorrect) {
      sound.playSuccess()
      setQuizScore(s => s + 1)
    } else {
      sound.playError()
    }

    setQuizFeedback({
      isCorrect,
      explanation: question.explanation,
    })
  }

  const handleNextQuizQuestion = () => {
    sound.playTap()
    setQuizFeedback(null)
    if (currentQuizIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIndex(i => i + 1)
    } else {
      setIsQuizFinished(true)
      // If levers also all on, complete game!
      if (allLeversActivated) {
        finishClimateQuest()
      }
    }
  }

  const finishClimateQuest = () => {
    setIsCompleted(true)
    sound.playFanfare()
    try {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } })
    } catch {}

    const points = 1000
    completeActivity(
      'climate',
      points,
      3,
      { co2ReducedKg: 5000 },
      ['climate_stabilizer']
    )
  }

  const handleRestart = () => {
    sound.playTap()
    setLevers(prev => prev.map(l => ({ ...l, isActivated: false })))
    setCurrentQuizIndex(0)
    setQuizScore(0)
    setQuizFeedback(null)
    setIsQuizFinished(false)
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
            <span className="badge badge-sky">Planetary Equilibrium</span>
            <span className="badge badge-emerald">
              Levers: {levers.filter(l => l.isActivated).length}/{levers.length} Active
            </span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
            Climate Quest: Planetary Thermostat & Future Choices
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Switch planetary sectors to renewables, understand weather vs climate, and bring Earth under 350 ppm!
          </p>
        </div>

        {/* Live Gauges */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.45)',
            border: `1px solid ${currentCO2 <= 350 ? 'rgba(52, 211, 153, 0.5)' : 'rgba(239, 68, 68, 0.4)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '10px 18px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Atmospheric CO2
            </div>
            <div style={{ 
              fontSize: '1.6rem', 
              fontWeight: 900, 
              color: currentCO2 <= 350 ? 'var(--emerald-400)' : '#f87171',
              lineHeight: 1.1 
            }}>
              {currentCO2} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ppm</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: currentCO2 <= 350 ? 'var(--emerald-300)' : '#fca5a5' }}>
              {currentCO2 <= 350 ? '🌿 Safe Zone!' : 'Target: < 350 ppm'}
            </div>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 18px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Temp Anomaly
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: currentTempAnomaly <= 1.5 ? '#38bdf8' : '#fbbf24', lineHeight: 1.1 }}>
              +{currentTempAnomaly}°C
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Paris Target: &lt;1.5°C
            </div>
          </div>
        </div>
      </div>

      {!isCompleted ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr', gap: '24px' }}>
          {/* Left Column: Planetary Levers */}
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Planetary Decarbonization Levers</span>
              <span className="badge badge-sky" style={{ fontSize: '0.68rem' }}>Toggle Levers</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {levers.map((lever) => (
                <div 
                  key={lever.id}
                  className="glass-card"
                  style={{
                    padding: '18px 20px',
                    border: lever.isActivated ? '2px solid var(--emerald-400)' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: lever.isActivated ? 'rgba(6, 78, 59, 0.4)' : 'rgba(0, 0, 0, 0.35)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {lever.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                          {lever.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {lever.sector}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleLever(lever.id)}
                      className="btn"
                      style={{
                        padding: '6px 16px',
                        fontSize: '0.78rem',
                        background: lever.isActivated ? 'var(--emerald-500)' : 'rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        border: lever.isActivated ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      {lever.isActivated ? '✅ Active (-' + lever.co2ReductionPpm + ' ppm)' : 'Activate'}
                    </button>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: lever.isActivated ? 'var(--emerald-300)' : 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
                    {lever.isActivated ? lever.greenAlternative : `Current: ${lever.currentPractice}`}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    💡 {lever.trivia}
                  </div>
                </div>
              ))}
            </div>

            {/* If all levers activated and quiz finished, show finish trigger */}
            {allLeversActivated && isQuizFinished && (
              <div style={{ marginTop: '20px' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={finishClimateQuest}
                  style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                >
                  <Sparkles size={20} />
                  <span>Lock in Planetary Equilibrium!</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Weather vs. Climate Challenge */}
          <div>
            <div 
              className="glass-panel"
              style={{
                padding: '24px',
                position: 'sticky',
                top: '90px',
                border: '1px solid rgba(14, 165, 233, 0.35)',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                  Weather vs. Climate Lab
                </h3>
                <span className="badge badge-sky" style={{ fontSize: '0.7rem' }}>
                  {isQuizFinished ? 'Lab Completed' : `Question ${currentQuizIndex + 1} of ${QUIZ_QUESTIONS.length}`}
                </span>
              </div>

              {!isQuizFinished ? (
                <div>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '18px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                      Scenario Observation
                    </div>
                    <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.4 }}>
                      "{QUIZ_QUESTIONS[currentQuizIndex].scenario}"
                    </p>
                  </div>

                  {!quizFeedback ? (
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        Is this an example of short-term <strong>Weather</strong> or long-term <strong>Climate</strong>?
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleQuizAnswer('weather')}
                          style={{ padding: '12px', fontSize: '0.9rem' }}
                        >
                          🌦️ Weather
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleQuizAnswer('climate')}
                          style={{ padding: '12px', fontSize: '0.9rem' }}
                        >
                          🌍 Climate
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-sm)',
                        background: quizFeedback.isCorrect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${quizFeedback.isCorrect ? 'var(--emerald-400)' : '#f87171'}`,
                        marginBottom: '16px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          {quizFeedback.isCorrect ? (
                            <CheckCircle2 size={18} color="var(--emerald-400)" />
                          ) : (
                            <XCircle size={18} color="#ef4444" />
                          )}
                          <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                            {quizFeedback.isCorrect ? 'Correct Diagnosis!' : 'Incorrect!'}
                          </strong>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {quizFeedback.explanation}
                        </p>
                      </div>

                      <button 
                        className="btn btn-primary" 
                        onClick={handleNextQuizQuestion}
                        style={{ width: '100%', padding: '10px' }}
                      >
                        <span>Next Scenario</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎓</div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                    Weather vs Climate Mastery Achieved!
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    You scored {quizScore}/{QUIZ_QUESTIONS.length} on planetary atmospheric science!
                  </p>
                  <div className="badge badge-emerald">
                    Science Lab Verified
                  </div>
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
            <Globe2 size={44} color="#38bdf8" />
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
            Planetary Climate Champion!
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            You stabilized Earth's carbon equilibrium below 350 ppm and mastered the principles of climate systems!
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
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--emerald-400)' }}>
                329 ppm
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Safe CO2 Achieved</div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8' }}>
                +1.2°C
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Temp Stabilized</div>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fbbf24' }}>
                1,000 pts
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Eco Score Rewarded</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={handleRestart}>
              <RotateCcw size={16} />
              <span>Simulate Again</span>
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
