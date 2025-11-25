

const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const { v4: uuid } = require('uuid')

const app = express()
app.use(cors())
app.use(express.json())

const DB_PATH = path.join(__dirname, 'data', 'db.json')

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    return { rooms: [], bookings: [] }
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to read DB file', e)
    return { rooms: [], bookings: [] }
  }
}

function saveDB(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

// --- ROOMS ---

app.get('/rooms', (req, res) => {
  const db = loadDB()
  res.json(db.rooms)
})

app.post('/rooms', (req, res) => {
  const db = loadDB()
  const room = {
    id: uuid(),
    name: req.body.name || 'Room',
    type: req.body.type || 'Double',
    capacity: typeof req.body.capacity === 'number' ? req.body.capacity : 2,
    status: req.body.status || 'clean',
  }
  db.rooms.push(room)
  saveDB(db)
  res.json(room)
})

app.put('/rooms/:id', (req, res) => {
  const db = loadDB()
  const id = req.params.id
  db.rooms = db.rooms.map((r) => (r.id === id ? { ...r, ...req.body, id } : r))
  saveDB(db)
  res.json({ ok: true })
})

// --- BOOKINGS ---

app.get('/bookings', (req, res) => {
  const db = loadDB()
  res.json(db.bookings)
})

app.post('/bookings', (req, res) => {
  const db = loadDB()
  const body = req.body || {}
  const booking = {
    id: uuid(),
    guestName: body.guestName || '',
    room: body.room || '',
    checkIn: body.checkIn || '',
    checkOut: body.checkOut || '',
    adults: typeof body.adults === 'number' ? body.adults : 2,
    kids: typeof body.kids === 'number' ? body.kids : 0,
    channel: body.channel || 'Direct',
    price: typeof body.price === 'number' ? body.price : 0,
    notes: body.notes || '',
  }
  db.bookings.push(booking)
  saveDB(db)
  res.json(booking)
})

app.put('/bookings/:id', (req, res) => {
  const db = loadDB()
  const id = req.params.id
  db.bookings = db.bookings.map((b) => (b.id === id ? { ...b, ...req.body, id } : b))
  saveDB(db)
  res.json({ ok: true })
})

app.delete('/bookings/:id', (req, res) => {
  const db = loadDB()
  const id = req.params.id
  db.bookings = db.bookings.filter((b) => b.id !== id)
  saveDB(db)
  res.json({ ok: true })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

//app.listen(PORT, () => {
  //console.log('Backend listening on http://localhost:' + PORT)
//})
