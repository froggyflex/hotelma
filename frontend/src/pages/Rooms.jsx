import React, { useEffect, useState } from 'react'
import axios from 'axios'

const emptyRoom = { name: '', type: 'Double', capacity: 2, status: 'clean' }

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [form, setForm] = useState(emptyRoom)

  const load = () => axios.get('http://localhost:4000/rooms').then((res) => setRooms(res.data))
  useEffect(() => {
    load()
  }, [])

  const handleCreate = () => {
    axios.post('http://localhost:4000/rooms', form).then(() => {
      setForm(emptyRoom)
      load()
    })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Rooms</h2>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="font-semibold mb-2">Add room</h3>
        <div className="grid gap-2 md:grid-cols-4 text-sm">
          <input
            className="border rounded px-2 py-1"
            placeholder="Room number/name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            className="border rounded px-2 py-1"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option>Double</option>
            <option>Family</option>
            <option>Suite</option>
            <option>Studio</option>
          </select>
          <label className="flex flex-col">
            <span className="text-xs text-slate-500 mb-0.5">Capacity</span>
            <input
              type="number"
              min="1"
              className="border rounded px-2 py-1"
              value={form.capacity}
              onChange={(e) =>
                setForm({ ...form, capacity: Number(e.target.value || 1) })
              }
            />
          </label>
          <select
            className="border rounded px-2 py-1"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="clean">Clean</option>
            <option value="dirty">Dirty</option>
            <option value="in-progress">In progress</option>
          </select>
        </div>
        <div className="flex justify-end mt-3">
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm"
            onClick={handleCreate}
          >
            Save room
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left px-3 py-2">Room</th>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-left px-3 py-2">Capacity</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 text-slate-600">{r.type}</td>
                <td className="px-3 py-2 text-slate-600">{r.capacity}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-sm text-slate-500" colSpan={4}>
                  No rooms yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  let color = 'bg-slate-200 text-slate-700'
  if (status === 'clean') color = 'bg-emerald-100 text-emerald-700'
  if (status === 'dirty') color = 'bg-rose-100 text-rose-700'
  if (status === 'in-progress') color = 'bg-amber-100 text-amber-700'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${color}`}>
      {status}
    </span>
  )
}
