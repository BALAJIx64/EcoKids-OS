import React, { useState } from 'react'
import { EcoProvider, useEco } from './context/EcoContext'
import { Navbar } from './components/Navbar'
import { Hub } from './components/Hub'
import { AchievementModal } from './components/AchievementModal'
import { RecycleRush } from './activities/RecycleRush'
import { WaterGuardian } from './activities/WaterGuardian'
import { EnergyDetective } from './activities/EnergyDetective'
import { ForestGuardian } from './activities/ForestGuardian'
import { WildlifeExplorer } from './activities/WildlifeExplorer'
import { ClimateQuest } from './activities/ClimateQuest'
import { PandaRunner } from './activities/PandaRunner'
import { Trophy, X } from 'lucide-react'

const AppContent: React.FC = () => {
  const { activeActivity, recentAchievement, dismissAchievement } = useEco()
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false)

  const renderActiveActivity = () => {
    switch (activeActivity) {
      case 'recycle':
        return <RecycleRush />
      case 'water':
        return <WaterGuardian />
      case 'energy':
        return <EnergyDetective />
      case 'forest':
        return <ForestGuardian />
      case 'wildlife':
        return <WildlifeExplorer />
      case 'climate':
        return <ClimateQuest />
      case 'panda':
        return <PandaRunner />
      default:
        return <Hub />
    }
  }

  return (
    <div className="app-shell">
      {/* Navigation Bar */}
      <Navbar onOpenAchievements={() => setIsAchievementModalOpen(true)} />

      {/* Main Content Area */}
      <main className="main-content">
        {renderActiveActivity()}
      </main>

      {/* Trophies & Milestones Modal */}
      <AchievementModal 
        isOpen={isAchievementModalOpen} 
        onClose={() => setIsAchievementModalOpen(false)} 
      />

      {/* Unlocked Achievement Toast Notification */}
      {recentAchievement && (
        <div 
          className="glass-panel animate-float"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.95) 0%, rgba(4, 44, 34, 0.95) 100%)',
            border: '2px solid var(--accent-amber)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(245, 158, 11, 0.35)',
            borderRadius: 'var(--radius-md)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            maxWidth: '380px'
          }}
        >
          <div style={{
            fontSize: '2rem',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {recentAchievement.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 800, textTransform: 'uppercase' }}>
              <Trophy size={13} /> Achievement Unlocked!
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              {recentAchievement.title}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {recentAchievement.description}
            </div>
          </div>
          <button 
            className="btn btn-icon" 
            onClick={dismissAchievement}
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px 20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        fontSize: '0.8rem',
        color: 'var(--text-dim)',
        background: 'rgba(2, 20, 15, 0.6)'
      }}>
        EcoKids OS &bull; Empowering the Next Generation of Planet Guardians &bull; Designed for Kubuntu Linux Desktop
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <EcoProvider>
      <AppContent />
    </EcoProvider>
  )
}
