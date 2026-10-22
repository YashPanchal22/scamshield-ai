import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Scanner from './pages/Scanner'
import Assistant from './pages/Assistant'
import Emergency from './pages/Emergency'
import Intel from './pages/Intel'
import Learn from './pages/Learn'
import Family from './pages/Family'
import HistoryPage from './pages/History'
import SettingsPage from './pages/Settings'
import { SettingsContext, loadSettings, saveSettings, type Settings } from './lib/store'

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', settings.theme === 'dark')
    root.classList.toggle('light', settings.theme === 'light')
    root.style.colorScheme = settings.theme
  }, [settings.theme])

  const update = (s: Settings) => { setSettings(s); saveSettings(s) }

  return (
    <SettingsContext.Provider value={{ settings, update }}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scan" element={<Scanner />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/intel" element={<Intel />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/family" element={<Family />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsContext.Provider>
  )
}
