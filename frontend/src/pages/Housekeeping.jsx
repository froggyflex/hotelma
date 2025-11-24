import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Housekeeping() {
  const [rooms, setRooms] = useState([])

  const load = () => axios.get('http://localhost:4000/rooms').then((res) => setRooms(res.data))
  useEffect(() => {
    load()
  }, [])

  const updateStatus = (room, status) => {
    axios
      .put(`http://localhost:4000/rooms/${room.id}`, { ...room, status })
      .then(() => load())
  }

  const grouped = {
    dirty: rooms.filter((r) => r.status === 'dirty'),
    'in-progress': rooms.filter((r) => r.status === 'in-progress'),
    clean: rooms.filter((r) => r.status === 'clean'),
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-2">Housekeeping</h2>
      <p className="text-sm text-slate-500 mb-4">
        Tap a button to change room status. This view is perfect for a tablet used by the
        cleaning team.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <Column title="Dirty" color="border-rose-300" rooms={grouped.dirty} onSet={updateStatus} />
        <Column
          title="In progress"
          color="border-amber-300"
          rooms={grouped['in-progress']}
          onSet={updateStatus}
        />
        <Column
          title="Clean"
          color="border-emerald-300"
          rooms={grouped.clean}
          onSet={updateStatus}
        />
      </div>
    </div>
  )
}

function Column({ title, color, rooms, onSet }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 border-t-4 ${color}`}>
      <h3 className="font-semibold mb-3">{title}</h3>
      {rooms.length === 0 && (
        <p className="text-xs text-slate-400">No rooms in this state right now.</p>
      )}
      <div className="space-y-2">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="border rounded-lg px-3 py-2 flex items-center justify-between text-sm"
          >
            <div>
              <div className="font-medium">{room.name}</div>
              <div className="text-xs text-slate-500">
                {room.type} • sleeps {room.capacity}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button
                className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded"
                onClick={() => onSet(room, 'clean')}
              >
                Clean
              </button>
              <button
                className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded"
                onClick={() => onSet(room, 'dirty')}
              >
                Dirty
              </button>
              <button
                className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded"
                onClick={() => onSet(room, 'in-progress')}
              >
                In progress
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
