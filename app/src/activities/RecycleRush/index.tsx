import React, { useState, useEffect } from 'react'
import { useEco } from '../../context/EcoContext'
import { sound } from '../../utils/audio'
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Star, 
  ArrowRight,
  Info,
  Award
} from 'lucide-react'
import confetti from 'canvas-confetti'

type BinType = 'organic' | 'paper' | 'plastic' | 'glass' | 'ewaste'

interface WasteItem {
  id: string
  name: string
  bin: BinType
  icon: string
  explanation: string
  trivia: string
}

const ALL_ITEMS: WasteItem[] = [
  // Round 1: Basics
  { id: 'apple', name: 'Apple Core', bin: 'organic', icon: '🍎', explanation: 'Organic food waste decomposes into nutrient-rich compost for soil!', trivia: 'Food waste in landfills produces harmful methane gas, but composting turns it into garden gold.' },
  { id: 'box', name: 'Cardboard Box', bin: 'paper', icon: '📦', explanation: 'Clean cardboard is repulped to make new shipping boxes and paper!', trivia: 'Recycling 1 ton of cardboard saves 17 trees and 7,000 gallons of water.' },
  { id: 'bottle', name: 'Water Bottle (PET)', bin: 'plastic', icon: '🧴', explanation: 'Clean plastic bottles can be melted into eco-fleece jackets and new containers!', trivia: 'A recycled plastic bottle can be turned into a warm winter jacket.' },
  { id: 'jar', name: 'Glass Jam Jar', bin: 'glass', icon: '🫙', explanation: 'Glass can be recycled endlessly 100% without ever losing quality!', trivia: 'A glass bottle can take 1 million years to break down in nature, but melts easily in recycling.' },
  { id: 'battery', name: 'AA Battery', bin: 'ewaste', icon: '🔋', explanation: 'Batteries contain heavy metals and acids that leak if thrown in regular trash!', trivia: 'Batteries can cause fires in recycling trucks if not sent to specialized e-waste dropoffs.' },

  // Round 2: Tricky & Contaminants
  { id: 'banana', name: 'Banana Peel', bin: 'organic', icon: '🍌', explanation: 'Banana peels are packed with potassium and nitrogen for garden compost.', trivia: 'Composting creates living microbial communities that nourish root systems.' },
  { id: 'newspaper', name: 'Newspaper', bin: 'paper', icon: '📰', explanation: 'Dry newspapers are easily recyclable into recycled paper towels and egg cartons.', trivia: 'Recycling the Sunday newspaper could save over 500,000 trees every week.' },
  { id: 'milk_jug', name: 'Milk Jug (HDPE)', bin: 'plastic', icon: '🥛', explanation: 'HDPE plastic is high density and gets remade into outdoor park benches and toys.', trivia: 'Recycled HDPE plastic is durable enough to replace wood for playground equipment.' },
  { id: 'broken_glass', name: 'Broken Glass Bottle', bin: 'glass', icon: '🍾', explanation: 'Rinsed glass containers go into glass recycling to be melted in glass furnaces.', trivia: 'Recycled glass melts at lower temperatures, saving huge amounts of furnace energy.' },
  { id: 'phone', name: 'Old Smartphone', bin: 'ewaste', icon: '📱', explanation: 'Phones contain rare precious metals like gold and silver that must be reclaimed!', trivia: 'One metric ton of circuit boards contains more gold than 17 tons of gold ore!' },

  // Round 3: Advanced
  { id: 'leaves', name: 'Dry Garden Leaves', bin: 'organic', icon: '🍂', explanation: 'Dry leaves provide carbon "browns" necessary to balance organic compost piles.', trivia: 'A balanced compost pile needs 3 parts brown materials to 1 part green food scraps.' },
  { id: 'pizza_clean', name: 'Clean Pizza Box Lid', bin: 'paper', icon: '🍕', explanation: 'Only the clean, oil-free cardboard lid can be recycled; greasy bottoms must be composted!', trivia: 'Grease and oil ruin paper recycling by preventing paper fibers from binding.' },
  { id: 'detergent', name: 'Shampoo Bottle', bin: 'plastic', icon: '🧴', explanation: 'Rinsed shampoo and soap bottles are valuable rigid plastics.', trivia: 'Remember to give containers a quick rinse so leftover soap doesn\'t contaminate bins.' },
  { id: 'bulb', name: 'Fluorescent Bulb', bin: 'ewaste', icon: '💡', explanation: 'CFL bulbs contain trace mercury vapors and must always go to special e-waste centers.', trivia: 'Recycling fluorescent bulbs captures mercury safely before it reaches our groundwater.' },
  { id: 'sauce_jar', name: 'Tomato Sauce Jar', bin: 'glass', icon: '🥫', explanation: 'Glass food jars are sanitized, crushed into cullet, and melted into brand new jars.', trivia: 'Using recycled glass cullet cuts carbon emissions by up to 50% compared to raw sand.' },
]

const BINS: { type: BinType; name: string; color: string; bg: string; border: string; icon: string }[] = [
  { type: 'organic', name: 'Compost / Organics', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.4)', icon: '🌱' },
  { type: 'paper', name: 'Paper & Cardboard', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)', icon: '📄' },
  { type: 'plastic', name: 'Plastics & Metals', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)', icon: '♻️' },
  { type: 'glass', name: 'Glass Bottles', color: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.15)', border: 'rgba(45, 212, 191, 0.4)', icon: '🫙' },
  { type: 'ewaste', name: 'E-Waste & Hazards', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', border: 'rgba(192, 132, 252, 0.4)', icon: '⚠️' },
]

export const RecycleRush: React.FC = () => {
  const { completeActivity, setActiveActivity, activities } = useEco()
  const currentActivity = activities['recycle']

  const [round, setRound] = useState<number>(1)
  const [itemsQueue, setItemsQueue] = useState<WasteItem[]>([])
  const [selectedItem, setSelectedItem] = useState<WasteItem | null>(null)
  const [score, setScore] = useState<number>(0)
  const [streak, setStreak] = useState<number>(0)
  const [correctCount, setCorrectCount] = useState<number>(0)
  const [mistakeCount, setMistakeCount] = useState<number>(0)
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string; trivia?: string } | null>(null)
  const [isCompleted, setIsCompleted] = useState<boolean>(false)

  // Initialize round items
  useEffect(() => {
    let roundItems: WasteItem[] = []
    if (round === 1) roundItems = ALL_ITEMS.slice(0, 5)
    else if (round === 2) roundItems = ALL_ITEMS.slice(5, 10)
    else roundItems = ALL_ITEMS.slice(10, 15)

    // Shuffle
    const shuffled = [...roundItems].sort(() => Math.random() - 0.5)
    setItemsQueue(shuffled)
    setSelectedItem(shuffled[0] || null)
  }, [round])

  // Keyboard shortcut listener (1-5 to sort currently selected item)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItem || feedback || isCompleted) return
      const keyMap: Record<string, BinType> = {
        '1': 'organic',
        '2': 'paper',
        '3': 'plastic',
        '4': 'glass',
        '5': 'ewaste',
      }
      if (keyMap[e.key]) {
        handleSort(selectedItem, keyMap[e.key])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedItem, feedback, isCompleted])

  const handleSort = (item: WasteItem, binType: BinType) => {
    if (feedback) return // wait for feedback dismissal

    const isCorrect = item.bin === binType

    if (isCorrect) {
      sound.playSuccess()
      const newStreak = streak + 1
      const points = 50 + (newStreak * 10)
      setScore(s => s + points)
      setStreak(newStreak)
      setCorrectCount(c => c + 1)

      setFeedback({
        isCorrect: true,
        message: `Spot on! ${item.name} belongs in ${binType.toUpperCase()}.`,
        trivia: item.trivia
      })
    } else {
      sound.playError()
      setStreak(0)
      setMistakeCount(m => m + 1)

      setFeedback({
        isCorrect: false,
        message: `Oops! ${item.name} does NOT go into ${binType}.`,
        trivia: item.explanation
      })
    }
  }

  const handleNextItem = () => {
    sound.playTap()
    setFeedback(null)

    const remaining = itemsQueue.filter(i => i.id !== selectedItem?.id)
    if (remaining.length > 0) {
      setItemsQueue(remaining)
      setSelectedItem(remaining[0])
    } else {
      // Round completed
      if (round < 3) {
        setRound(r => r + 1)
      } else {
        // Entire Game Completed!
        finishGame()
      }
    }
  }

  const finishGame = () => {
    setIsCompleted(true)
    sound.playFanfare()
    try {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } })
    } catch {}

    // Calculate stars: 3 stars if >= 13 correct, 2 stars if >= 10, 1 star otherwise
    const totalSorted = correctCount + (feedback?.isCorrect ? 1 : 0)
    let starsEarned = 1
    if (totalSorted >= 13) starsEarned = 3
    else if (totalSorted >= 10) starsEarned = 2

    const finalPoints = score + (starsEarned * 100)

    completeActivity(
      'recycle',
      finalPoints,
      starsEarned,
      { totalItemsRecycled: totalSorted },
      totalSorted === 15 ? ['recycle_master'] : undefined
    )
  }

  const handleRestart = () => {
    sound.playTap()
    setRound(1)
    setScore(0)
    setStreak(0)
    setCorrectCount(0)
    setMistakeCount(0)
    setFeedback(null)
    setIsCompleted(false)
  }

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, item: WasteItem) => {
    e.dataTransfer.setData('text/plain', item.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, binType: BinType) => {
    e.preventDefault()
    if (selectedItem) {
      handleSort(selectedItem, binType)
    }
  }

  return (
    <div className="container" style={{ maxWidth: '960px', paddingBottom: '40px' }}>
      {/* Activity Header Bar */}
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
            <span className="badge badge-emerald">Round {round} of 3</span>
            <span className="badge badge-amber">Streak: {streak}x 🔥</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
            Recycle Rush: Waste Sorting Challenge
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Drag and drop items or click bins (or press keys 1-5). Contaminants ruin entire batches!
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTIVITY SCORE</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--emerald-400)' }}>
            {score} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>pts</span>
          </div>
        </div>
      </div>

      {!isCompleted ? (
        <>
          {/* Active Item Conveyor Tray */}
          <div 
            className="glass-panel"
            style={{
              padding: '28px',
              textAlign: 'center',
              marginBottom: '28px',
              background: 'radial-gradient(circle at center, rgba(6, 78, 59, 0.4) 0%, rgba(2, 28, 22, 0.7) 100%)',
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              border: '2px dashed rgba(52, 211, 153, 0.4)'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--emerald-300)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Item to Sort ({itemsQueue.length} remaining in round)
            </div>

            {selectedItem && (
              <div 
                draggable={!feedback}
                onDragStart={(e) => handleDragStart(e, selectedItem)}
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px 36px',
                  cursor: feedback ? 'default' : 'grab',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{ fontSize: '4.5rem', marginBottom: '8px', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))' }}>
                  {selectedItem.icon}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedItem.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Drag to correct bin below or click bin
                </div>
              </div>
            )}
          </div>

          {/* Feedback Overlay Modal if item just sorted */}
          {feedback && (
            <div 
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(2, 20, 15, 0.8)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 80,
                padding: '20px'
              }}
            >
              <div 
                className="glass-panel"
                style={{
                  maxWidth: '520px',
                  width: '100%',
                  padding: '28px',
                  textAlign: 'center',
                  border: `2px solid ${feedback.isCorrect ? 'var(--emerald-400)' : '#f87171'}`,
                  boxShadow: feedback.isCorrect ? '0 0 40px rgba(16, 185, 129, 0.4)' : '0 0 40px rgba(239, 68, 68, 0.3)'
                }}
              >
                <div style={{ marginBottom: '14px' }}>
                  {feedback.isCorrect ? (
                    <CheckCircle2 size={56} color="var(--emerald-400)" style={{ margin: '0 auto' }} />
                  ) : (
                    <XCircle size={56} color="#ef4444" style={{ margin: '0 auto' }} />
                  )}
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                  {feedback.isCorrect ? 'Excellent Sorting!' : 'Sorting Error!'}
                </h3>

                <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '16px' }}>
                  {feedback.message}
                </p>

                {feedback.trivia && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    textAlign: 'left',
                    marginBottom: '20px',
                    display: 'flex',
                    gap: '10px'
                  }}>
                    <Info size={20} color="var(--emerald-400)" style={{ flexShrink: 0 }} />
                    <div>{feedback.trivia}</div>
                  </div>
                )}

                <button 
                  className="btn btn-primary" 
                  onClick={handleNextItem}
                  autoFocus
                  style={{ width: '100%', padding: '12px' }}
                >
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* 5 Recycling Bins Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '16px'
          }}>
            {BINS.map((bin, index) => (
              <div
                key={bin.type}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, bin.type)}
                onClick={() => selectedItem && handleSort(selectedItem, bin.type)}
                className="glass-card"
                style={{
                  padding: '20px 14px',
                  textAlign: 'center',
                  background: bin.bg,
                  border: `2px solid ${bin.border}`,
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-md)',
                  position: 'relative'
                }}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: '8px', 
                  right: '10px', 
                  fontSize: '0.7rem', 
                  fontWeight: 800,
                  color: bin.color,
                  background: 'rgba(0,0,0,0.3)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  Key {index + 1}
                </div>

                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                  {bin.icon}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                  {bin.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: bin.color, fontWeight: 600 }}>
                  Drop here
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Completion Screen */
        <div 
          className="glass-panel"
          style={{
            padding: '40px 32px',
            textAlign: 'center',
            maxWidth: '640px',
            margin: '0 auto',
            border: '2px solid var(--emerald-400)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(16, 185, 129, 0.3)'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            border: '2px solid var(--emerald-400)'
          }}>
            <Award size={44} color="var(--emerald-400)" />
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
            Recycle Rush Champion!
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            You sorted all household and tricky waste items with great skill, keeping materials in circular loops!
          </p>

          {/* Stars */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
            {[1, 2, 3].map((starIndex) => (
              <Star 
                key={starIndex} 
                size={42} 
                fill={starIndex <= currentActivity.stars ? 'var(--accent-amber)' : 'none'} 
                color={starIndex <= currentActivity.stars ? 'var(--accent-amber)' : 'rgba(255, 255, 255, 0.2)'} 
              />
            ))}
          </div>

          {/* Stats Summary */}
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
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--emerald-400)' }}>{correctCount}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sorted Correctly</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f87171' }}>{mistakeCount}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Contaminations</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fbbf24' }}>{score}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Final Points</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={handleRestart}>
              <RotateCcw size={16} />
              <span>Play Again</span>
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
