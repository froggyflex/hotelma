import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Bookings from './pages/Bookings'
import Rooms from './pages/Rooms'
import Calendar from './pages/Calendar'
import Housekeeping from './pages/Housekeeping'

const navLinkClass = ({ isActive }) =>
  'px-3 py-2 rounded-md text-sm font-medium ' +
  (isActive ? 'bg-white text-blue-700' : 'hover:bg-blue-500/30')

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen">
        <aside className="w-64 bg-blue-700 text-white p-4 flex flex-col space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Luis Pool</h1>
            <p className="text-xs text-blue-100">Room & Booking Manager</p>
          </div>
          <nav className="flex flex-col space-y-2 text-sm">
            <NavLink to="/" end className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/bookings" className={navLinkClass}>
              Bookings
            </NavLink>
            <NavLink to="/rooms" className={navLinkClass}>
              Rooms
            </NavLink>
            <NavLink to="/calendar" className={navLinkClass}>
              Calendar
            </NavLink>
            <NavLink to="/housekeeping" className={navLinkClass}>
              Housekeeping
            </NavLink>
          </nav>
        </aside>
        <main className="flex-1 p-6 overflow-auto bg-slate-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/housekeeping" element={<Housekeeping />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
