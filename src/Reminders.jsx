import { useState, useEffect } from "react"
import { db } from "./firebase"
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query } from "firebase/firestore"

function Reminders({ userId, darkMode, onClose }) {
  const [reminders, setReminders] = useState([])
  const [text, setText] = useState("")
  const [time, setTime] = useState("")
  const [saved, setSaved] = useState(false)

  const card = {
    background: darkMode ? "#2a2a2a" : "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    padding: "12px",
    marginBottom: "10px"
  }

  useEffect(() => {
    loadReminders()
    const interval = setInterval(checkReminders, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadReminders = async () => {
    const q = query(collection(db, "users", userId, "reminders"), orderBy("createdAt", "desc"))
    const snap = await getDocs(q)
    setReminders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const checkReminders = async () => {
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    const snap = await getDocs(collection(db, "users", userId, "reminders"))
    snap.docs.forEach(d => {
      const reminder = d.data()
      if (reminder.time === currentTime && !reminder.notified) {
        new Notification("🌸 Aria Reminder", { body: reminder.text })
      }
    })
  }

  const addReminder = async () => {
    if (!text.trim() || !time) return
    await addDoc(collection(db, "users", userId, "reminders"), {
      text, time, createdAt: Date.now(), notified: false
    })
    setText("")
    setTime("")
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    await loadReminders()
    Notification.requestPermission()
  }

  const deleteReminder = async (id) => {
    await deleteDoc(doc(db, "users", userId, "reminders", id))
    await loadReminders()
  }

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, width: "320px", height: "100vh",
      background: darkMode ? "#111111" : "var(--color-background-secondary)",
      borderLeft: "0.5px solid var(--color-border-tertiary)",
      padding: "20px", overflowY: "auto", zIndex: 100
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", color: darkMode ? "#ffffff" : "var(--color-text-primary)" }}>
          ⏰ Reminders
        </h3>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
      </div>

      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Reminder e.g. Study DSA"
        style={{
          width: "100%", padding: "10px", borderRadius: "var(--border-radius-md)",
          border: "0.5px solid var(--color-border-secondary)", fontSize: "13px",
          background: darkMode ? "#2a2a2a" : "var(--color-background-primary)",
          color: darkMode ? "#ffffff" : "var(--color-text-primary)",
          marginBottom: "8px", boxSizing: "border-box"
        }}
      />

      <input
        type="time"
        value={time}
        onChange={e => setTime(e.target.value)}
        style={{
          width: "100%", padding: "10px", borderRadius: "var(--border-radius-md)",
          border: "0.5px solid var(--color-border-secondary)", fontSize: "13px",
          background: darkMode ? "#2a2a2a" : "var(--color-background-primary)",
          color: darkMode ? "#ffffff" : "var(--color-text-primary)",
          marginBottom: "8px", boxSizing: "border-box"
        }}
      />

      <button onClick={addReminder} style={{
        width: "100%", padding: "10px",
        background: saved ? "var(--color-background-success)" : "var(--color-background-info)",
        color: saved ? "var(--color-text-success)" : "var(--color-text-info)",
        border: "none", borderRadius: "var(--border-radius-md)",
        cursor: "pointer", fontSize: "13px", fontWeight: "500",
        marginBottom: "20px"
      }}>
        {saved ? "✅ Saved!" : "Set Reminder"}
      </button>

      {reminders.length === 0 && (
        <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textAlign: "center" }}>No reminders yet!</p>
      )}

      {reminders.map(r => (
        <div key={r.id} style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: "13px", color: darkMode ? "#ffffff" : "var(--color-text-primary)", fontWeight: "500" }}>{r.text}</p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--color-text-tertiary)" }}>⏰ {r.time}</p>
            </div>
            <span onClick={() => deleteReminder(r.id)} style={{ fontSize: "12px", cursor: "pointer", opacity: 0.4 }}
              onMouseEnter={e => e.currentTarget.style.opacity = "1"}
              onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}>
              🗑️
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Reminders