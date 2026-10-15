import type { Achievement, EcoRank } from '../types'

export const ECO_RANKS: EcoRank[] = [
  { level: 1, title: 'Eco Seedling', minScore: 0, badge: '🌱', perk: 'Welcome to the EcoKids Conservation Guild!' },
  { level: 2, title: 'Sprout Scout', minScore: 250, badge: '🌿', perk: 'Unlocks local habitat badges' },
  { level: 3, title: 'Forest Ranger', minScore: 600, badge: '🌲', perk: 'Expert knowledge of native ecosystems' },
  { level: 4, title: 'Ocean Guardian', minScore: 1100, badge: '🌊', perk: 'Mastery over marine conservation' },
  { level: 5, title: 'Clean Energy Hero', minScore: 1700, badge: '⚡', perk: 'Certified renewable energy architect' },
  { level: 6, title: 'Master Planet Protector', minScore: 2400, badge: '🌍', perk: 'Planetary champion of Earth restoration' },
]

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'Green Journey Begins',
    description: 'Complete your very first educational conservation activity!',
    icon: '🌱',
    unlocked: false,
  },
  {
    id: 'recycle_master',
    title: 'Recycle Master',
    description: 'Score 100% sorting accuracy in Recycle Rush without contaminating bins.',
    icon: '♻️',
    unlocked: false,
  },
  {
    id: 'water_hero',
    title: 'Hydro Hero',
    description: 'Detect and eliminate all household leaks in Water Guardian.',
    icon: '💧',
    unlocked: false,
  },
  {
    id: 'energy_detective',
    title: 'Watt Whisperer',
    description: 'Turn an energy-wasting house into a net-zero solar home in Energy Detective.',
    icon: '⚡',
    unlocked: false,
  },
  {
    id: 'forest_builder',
    title: 'Canopy Creator',
    description: 'Restore a diverse multi-layer native woodland in Forest Guardian.',
    icon: '🌳',
    unlocked: false,
  },
  {
    id: 'wildlife_champion',
    title: 'Wildlife Shield',
    description: 'Match all animals to their biomes and deploy threat shields in Wildlife Explorer.',
    icon: '🦊',
    unlocked: false,
  },
  {
    id: 'climate_stabilizer',
    title: 'Climate Champion',
    description: 'Bring atmospheric CO2 below 350 ppm in Climate Quest.',
    icon: '🌏',
    unlocked: false,
  },
  {
    id: 'gaia_legend',
    title: 'EcoKids Grand Legend',
    description: 'Achieve 3 Stars across all core educational experiences.',
    icon: '👑',
    unlocked: false,
  },
  {
    id: 'panda_sprinter',
    title: 'Temple Panda Marathoner',
    description: 'Sprint past 500 meters in Bamboo Dash at hyper speed!',
    icon: '🐼',
    unlocked: false,
  },
  {
    id: 'bamboo_master',
    title: 'Bamboo Feast Master',
    description: 'Gather 100 sweet bamboo shoots in a single run of Bamboo Dash.',
    icon: '🎋',
    unlocked: false,
  },
]
