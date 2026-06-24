import React from 'react'
import { 
  LayoutDashboard, Map, Database, FileSpreadsheet, 
  ShieldCheck, FileCheck, CheckSquare, Ban, 
  FileDown, BarChart3, Users, History, Settings, ChevronLeft, ChevronRight,
  LogOut, ShieldAlert
} from 'lucide-react'

export default function Sidebar({ 
  view, 
  setView, 
  userMode, 
  setUserMode, 
  isAuthenticated, 
  loggedInOfficer, 
  onLogout, 
  onLogin,
  isCollapsed,
  setIsCollapsed
}) {
  
  // Navigation lists for public vs official
  const publicNav = [
    { id: 'applications', label: 'Applications Portal', icon: <FileSpreadsheet size={18} /> },
    { id: 'map', label: 'Map Explorer', icon: <Map size={18} /> },
    { id: 'analytics', label: 'Analytics Hub', icon: <BarChart3 size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
  ]

  const officialNav = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'map', label: 'Map Explorer', icon: <Map size={18} /> },
    { id: 'database', label: 'Claims Ledger', icon: <Database size={18} /> },
    { id: 'applications', label: 'Filing Center', icon: <FileSpreadsheet size={18} /> },
    { id: 'verification', label: 'DSS Matrix', icon: <ShieldAlert size={18} /> },
    { id: 'approvals', label: 'Approvals', icon: <FileCheck size={18} color="#22c55e" /> },
    { id: 'rejections', label: 'Rejections', icon: <Ban size={18} color="#ef4444" /> },
    { id: 'reports', label: 'Reports Hub', icon: <FileDown size={18} /> },
    { id: 'analytics', label: 'Analytics Panel', icon: <BarChart3 size={18} /> },
    { id: 'users', label: 'Users Panel', icon: <Users size={18} /> },
    { id: 'audit', label: 'Audit Logs', icon: <History size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
  ]

  const currentNav = userMode === 'official' ? officialNav : publicNav

  return (
    <div 
      className="glass"
      style={{
        width: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        minWidth: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        background: 'var(--glass-bg)',
        borderRight: '1px solid var(--border)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 100,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="glass"
        style={{
          position: 'absolute',
          top: 24,
          right: -14,
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1px solid var(--border)',
          background: 'var(--card)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          zIndex: 10
        }}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand Header */}
      <div 
        style={{ 
          padding: isCollapsed ? '24px 0' : '24px 20px', 
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isCollapsed ? 'center' : 'flex-start',
          gap: 4,
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>🌳</span>
          {!isCollapsed && (
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
              TerraClaim
            </span>
          )}
        </div>
        {!isCollapsed && (
          <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
            Forest Rights Spatial Ledger
          </span>
        )}
      </div>

      {/* Navigation Items */}
      <div style={{ flex: 1, padding: '16px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {currentNav.map(item => {
          const isActive = view === item.id
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 10,
                border: 'none',
                background: isActive ? 'rgba(22, 101, 52, 0.08)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                position: 'relative',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              title={isCollapsed ? item.label : undefined}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              {/* Active indicator bar on the left */}
              {isActive && (
                <div 
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    height: '60%',
                    width: 4,
                    borderRadius: '0 4px 4px 0',
                    background: 'var(--accent)'
                  }}
                />
              )}
              
              <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: isActive ? 'var(--primary)' : 'inherit' }}>
                {item.icon}
              </span>
              
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </div>

      {/* User Session Box */}
      <div 
        style={{ 
          padding: '12px 14px', 
          borderTop: '1px solid var(--border)', 
          background: 'rgba(0,0,0,0.01)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          alignItems: isCollapsed ? 'center' : 'stretch'
        }}
      >
        {userMode === 'official' && isAuthenticated && loggedInOfficer ? (
          // Logged in official
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            {!isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {loggedInOfficer.designation.split(' ')[0]} Officer
                </div>
                <div style={{ fontSize: 9.5, color: 'var(--text-secondary)' }}>
                  Division: <strong>{loggedInOfficer.jurisdiction}</strong>
                </div>
              </div>
            )}
            <button
              onClick={onLogout}
              style={{
                width: '100%',
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.1)',
                borderRadius: 8,
                padding: '8px',
                color: 'var(--danger)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'center',
                gap: 6,
                transition: 'all 0.2s'
              }}
              title="Sign Out"
            >
              <LogOut size={12} />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        ) : (
          // Public portal trigger
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {userMode === 'public' ? (
              <button
                onClick={onLogin}
                style={{
                  width: '100%',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--primary)'}
                title="Officer Login"
              >
                <ShieldCheck size={13} />
                {!isCollapsed && <span>Officer Login</span>}
              </button>
            ) : (
              <button
                onClick={() => setUserMode('public')}
                style={{
                  width: '100%',
                  background: 'var(--card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--card)'}
                title="Public Portal"
              >
                <Users size={13} />
                {!isCollapsed && <span>Public Portal</span>}
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
