import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL;
const URL  = `${API}/bookings`;
const URLR = `${API}/rooms`;

export default function Dashboard() {
  const [bookings, setBookings] = useState([])
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    axios.get(URL).then((res) => setBookings(res.data))
    axios.get(URLR).then((res) => setRooms(res.data))
  }, [])

  const todayStr = new Date().toISOString().slice(0, 10)

  const arrivalsToday = bookings.filter((b) => b.checkIn === todayStr)
  const departuresToday = bookings.filter((b) => b.checkOut === todayStr)
  const occupiedToday = bookings.filter(
    (b) => b.checkIn <= todayStr && b.checkOut > todayStr
  )

  const dirtyRooms = rooms.filter((r) => r.status === 'dirty')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-2">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Arrivals today" value={arrivalsToday.length} accent="bg-emerald-500" />
        <StatCard label="Departures today" value={departuresToday.length} accent="bg-rose-500" />
        <StatCard label="Occupied today" value={occupiedToday.length} accent="bg-blue-500" />
        <StatCard label="Rooms needing cleaning" value={dirtyRooms.length} accent="bg-amber-500" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ListCard title="Arrivals" items={arrivalsToday} />
        <ListCard title="Departures" items={departuresToday} />
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-full ${accent} opacity-80`} />
    </div>
  )
}

function ListCard({ title, items }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="font-semibold mb-2 text-blue-700">{title}</h3>
      {items.length === 0 && <p className="text-sm text-slate-400">No records.</p>}
      <ul className="space-y-1 text-sm">
        {items.map((b) => (
          <li key={b.id} className="flex justify-between border-b last:border-none py-1">
            <span>{b.guestName}</span>
            <span className="text-xs text-slate-500">
              Room {b.room} • {b.checkIn} → {b.checkOut}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
