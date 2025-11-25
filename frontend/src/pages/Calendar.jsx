import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL;
const URL  = `${API}/bookings`;
const URLR = `${API}/rooms`;

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function eachDay(startStr, count) {
  const out = []
  for (let i = 0; i < count; i++) {
    out.push(addDays(startStr, i))
  }
  return out
}

function overlaps(b, from, to) {
  return b.checkIn < to && b.checkOut > from
}

export default function Calendar() {
  const [bookings, setBookings] = useState([])
  const [rooms, setRooms] = useState([])

  const [start, setStart] = useState(new Date().toISOString().slice(0, 10))
  const daysToShow = 14
  const dayList = eachDay(start, daysToShow)

  const load = () => {
    axios.get(URL).then((res)  => setBookings(res.data))
    axios.get(URLR).then((res) => setRooms(res.data))
  }

  useEffect(() => {
    load()
  }, [])

  const handleDropOnRoom = (room, event) => {
    event.preventDefault()
    const bookingId = event.dataTransfer.getData('text/plain')
    const booking = bookings.find((b) => b.id === bookingId)
    if (!booking) return

    if (booking.room === room.name) return

    const conflicts = bookings.filter(
      (b) =>
        b.room === room.name &&
        overlaps(b, booking.checkIn, booking.checkOut) &&
        b.id !== booking.id
    )

    const updates = []

    if (conflicts.length === 0) {
      updates.push({ ...booking, room: room.name })
    } else if (conflicts.length === 1) {
      const other = conflicts[0]
      updates.push({ ...booking, room: room.name })
      updates.push({ ...other, room: booking.room })
    } else {
      alert('Too many overlapping bookings in target room to auto-swap.')
      return
    }
    //`${URL}${updated.id}`, updated
    Promise.all(
      updates.map((b) => axios.put(`${URL}/${b.id}`, b))
    ).then(load)
  }

  const handlePrev = () => {
    setStart(addDays(start, -7))
  }

  const handleNext = () => {
    setStart(addDays(start, 7))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Calendar</h2>
        <div className="flex gap-2 text-sm items-center">
          <button
            className="px-2 py-1 rounded border border-slate-300 bg-white"
            type="button"
            onClick={handlePrev}
          >
            ‹ Previous
          </button>
          <span className="text-xs text-slate-500">
            {start} → {addDays(start, daysToShow - 1)}
          </span>
          <button
            className="px-2 py-1 rounded border border-slate-300 bg-white"
            type="button"
            onClick={handleNext}
          >
            Next ›
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[140px_repeat(14,minmax(0,1fr))] text-xs border-b bg-slate-50">
            <div className="px-3 py-2 font-semibold">Room</div>
            {dayList.map((d) => (
              <div key={d} className="px-1 py-2 text-center text-[10px] text-slate-500">
                {d.slice(5)}
              </div>
            ))}
          </div>

          {rooms.map((room) => (
            <div
              key={room.id}
              className="grid grid-cols-[140px_repeat(14,minmax(0,1fr))] text-xs border-b last:border-b-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropOnRoom(room, e)}
            >
              <div className="px-3 py-2 font-medium border-r bg-slate-50/60">
                {room.name}
                <div className="text-[10px] text-slate-500">
                  {room.type} • sleeps {room.capacity}
                </div>
              </div>
              {dayList.map((d) => (
                <div key={d} className="border-l border-slate-100 h-10" />
              ))}

              {bookings
                .filter((b) => b.room === room.name)
                .map((b) => {
                  const startIdx = Math.max(
                    0,
                    Math.floor(
                      (new Date(b.checkIn).getTime() - new Date(start).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )
                  const endIdx = Math.min(
                    daysToShow,
                    Math.ceil(
                      (new Date(b.checkOut).getTime() - new Date(start).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )
                  if (endIdx <= 0 || startIdx >= daysToShow) return null

                  const gridColumn = `${startIdx + 2} / ${endIdx + 2}`
                  const nights =
                    (new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) /
                    (1000 * 60 * 60 * 24)

                  return (
                    <div
                      key={b.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', b.id)
                      }}
                      className="mt-1 mx-0.5 rounded-full text-[10px] px-2 py-1 bg-blue-500/80 text-white shadow cursor-grab active:cursor-grabbing flex items-center justify-between"
                      style={{ gridColumn }}
                      title={`${b.guestName} – ${b.checkIn} → ${b.checkOut} (${nights} nights)`}
                    >
                      <span className="truncate">
                        {b.guestName} • {b.adults}A{b.kids ? `+${b.kids}K` : ''} • €
                        {b.price || 0}
                      </span>
                    </div>
                  )
                })}
            </div>
          ))}

          {rooms.length === 0 && (
            <div className="p-6 text-sm text-slate-500">
              No rooms defined yet. Add rooms in the Rooms page.
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Tip: Drag a booking bar onto another room row to move it. If there is exactly one overlapping
        booking in the target room, the two bookings will automatically swap rooms.
      </p>
    </div>
  )
}
