import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { jsPDF } from "jspdf"

const API = import.meta.env.VITE_API_URL;
const URL  = `${API}/bookings`;
const URLR = `${API}/rooms`;
const emptyBooking = {
  guestName: '',
  room: '',
  checkIn: '',
  checkOut: '',
  adults: 2,
  kids: 0,
  channel: 'Direct',
  price: 0,
  notes: '',
}

 const downloadPdf = (booking) => {
    const doc = new jsPDF()

    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.text("Booking Details", 14, 20)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")

    const fields = [
      ["Guest", booking.guestName],
      ["Room", booking.room],
      ["Check-in", booking.checkIn],
      ["Check-out", booking.checkOut],
      ["Adults", booking.adults],
      ["Kids", booking.kids],
      ["Channel", booking.channel],
      ["Price (€)", booking.price],
      ["Notes", booking.notes || "-"],
    ]

    let y = 35
    fields.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold")
      doc.text(`${label}:`, 14, y)
      doc.setFont("helvetica", "normal")
      doc.text(String(value), 60, y)
      y += 8
    })

    doc.save(`booking_${booking.guestName}_${booking.room}.pdf`)
  }

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [form, setForm] = useState(emptyBooking)
  const [selected, setSelected] = useState(null)
  const [filterDate, setFilterDate] = useState("")

  const load = () =>
    axios.get(URL).then((res) => setBookings(res.data))

  useEffect(() => {
    load()
  }, [])

  const handleCreate = () => {
    axios.post(URL, form).then(() => {
      setForm(emptyBooking)
      load()
    })
  }

  const handleUpdate = (updated) => {
    axios.put(`${URL}${updated.id}`, updated).then(() => {
      setSelected(null)
      load()
    })
  }

  const handleDelete = (id) => {
    if (!window.confirm('Delete this booking?')) return
    axios.delete(`${URL}${updated.id}`, updated).then(load)
  }

  // 🔎 Apply date filter: show only bookings where the selected day
  // is between checkIn and checkOut (inclusive)
  const filteredBookings = filterDate
    ? bookings.filter((b) => {
        if (!b.checkIn || !b.checkOut) return false
        return filterDate >= b.checkIn && filterDate <= b.checkOut
      })
    : bookings




  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-4">
        <h2 className="text-2xl font-bold mb-2">Bookings</h2>

        {/* 🔽 Date filter */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-2 text-sm">Filter by date</h3>
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            {filterDate && (
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-slate-700"
                onClick={() => setFilterDate("")}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-3">Add Booking</h3>
          <BookingForm form={form} setForm={setForm} onSubmit={handleCreate} />
        </div>

        <div className="grid gap-3">
          {filteredBookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onClick={() => setSelected(b)}
              onDelete={() => handleDelete(b.id)}
            />
          ))}
          {filteredBookings.length === 0 && (
            <p className="text-sm text-slate-500">
              {filterDate
                ? 'No bookings for this date.'
                : 'No bookings yet. Add one above.'}
            </p>
          )}
        </div>
      </div>

      {selected && (
        <BookingEditor
          booking={selected}
          onClose={() => setSelected(null)}
          onSave={handleUpdate}
        />
      )}
    </div>
  )
}

function BookingForm({ form, setForm, onSubmit, submitLabel = 'Save booking' }) {
  const update = (field) => (e) =>
    setForm({
      ...form,
      [field]:
        field === 'price' || field === 'adults' || field === 'kids'
          ? Number(e.target.value || 0)
          : e.target.value,
    })

  return (
    <div className="grid gap-2 md:grid-cols-2 text-sm">
      <input
        className="border rounded px-2 py-1"
        placeholder="Guest name"
        value={form.guestName}
        onChange={update('guestName')}
      />
      <input
        className="border rounded px-2 py-1"
        placeholder="Room"
        value={form.room}
        onChange={update('room')}
      />
      <label className="flex flex-col">
        <span className="text-xs text-slate-500 mb-0.5">Check-in</span>
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={form.checkIn}
          onChange={update('checkIn')}
        />
      </label>
      <label className="flex flex-col">
        <span className="text-xs text-slate-500 mb-0.5">Check-out</span>
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={form.checkOut}
          onChange={update('checkOut')}
        />
      </label>
      <label className="flex flex-col">
        <span className="text-xs text-slate-500 mb-0.5">Adults</span>
        <input
          type="number"
          min="0"
          className="border rounded px-2 py-1"
          value={form.adults}
          onChange={update('adults')}
        />
      </label>
      <label className="flex flex-col">
        <span className="text-xs text-slate-500 mb-0.5">Kids</span>
        <input
          type="number"
          min="0"
          className="border rounded px-2 py-1"
          value={form.kids}
          onChange={update('kids')}
        />
      </label>
      <label className="flex flex-col">
        <span className="text-xs text-slate-500 mb-0.5">Channel</span>
        <select
          className="border rounded px-2 py-1"
          value={form.channel}
          onChange={update('channel')}
        >
          <option>Direct</option>
          <option>Booking.com</option>
          <option>Expedia</option>
          <option>Other</option>
        </select>
      </label>
      <label className="flex flex-col">
        <span className="text-xs text-slate-500 mb-0.5">Total price (€)</span>
        <input
          type="number"
          min="0"
          className="border rounded px-2 py-1"
          value={form.price}
          onChange={update('price')}
        />
      </label>
      <div className="md:col-span-2">
        <textarea
          className="border rounded px-2 py-1 w-full min-h-[60px]"
          placeholder="Notes (flight details, requests, etc.)"
          value={form.notes}
          onChange={update('notes')}
        />
      </div>
      <div className="md:col-span-2 flex justify-end mt-2">
        <button
          type="button"
          className="bg-blue-600 text-white px-4 py-1.5 rounded shadow-sm text-sm"
          onClick={onSubmit}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}

function BookingCard({ booking, onClick, onDelete }) {
  const nights =
    booking.checkIn && booking.checkOut
      ? Math.round(
          (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null

  return (
    <div
      className="bg-white rounded-xl shadow-sm p-3 flex justify-between items-center cursor-pointer hover:ring-2 hover:ring-blue-300 transition"
      onClick={onClick}
    >
      <div>

        <div className="font-semibold">
          {booking.guestName || 'Unnamed guest'}{' '}
          <span className="text-xs text-slate-500">• Room {booking.room || '?'}</span>
          &nbsp; &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadPdf(booking);
              }}
              className="p-2 rounded-full shadow hover:bg-blue-50 transition"
            >
              
              <lord-icon
                src="https://cdn.lordicon.com/nocovwne.json"
                trigger="hover"
                colors="primary:#1d4ed8,secondary:#1e3a8a"
                style={{ width: "25px", height: "25px" }}
              >
              </lord-icon>
            </button>

        </div>
        <div className="text-xs text-slate-500">
          {booking.checkIn} → {booking.checkOut}{' '}
          {nights != null && <span>({nights} night{nights === 1 ? '' : 's'})</span>}
        </div>
        <div className="text-xs text-slate-500">
          {booking.adults} adults, {booking.kids} kids • {booking.channel}
          
        </div>
        
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="text-sm font-semibold">€{booking.price || 0}</div>
        <button
          className="text-xs text-rose-600 hover:text-rose-700"
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          Delete
        </button>
               
      </div>
    </div>
  )
}

function BookingEditor({ booking, onClose, onSave }) {
  const [form, setForm] = useState(booking)

  const handleSave = () => {
    onSave(form)
  }

  return (
    <div className="w-96 bg-white rounded-xl shadow-xl p-4 border border-slate-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-blue-700">Edit booking</h3>
        <button
          className="text-xs text-slate-500 hover:text-slate-700"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <BookingForm form={form} setForm={setForm} onSubmit={handleSave} submitLabel="Save changes" />
    </div>
  )
}
