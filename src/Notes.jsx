import { useState, useEffect } from "react"
import { db } from "./firebase"
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query } from "firebase/firestore"

function Notes({ userId, darkMode, onClose }) {
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState("")
  const [saved, setSaved] = useState(false)

  const card = {
    background: darkMode ? "#2a2a2a" : "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    padding: "12px",
    marginBottom: "10px"
  }

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    const q = query(collection(db, "users", userId, "notes"), orderBy("createdAt", "desc"))
    const snap = await getDocs(q)
    setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  const addNote = async () => {
    if (!newNote.trim()) return
    await addDoc(collection(db, "users", userId, "notes"), {
      content: newNote,
      createdAt: Date.now()
    })
    setNewNote("")
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    await loadNotes()
  }

  const deleteNote = async (noteId) => {
    await deleteDoc(doc(db, "users", userId, "notes", noteId))
    await loadNotes()
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
          📝 My Notes
        </h3>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "18px", color: "var(--color-text-secondary)" }}>✕</button>
      </div>

      {/* Add note */}
      <textarea
        value={newNote}
        onChange={e => setNewNote(e.target.value)}
        placeholder="Write a note..."
        rows={3}
        style={{
          width: "100%", padding: "10px", borderRadius: "var(--border-radius-md)",
          border: "0.5px solid var(--color-border-secondary)", fontSize: "13px",
          background: darkMode ? "#2a2a2a" : "var(--color-background-primary)",
          color: darkMode ? "#ffffff" : "var(--color-text-primary)",
          marginBottom: "8px", boxSizing: "border-box", resize: "none"
        }}
      />
      <button onClick={addNote} style={{
        width: "100%", padding: "10px",
        background: saved ? "var(--color-background-success)" : "var(--color-background-info)",
        color: saved ? "var(--color-text-success)" : "var(--color-text-info)",
        border: "none", borderRadius: "var(--border-radius-md)",
        cursor: "pointer", fontSize: "13px", fontWeight: "500",
        marginBottom: "20px"
      }}>
        {saved ? "✅ Saved!" : "Save Note"}
      </button>

      {/* Notes list */}
      {notes.length === 0 && (
        <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", textAlign: "center" }}>No notes yet!</p>
      )}
      {notes.map(note => (
        <div key={note.id} style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
            <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5", color: darkMode ? "#ffffff" : "var(--color-text-primary)", flex: 1 }}>
              {note.content}
            </p>
            <span
              onClick={() => deleteNote(note.id)}
              style={{ fontSize: "12px", cursor: "pointer", opacity: 0.4, flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.opacity = "1"}
              onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}
            >
              🗑️
            </span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
            {new Date(note.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )
}

export default Notes