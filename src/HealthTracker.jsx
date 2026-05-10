import { useState, useEffect } from "react"
import { db } from "./firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"

function HealthTracker({ userId, darkMode, onClose }) {
  const [mood, setMood] = useState(3)
  const [sleep, setSleep] = useState(7)
  const [water, setWater] = useState(4)
  const [saved, setSaved] = useState(false)

  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    const load = async () => {
      const ref = doc(db, "users", userId, "health", today)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const d = snap.data()
        setMood(d.mood || 3)
        setSleep(d.sleep || 7)
        setWater(d.water || 4)
      }
    }
    load()
  }, [])

  const save = async () => {
    const ref = doc(db, "users", userId, "health", today)
    await setDoc(ref, { mood, sleep, water, date: today })
    setSaved(true)
    onSave({ mood, sleep, water })

    setTimeout(() => setSaved(false), 2000)
  }

  const card = {
    background: darkMode ? "#2a2a2a" : "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    padding: "16px",
    marginBottom: "12px"
  }

  const label = {
    fontSize: "13px",
    color: darkMode ? "#aaaaaa" : "var(--color-text-secondary)",
    marginBottom: "8px",
    display: "block"
  }

  const value = {
    fontSize: "24px",
    fontWeight: "500",
    color: darkMode ? "#ffffff" : "var(--color-text-primary)"
  }

  const moodEmojis = ["", "😞", "😕", "😐", "🙂", "😄"]

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, width: "320px", height: "100vh",
      background: darkMode ? "#111111" : "var(--color-background-secondary)",
      borderLeft: "0.5px solid var(--color-border-tertiary)",
      padding: "20px", overflowY: "auto", zIndex: 100
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", color: darkMode ? "#ffffff" : "var(--color-text-primary)" }}>
          🏥 Health Tracker
        </h3>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "18px", color: "var(--color-text-secondary)" }}>✕</button>
      </div>

      <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginBottom: "20px" }}>{today}</p>

      {/* Mood */}
      <div style={card}>
        <span style={label}>Mood today</span>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          {[1,2,3,4,5].map(n => (
            <span key={n} onClick={() => setMood(n)} style={{ fontSize: "24px", cursor: "pointer", opacity: mood === n ? 1 : 0.3 }}>
              {moodEmojis[n]}
            </span>
          ))}
        </div>
      </div>

      {/* Sleep */}
      <div style={card}>
        <span style={label}>Sleep hours</span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input type="range" min="0" max="12" step="0.5" value={sleep}
            onChange={e => setSleep(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={value}>{sleep}h</span>
        </div>
      </div>

      {/* Water */}
      <div style={card}>
        <span style={label}>Water glasses</span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input type="range" min="0" max="12" step="1" value={water}
            onChange={e => setWater(parseInt(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={value}>{water} 💧</span>
        </div>
      </div>

      <button onClick={save} style={{
        width: "100%", padding: "12px",
        background: saved ? "var(--color-background-success)" : "var(--color-background-info)",
        color: saved ? "var(--color-text-success)" : "var(--color-text-info)",
        border: "none", borderRadius: "var(--border-radius-md)",
        cursor: "pointer", fontSize: "14px", fontWeight: "500"
      }}>
        {saved ? "✅ Saved!" : "Save Today's Log"}
      </button>
    </div>
  )
}

export default HealthTracker