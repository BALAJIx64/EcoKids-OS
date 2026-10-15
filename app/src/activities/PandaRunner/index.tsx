import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useEco } from '../../context/EcoContext'
import { pandaAudio } from '../../utils/pandaAudio'
import { 
  RotateCcw, 
  ArrowLeft, 
  Maximize2, 
  Minimize2, 
  Shield, 
  Magnet, 
  Feather, 
  Zap,
  Sparkles,
  Trophy,
  Flame
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface Quest {
  id: string
  title: string
  target: number
  current: number
  completed: boolean
  bonusScore: number
}

interface WorldEntity {
  id: number
  type: 'log' | 'boulder' | 'torii' | 'bamboo' | 'star' | 'magnet' | 'shield' | 'wings'
  lane: number // -1, 0, 1
  z: number // distance ahead
  collected?: boolean
}

interface SceneryEntity {
  id: number
  type: 'sakura_tree' | 'flower_patch' | 'lantern_post' | 'crystal_shrine'
  side: -1 | 1 // left or right of road
  z: number
}

interface SakuraPetal {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  rotation: number
  rotSpeed: number
  swing: number
  swingSpeed: number
  color: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  alpha: number
  life: number
  maxLife: number
}

export const PandaRunner: React.FC = () => {
  const { completeActivity, setActiveActivity, isMuted } = useEco()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Game state
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isGameOver, setIsGameOver] = useState<boolean>(false)
  const [score, setScore] = useState<number>(0)
  const [distance, setDistance] = useState<number>(0)
  const [bambooCount, setBambooCount] = useState<number>(0)
  const [currentSpeedKph, setCurrentSpeedKph] = useState<number>(24)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [activeNotification, setActiveNotification] = useState<string | null>(null)

  // Power-up durations remaining (seconds)
  const [magnetTime, setMagnetTime] = useState<number>(0)
  const [shieldTime, setShieldTime] = useState<number>(0)
  const [wingsTime, setWingsTime] = useState<number>(0)

  // In-run Quests
  const [quests, setQuests] = useState<Quest[]>([
    { id: 'bamboo_30', title: 'Collect 35 Golden Bamboo', target: 35, current: 0, completed: false, bonusScore: 250 },
    { id: 'distance_500', title: 'Sprint 500 Meters', target: 500, current: 0, completed: false, bonusScore: 300 },
    { id: 'acrobat_6', title: 'Perform 8 Flips or Slides', target: 8, current: 0, completed: false, bonusScore: 250 },
    { id: 'power_2', title: 'Collect 2 Celestial Powers', target: 2, current: 0, completed: false, bonusScore: 350 },
  ])

  // Internal mutable engine references
  const engine = useRef({
    // Assets
    bgImage: null as HTMLImageElement | null,
    bgLoaded: false,

    // Panda state
    lane: 0, // -1 (left), 0 (center), 1 (right)
    targetX: 0,
    pandaX: 0,
    pandaY: 0, // vertical jump offset
    vy: 0,
    isGrounded: true,
    isSliding: false,
    slideTimer: 0,
    jumpCount: 0,

    // Run dynamics
    speed: 6.8,
    distanceRun: 0,
    totalBamboo: 0,
    currentScore: 0,
    entities: [] as WorldEntity[],
    scenery: [] as SceneryEntity[],
    petals: [] as SakuraPetal[],
    particles: [] as Particle[],

    // Power-up timers
    hasMagnet: false,
    magnetTimer: 0,
    hasShield: false,
    shieldTimer: 0,
    hasWings: false,
    wingsTimer: 0,
    powerUpsCollected: 0,
    acrobatMoves: 0,

    // Loop
    nextSpawnZ: 300,
    entityCounter: 0,
    animFrameId: 0,
    runStarted: false,
  })

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  // Handle Mute sync
  useEffect(() => {
    pandaAudio.setMuted(isMuted)
  }, [isMuted])

  // Quest progress checker
  const updateQuestProgress = useCallback((questId: string, delta: number = 1, absoluteVal?: number) => {
    setQuests(prev => prev.map(q => {
      if (q.id === questId && !q.completed) {
        const nextVal = absoluteVal !== undefined ? absoluteVal : q.current + delta
        if (nextVal >= q.target) {
          pandaAudio.playQuestComplete()
          setActiveNotification(`🎯 Quest Complete: ${q.title}! (+${q.bonusScore} pts)`)
          setTimeout(() => setActiveNotification(null), 3500)
          setScore(s => s + q.bonusScore)
          return { ...q, current: q.target, completed: true }
        }
        return { ...q, current: nextVal }
      }
      return q
    }))
  }, [])

  // Start / Restart Run
  const startGame = () => {
    const eng = engine.current
    eng.lane = 0
    eng.targetX = 0
    eng.pandaX = 0
    eng.pandaY = 0
    eng.vy = 0
    eng.isGrounded = true
    eng.isSliding = false
    eng.slideTimer = 0
    eng.speed = 6.8
    eng.distanceRun = 0
    eng.totalBamboo = 0
    eng.currentScore = 0
    eng.entities = []
    eng.particles = []
    eng.hasMagnet = false
    eng.magnetTimer = 0
    eng.hasShield = false
    eng.shieldTimer = 0
    eng.hasWings = false
    eng.wingsTimer = 0
    eng.powerUpsCollected = 0
    eng.acrobatMoves = 0
    eng.nextSpawnZ = 200
    eng.runStarted = true

    // Pre-populate initial bamboo runway
    for (let i = 0; i < 9; i++) {
      eng.entities.push({
        id: ++eng.entityCounter,
        type: 'bamboo',
        lane: (i % 3) - 1,
        z: 220 + i * 75,
      })
    }

    setScore(0)
    setDistance(0)
    setBambooCount(0)
    setCurrentSpeedKph(24)
    setMagnetTime(0)
    setShieldTime(0)
    setWingsTime(0)
    setIsGameOver(false)
    setIsPlaying(true)

    pandaAudio.startMusic(1.0)
  }

  // Panda Controls
  const moveLeft = useCallback(() => {
    const eng = engine.current
    if (eng.lane > -1) {
      eng.lane -= 1
      eng.targetX = eng.lane * 145
      pandaAudio.playSlide()
    }
  }, [])

  const moveRight = useCallback(() => {
    const eng = engine.current
    if (eng.lane < 1) {
      eng.lane += 1
      eng.targetX = eng.lane * 145
      pandaAudio.playSlide()
    }
  }, [])

  const jump = useCallback(() => {
    const eng = engine.current
    if (eng.isGrounded || eng.hasWings) {
      eng.isGrounded = false
      eng.isSliding = false
      eng.vy = -16.5
      pandaAudio.playJump()
      eng.acrobatMoves++
      updateQuestProgress('acrobat_6', 1)

      // Jump star burst particle effect
      for (let i = 0; i < 8; i++) {
        eng.particles.push({
          x: eng.pandaX + (Math.random() - 0.5) * 30,
          y: 400 + eng.pandaY,
          vx: (Math.random() - 0.5) * 5,
          vy: Math.random() * -3 - 2,
          color: ['#fde047', '#fbbf24', '#ffffff'][i % 3],
          size: Math.random() * 5 + 3,
          alpha: 1,
          life: 0,
          maxLife: 24
        })
      }
    }
  }, [updateQuestProgress])

  const slide = useCallback(() => {
    const eng = engine.current
    if (eng.isGrounded && !eng.isSliding) {
      eng.isSliding = true
      eng.slideTimer = 0.82 // seconds
      pandaAudio.playSlide()
      eng.acrobatMoves++
      updateQuestProgress('acrobat_6', 1)

      // Slide rainbow dust particles
      for (let i = 0; i < 12; i++) {
        eng.particles.push({
          x: eng.pandaX + (Math.random() - 0.5) * 40,
          y: 420,
          vx: (Math.random() - 0.5) * 6,
          vy: -(Math.random() * 2 + 1),
          color: ['#f43f5e', '#38bdf8', '#facc15', '#a855f7', '#34d399'][i % 5],
          size: Math.random() * 6 + 3,
          alpha: 1,
          life: 0,
          maxLife: 30
        })
      }
    }
  }, [updateQuestProgress])

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        moveLeft()
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        moveRight()
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        e.preventDefault()
        jump()
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault()
        slide()
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [moveLeft, moveRight, jump, slide])

  // End Game Trigger
  const handleCrash = () => {
    const eng = engine.current
    eng.runStarted = false
    setIsPlaying(false)
    setIsGameOver(true)
    pandaAudio.playCrash()

    try {
      confetti({ particleCount: 110, spread: 85, origin: { y: 0.55 } })
    } catch {}

    const finalDistance = Math.floor(eng.distanceRun)
    const finalScore = eng.currentScore + finalDistance * 2

    // Stars based on distance and score
    let starsEarned = 1
    if (finalDistance >= 800) starsEarned = 3
    else if (finalDistance >= 400) starsEarned = 2

    const triggerAchievements: string[] = []
    if (finalDistance >= 500) triggerAchievements.push('panda_sprinter')
    if (eng.totalBamboo >= 100) triggerAchievements.push('bamboo_master')

    completeActivity(
      'panda',
      finalScore,
      starsEarned,
      {
        bambooCollected: eng.totalBamboo,
        longestRunMeters: finalDistance,
      },
      triggerAchievements.length > 0 ? triggerAchievements : undefined
    )
  }

  // --- Main 60 FPS 3D Perspective Canvas Engine ---
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const eng = engine.current

    // Preload wallpaper image
    if (!eng.bgImage) {
      const img = new Image()
      img.src = './wallpaper.png'
      img.onload = () => {
        eng.bgLoaded = true
      }
      eng.bgImage = img
    }

    // Initialize ambient sakura petals
    if (eng.petals.length === 0) {
      for (let i = 0; i < 35; i++) {
        eng.petals.push({
          x: Math.random() * 900,
          y: Math.random() * 560,
          size: Math.random() * 5 + 4,
          speedX: -(Math.random() * 0.8 + 0.4),
          speedY: Math.random() * 0.9 + 0.6,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.04,
          swing: Math.random() * Math.PI * 2,
          swingSpeed: Math.random() * 0.03 + 0.015,
          color: ['#f472b6', '#fbcfe8', '#fda4af', '#fb7185', '#f43f5e'][Math.floor(Math.random() * 5)]
        })
      }
    }

    // Initialize Roadside Scenery (Sakura trees, blooming flower bushes, lantern posts, crystal shrines)
    if (eng.scenery.length === 0) {
      const types: ('sakura_tree' | 'flower_patch' | 'lantern_post' | 'crystal_shrine')[] = [
        'sakura_tree', 'flower_patch', 'lantern_post', 'flower_patch', 'crystal_shrine', 'sakura_tree'
      ]
      for (let i = 0; i < 18; i++) {
        eng.scenery.push({
          id: i,
          type: types[i % types.length],
          side: i % 2 === 0 ? -1 : 1,
          z: 80 + i * 65
        })
      }
    }

    let lastTimestamp = performance.now()

    const renderLoop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTimestamp) / 1000)
      lastTimestamp = now

      const width = canvas.width
      const height = canvas.height

      // 1. Update Game Logic if active
      if (eng.runStarted && !isGameOver) {
        // Accelerate speed progressively
        const targetSpeed = Math.min(12.0, 6.8 + (eng.distanceRun / 130) * 0.38)
        eng.speed += (targetSpeed - eng.speed) * 0.05
        pandaAudio.updateMusicTempo(eng.speed / 6.8)

        // Advance distance & score
        eng.distanceRun += eng.speed * dt * 3.6
        eng.currentScore += Math.floor(eng.speed * dt * 11)
        setScore(eng.currentScore)
        setDistance(Math.floor(eng.distanceRun))
        setCurrentSpeedKph(Math.floor(eng.speed * 4.2))

        // Check distance quest
        updateQuestProgress('distance_500', 0, Math.floor(eng.distanceRun))

        // Smooth X lane movement
        eng.pandaX += (eng.targetX - eng.pandaX) * (18 * dt)

        // Jump physics
        if (!eng.isGrounded) {
          eng.pandaY += eng.vy
          eng.vy += 34 * dt // gravity
          if (eng.pandaY >= 0) {
            eng.pandaY = 0
            eng.isGrounded = true
            eng.vy = 0

            // Landing dust puff
            for (let i = 0; i < 6; i++) {
              eng.particles.push({
                x: eng.pandaX + (Math.random() - 0.5) * 30,
                y: 420,
                vx: (Math.random() - 0.5) * 4,
                vy: -(Math.random() * 2 + 0.5),
                color: '#fef08a',
                size: Math.random() * 4 + 2,
                alpha: 0.9,
                life: 0,
                maxLife: 20
              })
            }
          }
        }

        // Slide timer
        if (eng.isSliding) {
          eng.slideTimer -= dt
          if (eng.slideTimer <= 0) {
            eng.isSliding = false
          }
        }

        // Power-up timers
        if (eng.hasMagnet) {
          eng.magnetTimer -= dt
          setMagnetTime(Math.max(0, Math.ceil(eng.magnetTimer)))
          if (eng.magnetTimer <= 0) eng.hasMagnet = false
        }
        if (eng.hasShield) {
          eng.shieldTimer -= dt
          setShieldTime(Math.max(0, Math.ceil(eng.shieldTimer)))
          if (eng.shieldTimer <= 0) eng.hasShield = false
        }
        if (eng.hasWings) {
          eng.wingsTimer -= dt
          setWingsTime(Math.max(0, Math.ceil(eng.wingsTimer)))
          eng.pandaY = -68 // fly comfortably above obstacles
          if (eng.wingsTimer <= 0) {
            eng.hasWings = false
            eng.isGrounded = false
            eng.vy = 0
          }
        }

        // Move entities towards player
        const speedUnits = eng.speed * 60 * dt

        // Scroll roadside scenery
        eng.scenery.forEach(item => {
          item.z -= speedUnits
          if (item.z < -40) {
            item.z += 18 * 65 // recycle ahead seamlessly
          }
        })

        // Collision & Entity Progression
        for (let i = eng.entities.length - 1; i >= 0; i--) {
          const entity = eng.entities[i]
          entity.z -= speedUnits

          // Magnet Attraction Effect
          if (eng.hasMagnet && (entity.type === 'bamboo' || entity.type === 'star') && entity.z < 480 && entity.z > 0) {
            entity.lane += (eng.lane - entity.lane) * (14 * dt)
          }

          // Collision Detection (around player z: -10 to 40)
          if (entity.z <= 40 && entity.z >= -10 && !entity.collected) {
            const laneDiff = Math.abs(entity.lane - eng.lane)

            // Collectibles
            if (entity.type === 'bamboo' || entity.type === 'star' || entity.type === 'magnet' || entity.type === 'shield' || entity.type === 'wings') {
              if (laneDiff < 0.68) {
                entity.collected = true

                // Festive spark burst
                for (let k = 0; k < 12; k++) {
                  eng.particles.push({
                    x: eng.pandaX + (Math.random() - 0.5) * 20,
                    y: 400 + eng.pandaY,
                    vx: (Math.random() - 0.5) * 7,
                    vy: (Math.random() - 0.5) * 7,
                    color: entity.type === 'bamboo' ? '#4ade80' : entity.type === 'star' ? '#facc15' : '#38bdf8',
                    size: Math.random() * 5 + 3,
                    alpha: 1,
                    life: 0,
                    maxLife: 25
                  })
                }

                if (entity.type === 'bamboo') {
                  eng.totalBamboo++
                  eng.currentScore += 20
                  pandaAudio.playCollectBamboo()
                  setBambooCount(eng.totalBamboo)
                  updateQuestProgress('bamboo_30', 1)
                } else if (entity.type === 'star') {
                  eng.currentScore += 80
                  pandaAudio.playCollectBamboo()
                } else if (entity.type === 'magnet') {
                  eng.hasMagnet = true
                  eng.magnetTimer = 8.0
                  eng.powerUpsCollected++
                  pandaAudio.playPowerUp()
                  updateQuestProgress('power_2', 1)
                } else if (entity.type === 'shield') {
                  eng.hasShield = true
                  eng.shieldTimer = 12.0
                  eng.powerUpsCollected++
                  pandaAudio.playPowerUp()
                  updateQuestProgress('power_2', 1)
                } else if (entity.type === 'wings') {
                  eng.hasWings = true
                  eng.wingsTimer = 7.5
                  eng.powerUpsCollected++
                  pandaAudio.playPowerUp()
                  updateQuestProgress('power_2', 1)
                }
              }
            } else {
              // Obstacle Collision
              if (laneDiff < 0.65) {
                // If wings active: flew over obstacle safely!
                if (eng.hasWings) {
                  // safely airborne!
                }
                // If log: jump over
                else if (entity.type === 'log' && eng.pandaY < -28) {
                  // Jumped safely!
                }
                // If torii gate: slide under
                else if (entity.type === 'torii' && eng.isSliding) {
                  // Slid safely!
                }
                // Crash hit!
                else {
                  if (eng.hasShield) {
                    // Shield absorbs hit
                    eng.hasShield = false
                    eng.shieldTimer = 0
                    setShieldTime(0)
                    entity.collected = true
                    pandaAudio.playShieldHit()

                    for (let s = 0; s < 18; s++) {
                      eng.particles.push({
                        x: eng.pandaX,
                        y: 400 + eng.pandaY,
                        vx: (Math.random() - 0.5) * 8,
                        vy: (Math.random() - 0.5) * 8,
                        color: '#10b981',
                        size: Math.random() * 6 + 2,
                        alpha: 1,
                        life: 0,
                        maxLife: 28
                      })
                    }
                  } else {
                    handleCrash()
                    break
                  }
                }
              }
            }
          }

          // Remove entities that went behind camera
          if (entity.z < -60) {
            eng.entities.splice(i, 1)
          }
        }

        // Procedural Track & Obstacle Spawning
        const maxAheadZ = 980
        const furthestZ = eng.entities.reduce((max, e) => Math.max(max, e.z), 0)
        if (furthestZ < maxAheadZ) {
          const spawnZ = Math.max(furthestZ + 115, 220)
          const randLane = Math.floor(Math.random() * 3) - 1
          const randRoll = Math.random()

          if (randRoll < 0.42) {
            // Bamboo run in lanes
            eng.entities.push({
              id: ++eng.entityCounter,
              type: 'bamboo',
              lane: randLane,
              z: spawnZ,
            })
            eng.entities.push({
              id: ++eng.entityCounter,
              type: 'bamboo',
              lane: randLane,
              z: spawnZ + 42,
            })
          } else if (randRoll < 0.65) {
            // Jumpable Mossy Log
            eng.entities.push({
              id: ++eng.entityCounter,
              type: 'log',
              lane: randLane,
              z: spawnZ,
            })
          } else if (randRoll < 0.84) {
            // Slideable Vermilion Torii Gate
            eng.entities.push({
              id: ++eng.entityCounter,
              type: 'torii',
              lane: randLane,
              z: spawnZ,
            })
          } else if (randRoll < 0.92) {
            // Dodgeable Amethyst Geode Boulder
            eng.entities.push({
              id: ++eng.entityCounter,
              type: 'boulder',
              lane: randLane,
              z: spawnZ,
            })
          } else {
            // Rare Power-Ups
            const powerTypes: ('magnet' | 'shield' | 'wings' | 'star')[] = ['magnet', 'shield', 'wings', 'star']
            const chosenPower = powerTypes[Math.floor(Math.random() * powerTypes.length)]
            eng.entities.push({
              id: ++eng.entityCounter,
              type: chosenPower,
              lane: randLane,
              z: spawnZ,
            })
          }
        }
      }

      // Update Active Particles
      for (let pIdx = eng.particles.length - 1; pIdx >= 0; pIdx--) {
        const p = eng.particles[pIdx]
        p.x += p.vx
        p.y += p.vy
        p.life++
        p.alpha = Math.max(0, 1 - p.life / p.maxLife)
        if (p.life >= p.maxLife) {
          eng.particles.splice(pIdx, 1)
        }
      }

      // Update Ambient Sakura Petals
      eng.petals.forEach(petal => {
        petal.x += petal.speedX
        petal.y += petal.speedY
        petal.rotation += petal.rotSpeed
        petal.swing += petal.swingSpeed
        petal.x += Math.sin(petal.swing) * 0.6

        // Wrap around screen
        if (petal.y > height + 20) {
          petal.y = -20
          petal.x = Math.random() * (width + 100)
        }
        if (petal.x < -30) {
          petal.x = width + 20
        }
      })

      // =========================================================================
      // --- CHEERFUL & COLORFUL 3D PERSPECTIVE RENDERING PIPELINE ---
      // =========================================================================
      ctx.clearRect(0, 0, width, height)

      const horizonY = height * 0.36
      const roadTopWidth = 160
      const roadBottomWidth = width * 0.96
      const roadCenterX = width / 2

      // 1. SKY & WORLD BACKGROUND (Artwork Wallpaper Integration)
      if (eng.bgImage && eng.bgImage.complete && eng.bgLoaded) {
        // Draw the top panoramic portion of the magnificent digital art wallpaper
        // subtle parallax panning with horizontal lane shift
        const parallaxPanX = -(eng.pandaX / 145) * 18
        ctx.save()
        // Draw wallpaper with subtle overscan for pan
        ctx.drawImage(
          eng.bgImage,
          0, 0, eng.bgImage.width, eng.bgImage.height * 0.68,
          parallaxPanX - 25, 0, width + 50, horizonY + 25
        )

        // Warm celestial sunbeams / god rays overlay from top left
        ctx.globalCompositeOperation = 'screen'
        const sunRayGrad = ctx.createRadialGradient(
          width * 0.12, height * 0.12, 10,
          width * 0.12, height * 0.12, width * 0.65
        )
        sunRayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)')
        sunRayGrad.addColorStop(0.35, 'rgba(251, 191, 36, 0.18)')
        sunRayGrad.addColorStop(1, 'rgba(251, 191, 36, 0)')
        ctx.fillStyle = sunRayGrad
        ctx.fillRect(0, 0, width, horizonY + 30)

        // Soft atmospheric morning mist blending into horizon
        ctx.globalCompositeOperation = 'source-over'
        const mistGrad = ctx.createLinearGradient(0, horizonY - 45, 0, horizonY + 15)
        mistGrad.addColorStop(0, 'rgba(125, 211, 252, 0)')
        mistGrad.addColorStop(0.5, 'rgba(254, 243, 199, 0.35)')
        mistGrad.addColorStop(1, 'rgba(16, 185, 129, 0.75)')
        ctx.fillStyle = mistGrad
        ctx.fillRect(0, horizonY - 45, width, 60)
        ctx.restore()
      } else {
        // Fallback vibrant sky if image is still loading
        const fallbackSky = ctx.createLinearGradient(0, 0, 0, horizonY)
        fallbackSky.addColorStop(0, '#0284c7')
        fallbackSky.addColorStop(0.5, '#38bdf8')
        fallbackSky.addColorStop(1, '#fde047')
        ctx.fillStyle = fallbackSky
        ctx.fillRect(0, 0, width, horizonY)
      }

      // 2. ROADSIDE ENVIRONMENT (Lush Emerald & Crystal Blue Waterfall Rapids)
      // Ground meadow gradient
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height)
      groundGrad.addColorStop(0, '#059669')
      groundGrad.addColorStop(0.3, '#10b981')
      groundGrad.addColorStop(1, '#047857')
      ctx.fillStyle = groundGrad
      ctx.fillRect(0, horizonY, width, height - horizonY)

      // Left Crystal River Rapids (Cascading waterfall stream on left side of track)
      const riverWave = Math.sin(now * 0.006) * 6
      ctx.fillStyle = '#0284c7'
      ctx.beginPath()
      ctx.moveTo(0, horizonY)
      ctx.lineTo(roadCenterX - roadTopWidth * 0.58, horizonY)
      ctx.lineTo(roadCenterX - roadBottomWidth * 0.52, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      ctx.fill()

      // Left River Shimmering Turquoise Ripple & Foam
      ctx.fillStyle = '#38bdf8'
      ctx.beginPath()
      ctx.moveTo(10, horizonY + 10)
      ctx.lineTo(roadCenterX - roadTopWidth * 0.62 + riverWave, horizonY + 10)
      ctx.lineTo(roadCenterX - roadBottomWidth * 0.54 + riverWave, height)
      ctx.lineTo(10, height)
      ctx.closePath()
      ctx.fill()

      // Left River White Crest Highlights
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)'
      ctx.lineWidth = 2
      for (let r = 0; r < 5; r++) {
        const ry = horizonY + (height - horizonY) * (0.2 + r * 0.18)
        ctx.beginPath()
        ctx.moveTo(roadCenterX - roadBottomWidth * 0.62 + (r % 2) * 20, ry)
        ctx.bezierCurveTo(
          roadCenterX - roadBottomWidth * 0.58, ry - 4 + riverWave,
          roadCenterX - roadBottomWidth * 0.55, ry + 4 - riverWave,
          roadCenterX - roadBottomWidth * 0.52, ry
        )
        ctx.stroke()
      }

      // Right Crystal River Rapids (Cascading waterfall stream on right side of track)
      ctx.fillStyle = '#0284c7'
      ctx.beginPath()
      ctx.moveTo(width, horizonY)
      ctx.lineTo(roadCenterX + roadTopWidth * 0.58, horizonY)
      ctx.lineTo(roadCenterX + roadBottomWidth * 0.52, height)
      ctx.lineTo(width, height)
      ctx.closePath()
      ctx.fill()

      // Right River Shimmering Turquoise Ripple
      ctx.fillStyle = '#38bdf8'
      ctx.beginPath()
      ctx.moveTo(width - 10, horizonY + 10)
      ctx.lineTo(roadCenterX + roadTopWidth * 0.62 - riverWave, horizonY + 10)
      ctx.lineTo(roadCenterX + roadBottomWidth * 0.54 - riverWave, height)
      ctx.lineTo(width - 10, height)
      ctx.closePath()
      ctx.fill()

      // Right River White Crest Highlights
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)'
      ctx.lineWidth = 2
      for (let r = 0; r < 5; r++) {
        const ry = horizonY + (height - horizonY) * (0.22 + r * 0.18)
        ctx.beginPath()
        ctx.moveTo(roadCenterX + roadBottomWidth * 0.52, ry)
        ctx.bezierCurveTo(
          roadCenterX + roadBottomWidth * 0.55, ry - 4 - riverWave,
          roadCenterX + roadBottomWidth * 0.58, ry + 4 + riverWave,
          roadCenterX + roadBottomWidth * 0.62 - (r % 2) * 20, ry
        )
        ctx.stroke()
      }

      // 3. THE GOLDEN SUNSTONE & JADE HIGHWAY (Dynamic 3D Perspective Road)
      // Base Road Surface: Warm luminous golden amber cobblestone highway
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height)
      roadGrad.addColorStop(0, '#92400e') // warm amber distance
      roadGrad.addColorStop(0.3, '#b45309')
      roadGrad.addColorStop(0.7, '#d97706') // golden sunstone mid-ground
      roadGrad.addColorStop(1, '#f59e0b') // luminous foreground gold
      ctx.fillStyle = roadGrad

      ctx.beginPath()
      ctx.moveTo(roadCenterX - roadTopWidth / 2, horizonY)
      ctx.lineTo(roadCenterX + roadTopWidth / 2, horizonY)
      ctx.lineTo(roadCenterX + roadBottomWidth / 2, height)
      ctx.lineTo(roadCenterX - roadBottomWidth / 2, height)
      ctx.closePath()
      ctx.fill()

      // 3D Perspective Projection Function
      const project = (lane: number, z: number, yOffset: number = 0) => {
        const perspective = 220
        const scale = perspective / (perspective + Math.max(1, z))
        const pY = horizonY + (height - horizonY) * scale + yOffset * scale
        const currentRoadW = roadTopWidth + (roadBottomWidth - roadTopWidth) * scale
        const pX = roadCenterX + lane * (currentRoadW * 0.32)
        return { x: pX, y: pY, scale }
      }

      // Moving Dynamic Perspective Cobblestone Slabs (Gives the authentic high-speed runner sensation!)
      const numSlabs = 18
      const slabSpacing = 55
      const scrollOffsetZ = (eng.distanceRun * 14) % slabSpacing

      for (let s = 0; s < numSlabs; s++) {
        const zSlab = s * slabSpacing - scrollOffsetZ + 15
        if (zSlab <= 4 || zSlab > 920) continue
        const { y: slabY, scale: slabScale } = project(0, zSlab)
        const currentRoadW = (roadTopWidth + (roadBottomWidth - roadTopWidth) * slabScale) * 0.98

        // Alternating warm slab tones
        ctx.fillStyle = s % 2 === 0 ? 'rgba(254, 240, 138, 0.18)' : 'rgba(120, 53, 15, 0.22)'
        ctx.fillRect(roadCenterX - currentRoadW / 2, slabY - 2 * slabScale, currentRoadW, 5 * slabScale)

        // Illuminated top bevel groove
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.fillRect(roadCenterX - currentRoadW / 2, slabY - 1 * slabScale, currentRoadW, 1.6 * slabScale)
      }

      // Glowing Cyan Neon Lane Dividers (Dashed Perspective Lines)
      ctx.save()
      ctx.strokeStyle = '#22d3ee'
      ctx.shadowColor = '#06b6d4'
      ctx.shadowBlur = 8
      ctx.lineWidth = 3
      ctx.setLineDash([22, 16])
      ctx.lineDashOffset = -(eng.distanceRun * 12) % 38

      ;[-0.33, 0.33].forEach(ratio => {
        ctx.beginPath()
        ctx.moveTo(roadCenterX + (roadTopWidth / 2) * ratio, horizonY)
        ctx.lineTo(roadCenterX + (roadBottomWidth / 2) * ratio, height)
        ctx.stroke()
      })
      ctx.restore()

      // Raised Glowing Road Curbs & Neon Rails
      // Left Curb Rail (Cyan Neon)
      ctx.save()
      ctx.strokeStyle = '#06b6d4'
      ctx.shadowColor = '#0891b2'
      ctx.shadowBlur = 12
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(roadCenterX - roadTopWidth / 2, horizonY)
      ctx.lineTo(roadCenterX - roadBottomWidth / 2, height)
      ctx.stroke()

      // Right Curb Rail (Rose-Gold / Warm Amber Neon)
      ctx.strokeStyle = '#f43f5e'
      ctx.shadowColor = '#e11d48'
      ctx.shadowBlur = 12
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(roadCenterX + roadTopWidth / 2, horizonY)
      ctx.lineTo(roadCenterX + roadBottomWidth / 2, height)
      ctx.stroke()
      ctx.restore()

      // Glowing Energy Studs along the road borders
      for (let b = 1; b <= 12; b++) {
        const beadZ = (b * 75 - (eng.distanceRun * 14) % 75) + 15
        if (beadZ <= 5 || beadZ > 900) continue
        const { scale: beadScale } = project(0, beadZ)
        const leftX = roadCenterX - (roadTopWidth + (roadBottomWidth - roadTopWidth) * beadScale) / 2
        const rightX = roadCenterX + (roadTopWidth + (roadBottomWidth - roadTopWidth) * beadScale) / 2
        const beadY = horizonY + (height - horizonY) * beadScale

        // Left bead (Cyan)
        ctx.fillStyle = '#67e8f9'
        ctx.beginPath()
        ctx.arc(leftX, beadY, Math.max(1.5, 4.5 * beadScale), 0, Math.PI * 2)
        ctx.fill()

        // Right bead (Gold)
        ctx.fillStyle = '#fde047'
        ctx.beginPath()
        ctx.arc(rightX, beadY, Math.max(1.5, 4.5 * beadScale), 0, Math.PI * 2)
        ctx.fill()
      }

      // 4. ROADSIDE SCENERY (Sakura Trees, Flower Meadows & Shrines)
      const sortedScenery = [...eng.scenery].sort((a, b) => b.z - a.z)
      sortedScenery.forEach(item => {
        if (item.z <= 10 || item.z > 950) return
        const sceneryXFactor = item.side * 1.58
        const { x, y, scale } = project(sceneryXFactor, item.z)

        ctx.save()
        ctx.translate(x, y)
        ctx.scale(scale, scale)

        if (item.type === 'sakura_tree') {
          // Japanese Cherry Blossom Tree
          // Trunk
          ctx.fillStyle = '#78350f'
          ctx.beginPath()
          ctx.moveTo(-10, 0)
          ctx.lineTo(-6, -65)
          ctx.lineTo(6, -65)
          ctx.lineTo(10, 0)
          ctx.closePath()
          ctx.fill()

          // Pink Blossom Clouds
          ctx.fillStyle = '#f472b6'
          ctx.beginPath()
          ctx.arc(-22, -80, 26, 0, Math.PI * 2)
          ctx.arc(20, -82, 28, 0, Math.PI * 2)
          ctx.arc(0, -100, 32, 0, Math.PI * 2)
          ctx.fill()

          // Soft Blossom Highlights
          ctx.fillStyle = '#fbcfe8'
          ctx.beginPath()
          ctx.arc(-8, -108, 18, 0, Math.PI * 2)
          ctx.arc(14, -92, 16, 0, Math.PI * 2)
          ctx.fill()
        } else if (item.type === 'flower_patch') {
          // Cheerful Fantasy Flower Meadow
          // Golden Marigolds
          ctx.fillStyle = '#facc15'
          ctx.beginPath()
          ctx.arc(-14, -10, 8, 0, Math.PI * 2)
          ctx.arc(12, -8, 9, 0, Math.PI * 2)
          ctx.arc(0, -15, 10, 0, Math.PI * 2)
          ctx.fill()

          // Magenta & Sky Blue Buds
          ctx.fillStyle = '#f43f5e'
          ctx.beginPath()
          ctx.arc(-8, -8, 6, 0, Math.PI * 2)
          ctx.arc(18, -12, 6, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = '#38bdf8'
          ctx.beginPath()
          ctx.arc(-22, -6, 6, 0, Math.PI * 2)
          ctx.arc(4, -6, 5, 0, Math.PI * 2)
          ctx.fill()
        } else if (item.type === 'lantern_post') {
          // Temple Stone Lantern Post with Warm Candle Light
          ctx.fillStyle = '#475569'
          ctx.fillRect(-6, -42, 12, 42) // pillar
          ctx.fillRect(-12, -48, 24, 6) // base

          // Glowing vermilion lantern core
          ctx.fillStyle = '#ef4444'
          ctx.fillRect(-10, -68, 20, 20)
          ctx.fillStyle = '#fef08a'
          ctx.beginPath()
          ctx.arc(0, -58, 6, 0, Math.PI * 2)
          ctx.fill()

          // Roof
          ctx.fillStyle = '#334155'
          ctx.beginPath()
          ctx.moveTo(-16, -68)
          ctx.lineTo(0, -78)
          ctx.lineTo(16, -68)
          ctx.closePath()
          ctx.fill()
        } else if (item.type === 'crystal_shrine') {
          // Celestial Floating Crystal
          ctx.fillStyle = '#06b6d4'
          ctx.beginPath()
          ctx.moveTo(0, -55)
          ctx.lineTo(12, -35)
          ctx.lineTo(0, -15)
          ctx.lineTo(-12, -35)
          ctx.closePath()
          ctx.fill()

          ctx.fillStyle = '#67e8f9'
          ctx.beginPath()
          ctx.moveTo(0, -55)
          ctx.lineTo(0, -15)
          ctx.lineTo(-12, -35)
          ctx.closePath()
          ctx.fill()
        }

        ctx.restore()
      })

      // 5. RENDER WORLD ENTITIES (Collectibles & Obstacles)
      const sortedEntities = [...eng.entities].sort((a, b) => b.z - a.z)

      sortedEntities.forEach(entity => {
        if (entity.collected) return
        const { x, y, scale } = project(entity.lane, entity.z)

        ctx.save()
        ctx.translate(x, y)
        ctx.scale(scale, scale)

        if (entity.type === 'bamboo') {
          // Golden Emerald Magical Bamboo Stalk
          // Segmented Jade Stalk
          ctx.fillStyle = '#16a34a'
          ctx.beginPath()
          ctx.roundRect(-9, -58, 18, 58, 7)
          ctx.fill()

          // Golden Joint Rings
          ctx.fillStyle = '#facc15'
          ctx.fillRect(-10, -48, 20, 5)
          ctx.fillRect(-10, -30, 20, 5)
          ctx.fillRect(-10, -12, 20, 5)

          // Glowing Emerald Leaves
          ctx.fillStyle = '#4ade80'
          ctx.beginPath()
          ctx.ellipse(-14, -62, 12, 5, -0.6, 0, Math.PI * 2)
          ctx.ellipse(14, -62, 12, 5, 0.6, 0, Math.PI * 2)
          ctx.ellipse(0, -68, 6, 12, 0, 0, Math.PI * 2)
          ctx.fill()

          // Golden Silk Ribbon Knot
          ctx.fillStyle = '#ef4444'
          ctx.beginPath()
          ctx.arc(0, -30, 5, 0, Math.PI * 2)
          ctx.fill()

          // Ambient Sparkle Aura
          ctx.fillStyle = '#fef08a'
          const starPhase = now * 0.005 + entity.id
          ctx.beginPath()
          ctx.arc(Math.sin(starPhase) * 16, -40 + Math.cos(starPhase) * 12, 2.5, 0, Math.PI * 2)
          ctx.arc(Math.cos(starPhase) * 16, -25 + Math.sin(starPhase) * 12, 2, 0, Math.PI * 2)
          ctx.fill()
        } else if (entity.type === 'star') {
          // 3D Spinning Golden Eco Star
          const starRotate = Math.sin(now * 0.006 + entity.id)
          ctx.save()
          ctx.scale(Math.abs(starRotate) * 0.7 + 0.3, 1)

          // Golden Star Halo
          ctx.fillStyle = 'rgba(251, 191, 36, 0.4)'
          ctx.beginPath()
          ctx.arc(0, -32, 28, 0, Math.PI * 2)
          ctx.fill()

          // 5-Pointed Star
          ctx.fillStyle = '#fbbf24'
          ctx.beginPath()
          for (let p = 0; p < 5; p++) {
            const angle = (p * Math.PI * 2) / 5 - Math.PI / 2
            const innerAngle = angle + Math.PI / 5
            const ox = Math.cos(angle) * 22
            const oy = -32 + Math.sin(angle) * 22
            const ix = Math.cos(innerAngle) * 10
            const iy = -32 + Math.sin(innerAngle) * 10
            if (p === 0) ctx.moveTo(ox, oy)
            else ctx.lineTo(ox, oy)
            ctx.lineTo(ix, iy)
          }
          ctx.closePath()
          ctx.fill()

          // Specular Star Gleam
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(-4, -36, 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        } else if (entity.type === 'log') {
          // Ancient Woodland Mossy Log (Jump Over!)
          // Main Rustic Bark Cylinder
          ctx.fillStyle = '#5c2b0d'
          ctx.beginPath()
          ctx.roundRect(-46, -26, 92, 26, 12)
          ctx.fill()

          // Wood Grain Rings on Left End
          ctx.fillStyle = '#78350f'
          ctx.beginPath()
          ctx.ellipse(-42, -13, 5, 11, 0, 0, Math.PI * 2)
          ctx.fill()

          // Plush Emerald Moss Blanket
          ctx.fillStyle = '#16a34a'
          ctx.beginPath()
          ctx.roundRect(-40, -30, 80, 9, 5)
          ctx.fill()

          // Fantasy Mushrooms on Log (Red with White Spots & Turquoise)
          // Red Toadstool 1
          ctx.fillStyle = '#ef4444'
          ctx.beginPath()
          ctx.arc(-16, -35, 7, Math.PI, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(-18, -38, 1.8, 0, Math.PI * 2)
          ctx.arc(-13, -37, 1.5, 0, Math.PI * 2)
          ctx.fill()

          // Glowing Turquoise Fairy Mushroom
          ctx.fillStyle = '#06b6d4'
          ctx.beginPath()
          ctx.arc(14, -34, 6, Math.PI, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#67e8f9'
          ctx.beginPath()
          ctx.arc(14, -36, 2, 0, Math.PI * 2)
          ctx.fill()
        } else if (entity.type === 'torii') {
          // Magnificent Vermilion Japanese Torii Temple Gate (Slide Under!)
          // Left Pillar with Black Stone Pedestal
          ctx.fillStyle = '#1e293b'
          ctx.fillRect(-56, -8, 14, 8)
          ctx.fillStyle = '#dc2626'
          ctx.fillRect(-54, -98, 10, 90)

          // Right Pillar with Black Stone Pedestal
          ctx.fillStyle = '#1e293b'
          ctx.fillRect(42, -8, 14, 8)
          ctx.fillStyle = '#dc2626'
          ctx.fillRect(44, -98, 10, 90)

          // Crossbeam Support (Black & Gold)
          ctx.fillStyle = '#b91c1c'
          ctx.fillRect(-62, -86, 124, 8)

          // Curved Top Roof Arch with Golden Upturned Tips
          ctx.fillStyle = '#ef4444'
          ctx.beginPath()
          ctx.moveTo(-74, -106)
          ctx.quadraticCurveTo(0, -96, 74, -106)
          ctx.lineTo(76, -98)
          ctx.quadraticCurveTo(0, -88, -76, -98)
          ctx.closePath()
          ctx.fill()

          // Gold Caps on Roof Tips
          ctx.fillStyle = '#facc15'
          ctx.fillRect(-76, -107, 7, 10)
          ctx.fillRect(69, -107, 7, 10)

          // Swaying Red Festival Paper Lanterns (Warm Candle Light Glow)
          const lanternSway = Math.sin(now * 0.005 + entity.id) * 4
          // Left Lantern
          ctx.fillStyle = '#ef4444'
          ctx.beginPath()
          ctx.ellipse(-34 + lanternSway, -74, 8, 11, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#fef08a'
          ctx.beginPath()
          ctx.arc(-34 + lanternSway, -74, 4, 0, Math.PI * 2)
          ctx.fill()

          // Right Lantern
          ctx.fillStyle = '#ef4444'
          ctx.beginPath()
          ctx.ellipse(34 + lanternSway, -74, 8, 11, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#fef08a'
          ctx.beginPath()
          ctx.arc(34 + lanternSway, -74, 4, 0, Math.PI * 2)
          ctx.fill()
        } else if (entity.type === 'boulder') {
          // Amethyst Crystal Geode Boulder (Dodge Left or Right!)
          ctx.fillStyle = '#334155'
          ctx.beginPath()
          ctx.arc(0, -32, 34, 0, Math.PI * 2)
          ctx.fill()

          // Rock highlight
          ctx.fillStyle = '#475569'
          ctx.beginPath()
          ctx.arc(-10, -40, 16, 0, Math.PI * 2)
          ctx.fill()

          // Amethyst Crystal Spires jutting out
          ctx.fillStyle = '#a855f7'
          ctx.beginPath()
          ctx.moveTo(-16, -42)
          ctx.lineTo(-8, -64)
          ctx.lineTo(2, -42)
          ctx.closePath()
          ctx.fill()

          ctx.fillStyle = '#c084fc'
          ctx.beginPath()
          ctx.moveTo(-4, -36)
          ctx.lineTo(10, -56)
          ctx.lineTo(16, -36)
          ctx.closePath()
          ctx.fill()

          // Specular glint
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(-8, -60, 2.5, 0, Math.PI * 2)
          ctx.fill()
        } else if (entity.type === 'magnet') {
          // Solar Magnet Orb (Pulsing Azure & Gold)
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)'
          ctx.beginPath()
          ctx.arc(0, -32, 28, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = '#0284c7'
          ctx.beginPath()
          ctx.arc(0, -32, 22, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 24px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('🧲', 0, -23)
        } else if (entity.type === 'shield') {
          // Bamboo Shield Orb (Emerald Jade & Gold)
          ctx.fillStyle = 'rgba(16, 185, 129, 0.4)'
          ctx.beginPath()
          ctx.arc(0, -32, 28, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = '#059669'
          ctx.beginPath()
          ctx.arc(0, -32, 22, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 24px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('🛡️', 0, -23)
        } else if (entity.type === 'wings') {
          // Leaf Glider Orb (Lavender & Iridescent Wings)
          ctx.fillStyle = 'rgba(168, 85, 247, 0.4)'
          ctx.beginPath()
          ctx.arc(0, -32, 28, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = '#7c3aed'
          ctx.beginPath()
          ctx.arc(0, -32, 22, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 24px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('🍃', 0, -23)
        }

        ctx.restore()
      })

      // 6. HERO: BAO BAO THE PANDA (Cute, Cheerful, Colorful Hero Chibi!)
      const pandaScreenY = height * 0.84 + eng.pandaY
      const pandaScreenX = roadCenterX + eng.pandaX

      ctx.save()
      ctx.translate(pandaScreenX, pandaScreenY)

      // Panda Ground Shadow (Sunstone Warm Shadow)
      const shadowScale = Math.max(0.3, 1 + eng.pandaY * 0.007)
      ctx.fillStyle = 'rgba(67, 20, 7, 0.45)'
      ctx.beginPath()
      ctx.ellipse(0, 10, 30 * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2)
      ctx.fill()

      // Shield Aura (Crystalline Hexagonal Bubble)
      if (eng.hasShield) {
        ctx.save()
        ctx.strokeStyle = '#34d399'
        ctx.lineWidth = 4
        ctx.shadowColor = '#10b981'
        ctx.shadowBlur = 15
        ctx.fillStyle = 'rgba(16, 185, 129, 0.22)'
        ctx.beginPath()
        ctx.arc(0, -36, 52, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.restore()
      }

      // Leaf Glider Wings (Translucent Iridescent Rainbow Wings)
      if (eng.hasWings) {
        const wingFlap = Math.sin(now * 0.035) * 18
        ctx.save()
        // Left Wing
        const leftWingGrad = ctx.createLinearGradient(-50, -60, -10, -20)
        leftWingGrad.addColorStop(0, 'rgba(56, 189, 248, 0.8)')
        leftWingGrad.addColorStop(0.5, 'rgba(244, 114, 182, 0.8)')
        leftWingGrad.addColorStop(1, 'rgba(250, 204, 21, 0.8)')
        ctx.fillStyle = leftWingGrad

        ctx.beginPath()
        ctx.ellipse(-38, -42 + wingFlap * 0.3, 30, 15, -0.45, 0, Math.PI * 2)
        ctx.fill()

        // Right Wing
        const rightWingGrad = ctx.createLinearGradient(10, -20, 50, -60)
        rightWingGrad.addColorStop(0, 'rgba(250, 204, 21, 0.8)')
        rightWingGrad.addColorStop(0.5, 'rgba(244, 114, 182, 0.8)')
        rightWingGrad.addColorStop(1, 'rgba(56, 189, 248, 0.8)')
        ctx.fillStyle = rightWingGrad

        ctx.beginPath()
        ctx.ellipse(38, -42 - wingFlap * 0.3, 30, 15, 0.45, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Magnet Electric Arc Halo
      if (eng.hasMagnet) {
        ctx.save()
        ctx.strokeStyle = '#38bdf8'
        ctx.lineWidth = 3
        ctx.shadowColor = '#0284c7'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(0, -36, 46, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      // Character Stride Physics
      const strideSpeed = eng.speed / 6.8
      const strideCycle = now * 0.018 * strideSpeed
      const legBob = Math.sin(strideCycle) * 12
      const bodyBounce = Math.abs(Math.sin(strideCycle)) * 5
      const armSwing = Math.sin(strideCycle) * 12

      // Spawn Sneaker Sparks on step
      if (eng.isGrounded && !eng.isSliding && Math.abs(legBob) > 10 && Math.random() < 0.35) {
        eng.particles.push({
          x: eng.pandaX + (legBob > 0 ? -14 : 14),
          y: 420,
          vx: (Math.random() - 0.5) * 3,
          vy: -(Math.random() * 2 + 0.5),
          color: '#fbbf24',
          size: Math.random() * 4 + 2,
          alpha: 1,
          life: 0,
          maxLife: 18
        })
      }

      if (eng.isSliding) {
        // ==========================================
        // SLIDING POSE (Cool Knee-Surf on Rainbow Dust!)
        // ==========================================
        // White Round Body
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.ellipse(0, -18, 34, 16, 0, 0, Math.PI * 2)
        ctx.fill()

        // Charcoal Back & Arm
        ctx.fillStyle = '#1e1b4b'
        ctx.beginPath()
        ctx.arc(-22, -18, 13, 0, Math.PI * 2)
        ctx.fill()

        // Red Sneaker Surfing Forward
        ctx.fillStyle = '#ef4444'
        ctx.beginPath()
        ctx.roundRect(14, -10, 22, 10, 4)
        ctx.fill()
        // Gold sole
        ctx.fillStyle = '#f59e0b'
        ctx.fillRect(14, 0, 22, 3)
        // White toe
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(36, -5, 5, 0, Math.PI * 2)
        ctx.fill()

        // Chubby Head with Cheerful Wink
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(16, -26, 17, 0, Math.PI * 2)
        ctx.fill()

        // Cute Black Ears with Pink Inner Blush
        ctx.fillStyle = '#1e1b4b'
        ctx.beginPath()
        ctx.arc(8, -40, 7, 0, Math.PI * 2)
        ctx.arc(26, -38, 7, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fda4af'
        ctx.beginPath()
        ctx.arc(8, -40, 3.5, 0, Math.PI * 2)
        ctx.arc(26, -38, 3.5, 0, Math.PI * 2)
        ctx.fill()

        // Eye Patches
        ctx.fillStyle = '#1e1b4b'
        ctx.beginPath()
        ctx.ellipse(12, -26, 5, 6, -0.2, 0, Math.PI * 2)
        ctx.ellipse(22, -26, 5, 6, 0.2, 0, Math.PI * 2)
        ctx.fill()

        // Sparkling Eye & Wink
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(22, -27, 2, 0, Math.PI * 2)
        ctx.fill()

        // Rosy Pink Cheeks
        ctx.fillStyle = 'rgba(255, 107, 129, 0.7)'
        ctx.beginPath()
        ctx.ellipse(8, -20, 4, 3, 0, 0, Math.PI * 2)
        ctx.ellipse(24, -20, 4, 3, 0, 0, Math.PI * 2)
        ctx.fill()

        // Billowing Red Hero Scarf fluttering backward
        const scarfWave = Math.sin(now * 0.02) * 8
        ctx.fillStyle = '#ef4444'
        ctx.beginPath()
        ctx.moveTo(2, -24)
        ctx.quadraticCurveTo(-20, -32 + scarfWave, -45, -30 - scarfWave)
        ctx.lineTo(-44, -22 - scarfWave)
        ctx.quadraticCurveTo(-20, -24 + scarfWave, 2, -18)
        ctx.closePath()
        ctx.fill()

        // Golden tassel
        ctx.fillStyle = '#fbbf24'
        ctx.fillRect(-48, -28 - scarfWave, 6, 6)

        // Shower of rainbow sliding sparks streaming back
        if (Math.random() < 0.6) {
          eng.particles.push({
            x: eng.pandaX + (Math.random() - 0.5) * 35,
            y: 420,
            vx: -(Math.random() * 4 + 2),
            vy: -(Math.random() * 2 + 1),
            color: ['#f43f5e', '#38bdf8', '#facc15', '#a855f7', '#34d399'][Math.floor(Math.random() * 5)],
            size: Math.random() * 5 + 3,
            alpha: 1,
            life: 0,
            maxLife: 24
          })
        }
      } else {
        // ==========================================
        // RUNNING / JUMPING HERO POSE
        // ==========================================
        // Red & Gold Running Sneakers (Cute High-Tops!)
        // Left Sneaker
        const leftShoeY = 2 + (eng.isGrounded ? legBob : -14)
        const leftShoeX = -16
        ctx.fillStyle = '#ef4444' // Cherry red
        ctx.beginPath()
        ctx.roundRect(leftShoeX - 8, leftShoeY - 10, 16, 12, 4)
        ctx.fill()
        // White rubber toe
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(leftShoeX, leftShoeY - 4, 6, 0, Math.PI * 2)
        ctx.fill()
        // Golden energy sole
        ctx.fillStyle = '#f59e0b'
        ctx.fillRect(leftShoeX - 8, leftShoeY + 1, 16, 3)

        // Right Sneaker
        const rightShoeY = 2 + (eng.isGrounded ? -legBob : -14)
        const rightShoeX = 16
        ctx.fillStyle = '#ef4444'
        ctx.beginPath()
        ctx.roundRect(rightShoeX - 8, rightShoeY - 10, 16, 12, 4)
        ctx.fill()
        // White rubber toe
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(rightShoeX, rightShoeY - 4, 6, 0, Math.PI * 2)
        ctx.fill()
        // Golden energy sole
        ctx.fillStyle = '#f59e0b'
        ctx.fillRect(rightShoeX - 8, rightShoeY + 1, 16, 3)

        // Chubby Pearlescent White Panda Body
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.ellipse(0, -32 - bodyBounce, 28, 30, 0, 0, Math.PI * 2)
        ctx.fill()

        // Silky Charcoal Shoulder Band
        ctx.fillStyle = '#1e1b4b'
        ctx.beginPath()
        ctx.ellipse(0, -38 - bodyBounce, 28, 14, 0, 0, Math.PI * 2)
        ctx.fill()

        // Chubby Swinging Arms with Cute White Paws
        // Left Arm
        ctx.fillStyle = '#1e1b4b'
        ctx.beginPath()
        ctx.arc(-24, -32 - bodyBounce - (eng.isGrounded ? armSwing * 0.7 : -8), 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fda4af' // cute pink paw pad
        ctx.beginPath()
        ctx.arc(-24, -31 - bodyBounce - (eng.isGrounded ? armSwing * 0.7 : -8), 3.5, 0, Math.PI * 2)
        ctx.fill()

        // Right Arm
        ctx.fillStyle = '#1e1b4b'
        ctx.beginPath()
        ctx.arc(24, -32 - bodyBounce + (eng.isGrounded ? armSwing * 0.7 : 8), 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fda4af'
        ctx.beginPath()
        ctx.arc(24, -31 - bodyBounce + (eng.isGrounded ? armSwing * 0.7 : 8), 3.5, 0, Math.PI * 2)
        ctx.fill()

        // Billowing Red & Gold Hero's Scarf (Billows behind him with physics waves!)
        const scarfWave1 = Math.sin(now * 0.02) * 10
        const scarfWave2 = Math.cos(now * 0.024) * 12
        // Scarf Tail 1
        ctx.fillStyle = '#ef4444'
        ctx.beginPath()
        ctx.moveTo(-10, -48 - bodyBounce)
        ctx.quadraticCurveTo(-26, -58 - bodyBounce + scarfWave1, -52, -54 - bodyBounce - scarfWave1)
        ctx.lineTo(-50, -46 - bodyBounce - scarfWave1)
        ctx.quadraticCurveTo(-24, -50 - bodyBounce + scarfWave1, -8, -42 - bodyBounce)
        ctx.closePath()
        ctx.fill()

        // Gold Tassel 1
        ctx.fillStyle = '#fbbf24'
        ctx.fillRect(-56, -52 - bodyBounce - scarfWave1, 6, 7)

        // Scarf Tail 2
        ctx.fillStyle = '#dc2626'
        ctx.beginPath()
        ctx.moveTo(8, -48 - bodyBounce)
        ctx.quadraticCurveTo(24, -60 - bodyBounce + scarfWave2, 48, -56 - bodyBounce - scarfWave2)
        ctx.lineTo(46, -48 - bodyBounce - scarfWave2)
        ctx.quadraticCurveTo(22, -52 - bodyBounce + scarfWave2, 6, -42 - bodyBounce)
        ctx.closePath()
        ctx.fill()

        // Gold Tassel 2
        ctx.fillStyle = '#fbbf24'
        ctx.fillRect(48, -54 - bodyBounce - scarfWave2, 6, 7)

        // Cozy Scarf Neck Wrap & Golden Leaf Brooch
        ctx.fillStyle = '#ef4444'
        ctx.beginPath()
        ctx.ellipse(0, -48 - bodyBounce, 22, 9, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.arc(0, -47 - bodyBounce, 5.5, 0, Math.PI * 2)
        ctx.fill()

        // Chubby Round Panda Head
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(0, -68 - bodyBounce, 25, 0, Math.PI * 2)
        ctx.fill()

        // Round Charcoal Ears with Pink Inner Blush
        // Left Ear
        ctx.fillStyle = '#1e1b4b'
        ctx.beginPath()
        ctx.arc(-21, -88 - bodyBounce, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fda4af'
        ctx.beginPath()
        ctx.arc(-21, -88 - bodyBounce, 5, 0, Math.PI * 2)
        ctx.fill()

        // Right Ear
        ctx.fillStyle = '#1e1b4b'
        ctx.beginPath()
        ctx.arc(21, -88 - bodyBounce, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fda4af'
        ctx.beginPath()
        ctx.arc(21, -88 - bodyBounce, 5, 0, Math.PI * 2)
        ctx.fill()

        // Golden Headband with Sparkling Emerald Gem
        ctx.fillStyle = '#f59e0b'
        ctx.beginPath()
        ctx.ellipse(0, -82 - bodyBounce, 23, 5, 0, 0, Math.PI * 2)
        ctx.fill()

        // Glowing Emerald Gem on Forehead
        ctx.fillStyle = '#10b981'
        ctx.beginPath()
        ctx.arc(0, -84 - bodyBounce, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(-1.5, -85.5 - bodyBounce, 1.8, 0, Math.PI * 2)
        ctx.fill()

        // Cute Tilted Eye Patches
        ctx.fillStyle = '#1e1b4b'
        ctx.beginPath()
        ctx.ellipse(-9, -68 - bodyBounce, 7, 9, -0.15, 0, Math.PI * 2)
        ctx.ellipse(9, -68 - bodyBounce, 7, 9, 0.15, 0, Math.PI * 2)
        ctx.fill()

        // Big Anime Sparkling Eyes (Amber Iris & Double Catchlights!)
        // Left Eye
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(-8, -69 - bodyBounce, 4.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#b45309' // Amber iris
        ctx.beginPath()
        ctx.arc(-8, -69 - bodyBounce, 3.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#0f172a' // Pupil
        ctx.beginPath()
        ctx.arc(-8, -69 - bodyBounce, 2, 0, Math.PI * 2)
        ctx.fill()
        // Dual Catchlights
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(-7, -70 - bodyBounce, 1.3, 0, Math.PI * 2)
        ctx.arc(-9, -68 - bodyBounce, 0.7, 0, Math.PI * 2)
        ctx.fill()

        // Right Eye
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(8, -69 - bodyBounce, 4.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#b45309'
        ctx.beginPath()
        ctx.arc(8, -69 - bodyBounce, 3.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#0f172a'
        ctx.beginPath()
        ctx.arc(8, -69 - bodyBounce, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(9, -70 - bodyBounce, 1.3, 0, Math.PI * 2)
        ctx.arc(7, -68 - bodyBounce, 0.7, 0, Math.PI * 2)
        ctx.fill()

        // Rosy Blushing Cheeks
        ctx.fillStyle = 'rgba(255, 107, 129, 0.65)'
        ctx.beginPath()
        ctx.ellipse(-14, -61 - bodyBounce, 5.5, 3.5, 0, 0, Math.PI * 2)
        ctx.ellipse(14, -61 - bodyBounce, 5.5, 3.5, 0, 0, Math.PI * 2)
        ctx.fill()

        // Heart-Shaped Button Nose
        ctx.fillStyle = '#0f172a'
        ctx.beginPath()
        ctx.arc(0, -62 - bodyBounce, 3.2, 0, Math.PI * 2)
        ctx.fill()

        // Big Cheerful Open Smile with Pink Tongue!
        ctx.fillStyle = '#991b1b'
        ctx.beginPath()
        ctx.arc(0, -56 - bodyBounce, 5.5, 0, Math.PI)
        ctx.fill()
        ctx.fillStyle = '#f472b6' // cute pink tongue
        ctx.beginPath()
        ctx.arc(0, -55 - bodyBounce, 3.5, 0, Math.PI)
        ctx.fill()
      }

      ctx.restore()

      // 7. RENDER PARTICLES (Sparks, Dust, Collection Stars)
      eng.particles.forEach(p => {
        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(roadCenterX + p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // 8. RENDER AMBIENT SAKURA PETALS (Drifting Softly Across Screen)
      eng.petals.forEach(petal => {
        ctx.save()
        ctx.translate(petal.x, petal.y)
        ctx.rotate(petal.rotation)
        ctx.fillStyle = petal.color
        ctx.globalAlpha = 0.75
        ctx.beginPath()
        ctx.ellipse(0, 0, petal.size, petal.size * 0.55, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // 9. HIGH SPEED DASH LINES (When running above 8.5 m/s)
      if (eng.speed > 8.5) {
        ctx.save()
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.35)'
        ctx.lineWidth = 2
        for (let l = 0; l < 8; l++) {
          const lineX = (Math.sin(l * 1.6 + now * 0.008) * 0.5 + 0.5) * width
          const lineY = Math.random() * height
          ctx.beginPath()
          ctx.moveTo(lineX, lineY)
          ctx.lineTo(lineX - 45 * (eng.speed / 6.8), lineY)
          ctx.stroke()
        }
        ctx.restore()
      }

      eng.animFrameId = requestAnimationFrame(renderLoop)
    }

    engine.current.animFrameId = requestAnimationFrame(renderLoop)

    return () => {
      cancelAnimationFrame(engine.current.animFrameId)
      pandaAudio.stopMusic()
    }
  }, [isGameOver, updateQuestProgress])

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: isFullscreen ? '100vw' : '1080px',
        height: isFullscreen ? '100vh' : 'auto',
        margin: '0 auto',
        padding: isFullscreen ? '0' : '0 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* Top Runner HUD */}
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          padding: '12px 24px',
          margin: '0 0 14px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderLeft: '5px solid #f59e0b',
          borderRadius: isFullscreen ? '0' : 'var(--radius-lg)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              pandaAudio.stopMusic()
              setActiveActivity(null)
            }}
            style={{ padding: '6px 14px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} />
            <span>Hub</span>
          </button>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', lineHeight: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Bamboo Dash</span>
              <span className="badge badge-amber" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                <Sparkles size={12} /> Temple Sunstone Run
              </span>
            </h2>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Dodge obstacles &bull; Grab golden bamboo shoots &bull; Speed ramps up!
            </div>
          </div>
        </div>

        {/* Live Gauges & Speed Tier */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {/* Speed Tier Badge */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Panda Pace</div>
            <div style={{ 
              fontSize: '0.85rem', 
              fontWeight: 800, 
              color: currentSpeedKph > 38 ? '#f43f5e' : currentSpeedKph > 30 ? '#f59e0b' : '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Flame size={14} />
              {currentSpeedKph > 38 ? 'Hyper Rush!' : currentSpeedKph > 30 ? 'Sonic Dash' : 'Temple Stride'}
            </div>
          </div>

          {/* Distance */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Distance</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#38bdf8' }}>
              {distance} <span style={{ fontSize: '0.75rem' }}>m</span>
            </div>
          </div>

          {/* Golden Bamboo */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Golden Bamboo</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#4ade80' }}>
              🎋 {bambooCount}
            </div>
          </div>

          {/* Score */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Run Score</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fbbf24' }}>
              {score}
            </div>
          </div>

          {/* Fullscreen Button */}
          <button 
            className="btn btn-icon" 
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Mode'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Active Power-Up Timers Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', width: '100%', justifyContent: 'center' }}>
        {magnetTime > 0 && (
          <span className="badge badge-sky" style={{ padding: '4px 14px', fontSize: '0.82rem', boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)' }}>
            <Magnet size={14} /> Solar Magnet Active ({magnetTime}s)
          </span>
        )}
        {shieldTime > 0 && (
          <span className="badge badge-emerald" style={{ padding: '4px 14px', fontSize: '0.82rem', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}>
            <Shield size={14} /> Bamboo Shield Active ({shieldTime}s)
          </span>
        )}
        {wingsTime > 0 && (
          <span className="badge badge-amber" style={{ padding: '4px 14px', fontSize: '0.82rem', boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)' }}>
            <Feather size={14} /> Leaf Glider Flying High ({wingsTime}s)
          </span>
        )}
      </div>

      {/* Quest Milestone Popover */}
      {activeNotification && (
        <div 
          className="glass-panel animate-float"
          style={{
            position: 'absolute',
            top: '75px',
            background: 'linear-gradient(135deg, rgba(180, 83, 9, 0.95), rgba(120, 53, 15, 0.95))',
            border: '2px solid #fbbf24',
            padding: '8px 22px',
            borderRadius: 'var(--radius-full)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.9rem',
            zIndex: 60,
            boxShadow: '0 0 30px rgba(251, 191, 36, 0.6)'
          }}
        >
          {activeNotification}
        </div>
      )}

      {/* Canvas Viewport Frame */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <canvas
          ref={canvasRef}
          width={900}
          height={560}
          style={{
            width: '100%',
            maxWidth: '900px',
            height: isFullscreen ? 'calc(100vh - 130px)' : '560px',
            borderRadius: isFullscreen ? '0' : 'var(--radius-lg)',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.75), 0 0 35px rgba(251, 191, 36, 0.28)',
            border: '2px solid rgba(251, 191, 36, 0.45)',
            background: '#041d15'
          }}
        />

        {/* Start Game Overlay */}
        {!isPlaying && !isGameOver && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(3, 20, 16, 0.75)',
            backdropFilter: 'blur(8px)',
            borderRadius: isFullscreen ? '0' : 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4.5rem', marginBottom: '8px' }}>🐼🎋✨</div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', marginBottom: '8px', textShadow: '0 4px 15px rgba(0, 0, 0, 0.6)' }}>
              Bamboo Dash: Temple Sunstone Run
            </h2>
            <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.9)', maxWidth: '540px', marginBottom: '24px', lineHeight: 1.5 }}>
              Guide Bao Bao the Panda down the Golden Sunstone Highway!
              Use ⬅️ ➡️ to switch lanes, ⬆️ to Jump over logs, and ⬇️ to Slide under Torii temple gates!
            </p>

            <button 
              className="btn btn-primary"
              onClick={startGame}
              style={{ 
                padding: '15px 48px', 
                fontSize: '1.25rem', 
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 10px 35px rgba(245, 158, 11, 0.55)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 800
              }}
            >
              <Zap size={24} />
              <span>Start Cheerful Sprint!</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(2, 20, 15, 0.88)',
            backdropFilter: 'blur(10px)',
            borderRadius: isFullscreen ? '0' : 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3.6rem', marginBottom: '4px' }}>🎋💥🐼</div>
            <h2 style={{ fontSize: '2.3rem', fontWeight: 900, color: '#ffffff', marginBottom: '6px' }}>
              Great Sprint, Bao Bao!
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Bao Bao tripped on an obstacle, but collected bountiful golden bamboo for the eco sanctuary!
            </p>

            {/* Run Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '18px 28px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '24px',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              minWidth: '400px'
            }}>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8' }}>{distance}m</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Distance Run</div>
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4ade80' }}>🎋 {bambooCount}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Golden Bamboo</div>
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fbbf24' }}>{score}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Total Points</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                className="btn btn-primary" 
                onClick={startGame} 
                style={{ 
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  fontWeight: 800
                }}
              >
                <RotateCcw size={18} />
                <span>Run Again!</span>
              </button>
              <button className="btn btn-secondary" onClick={() => setActiveActivity(null)} style={{ padding: '12px 28px' }}>
                <span>Return to Hub</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* On-Screen Touch / Keyboard Controls Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        marginTop: '14px',
        width: '100%',
        maxWidth: '900px'
      }}>
        <button 
          className="btn btn-secondary" 
          onClick={moveLeft}
          style={{ flex: 1, padding: '12px', fontSize: '1.05rem', fontWeight: 700 }}
        >
          ⬅️ Left (A)
        </button>
        <button 
          className="btn btn-primary" 
          onClick={jump}
          style={{ 
            flex: 1.25, 
            padding: '12px', 
            fontSize: '1.05rem', 
            fontWeight: 800,
            background: 'linear-gradient(135deg, #10b981, #059669)'
          }}
        >
          ⬆️ Jump (W / Space)
        </button>
        <button 
          className="btn btn-accent" 
          onClick={slide}
          style={{ 
            flex: 1.25, 
            padding: '12px', 
            fontSize: '1.05rem', 
            fontWeight: 800,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)'
          }}
        >
          ⬇️ Slide (S)
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={moveRight}
          style={{ flex: 1, padding: '12px', fontSize: '1.05rem', fontWeight: 700 }}
        >
          ➡️ Right (D)
        </button>
      </div>

      {/* In-Run Missions Card */}
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '900px',
          padding: '16px 22px',
          marginTop: '16px',
          border: '1px solid rgba(251, 191, 36, 0.2)'
        }}
      >
        <div style={{ 
          fontSize: '0.82rem', 
          fontWeight: 800, 
          color: '#fbbf24', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em', 
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Trophy size={16} /> Temple Missions & Quests
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {quests.map(q => (
            <div 
              key={q.id}
              style={{
                background: q.completed ? 'rgba(16, 185, 129, 0.22)' : 'rgba(0, 0, 0, 0.35)',
                border: q.completed ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-sm)',
                padding: '9px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: q.completed ? '#6ee7b7' : '#ffffff' }}>
                  {q.title}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Progress: {q.current}/{q.target}
                </div>
              </div>
              <span className="badge" style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', fontSize: '0.68rem', fontWeight: 800 }}>
                +{q.bonusScore} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
