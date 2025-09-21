import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './shell/App'
import Quotes from './pages/Quotes'
import Jobs from './pages/Jobs'
import Clock from './pages/Clock'
import Materials from './pages/Materials'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import './styles.css'

const router = createBrowserRouter([
  { path: '/', element: <App/>, children: [
    { index: true, element: <Quotes/> },
    { path: 'jobs', element: <Jobs/> },
    { path: 'clock', element: <Clock/> },
    { path: 'materials', element: <Materials/> },
    { path: 'reports', element: <Reports/> },
    { path: 'settings', element: <Settings/> },
  ]}
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><RouterProvider router={router} /></React.StrictMode>
)
