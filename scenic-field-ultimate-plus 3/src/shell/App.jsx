import React from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import Toast from '../components/Toast'

const tabs = [
  { to: '/', label: 'Quotes', icon: '💬' },
  { to: '/jobs', label: 'Jobs', icon: '🧰' },
  { to: '/clock', label: 'Clock', icon: '⏱️' },
  { to: '/materials', label: 'Materials', icon: '🧾' },
  { to: '/reports', label: 'Reports', icon: '📊' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function App(){
  const location = useLocation()
  const title = location.pathname === '/' ? 'Quotes' : location.pathname.slice(1).replace(/\b\w/g, c => c.toUpperCase())
  return (
    <div className="app-shell">
      <header className="app-header no-print">
        <div className="header-row">
          <h1>Scenic Roots • Ultimate+</h1>
          <span className="badge">Offline-ready</span>
        </div>
        <div className="header-sub">{title}</div>
      </header>
      <main className="app-main"><Outlet/></main>
      <nav className="tabbar no-print" role="tablist" aria-label="Main">
        {tabs.map(t => (
          <NavLink key={t.to} to={t.to} className={({isActive}) => 'tab' + (isActive ? ' active' : '')} role="tab">
            <span className="tab-icon" aria-hidden="true">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </NavLink>
        ))}
      </nav>
      <Toast/>
    </div>
  )
}
