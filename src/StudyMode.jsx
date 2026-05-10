import { useState } from "react"

function StudyMode({ darkMode, onClose, onSendToAria }) {
  const [topic, setTopic] = useState("")
  const [mode, setMode] = useState(null)

  const card = {
    background: darkMode ? "#2a2a2a" : "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    padding: "16px",
    marginBottom: "12px",
    cursor: "pointer"
  }

  const actions = [
    { icon: "🧠", label: "Explain a topic", prompt: `Explain this topic simply with examples: ${topic}` },
    { icon: "❓", label: "Quiz me", prompt: `Quiz me on this topic with 5 questions one by one, wait for my answer each time: ${topic}` },
    { icon: "📅", label: "Make study plan", prompt: `Make me a 7 day study plan for: ${topic}` },
    { icon: "📝", label: "Summarize notes", prompt: `Summarize the key points I need to remember for: ${topic}` },
    { icon: "🎯", label: "Interview questions", prompt: `Give me top 10 interview questions for: ${topic}` },
  ]

  const handleAction = (prompt) => {
    if (!topic.trim()) return alert("Please enter a topic first!")
    onSendToAria(prompt)
    onClose()
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
          📚 Study Mode
        </h3>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "18px", color: "var(--color-text-secondary)" }}>✕</button>
      </div>

      <input
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="Enter topic e.g. Binary Search, DBMS..."
        style={{
          width: "100%", padding: "10px", borderRadius: "var(--border-radius-md)",
          border: "0.5px solid var(--color-border-secondary)", fontSize: "13px",
          background: darkMode ? "#2a2a2a" : "var(--color-background-primary)",
          color: darkMode ? "#ffffff" : "var(--color-text-primary)",
          marginBottom: "16px", boxSizing: "border-box"
        }}
      />

      <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginBottom: "12px" }}>What do you want to do?</p>

      {actions.map((action, i) => (
        <div key={i} onClick={() => handleAction(action.prompt)} style={{
          ...card,
          display: "flex", alignItems: "center", gap: "12px",
          transition: "opacity 0.2s"
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <span style={{ fontSize: "20px" }}>{action.icon}</span>
          <span style={{ fontSize: "13px", color: darkMode ? "#ffffff" : "var(--color-text-primary)" }}>
            {action.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export default StudyMode