import { useState } from "react"

function CareerCoach({ darkMode, onClose, onSendToAria }) {
  const [role, setRole] = useState("")

  const card = {
    background: darkMode ? "#2a2a2a" : "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    padding: "16px",
    marginBottom: "12px",
    cursor: "pointer"
  }

  const actions = [
    { icon: "🎯", label: "Mock interview", prompt: `Do a mock technical interview for a ${role} role. Ask me questions one by one and give feedback on my answers.` },
    { icon: "📄", label: "Resume tips", prompt: `Give me specific resume tips for a ${role} role as a fresh IT graduate.` },
    { icon: "🧠", label: "DSA prep", prompt: `What DSA topics should I focus on for ${role} interviews? Give me a priority list.` },
    { icon: "💬", label: "HR questions", prompt: `Give me top 10 HR interview questions for ${role} and how to answer them using STAR format.` },
    { icon: "🗺️", label: "Career roadmap", prompt: `Give me a 3 month roadmap to get a ${role} job as a 3rd year IT student.` },
    { icon: "💰", label: "Salary insights", prompt: `What is the expected salary range for a fresher ${role} in India? What skills increase it?` },
  ]

  const handleAction = (prompt) => {
    if (!role.trim()) return alert("Please enter a job role first!")
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
          💼 Career Coach
        </h3>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "18px", color: "var(--color-text-secondary)" }}>✕</button>
      </div>

      <input
        value={role}
        onChange={e => setRole(e.target.value)}
        placeholder="Job role e.g. SDE, Frontend Dev..."
        style={{
          width: "100%", padding: "10px", borderRadius: "var(--border-radius-md)",
          border: "0.5px solid var(--color-border-secondary)", fontSize: "13px",
          background: darkMode ? "#2a2a2a" : "var(--color-background-primary)",
          color: darkMode ? "#ffffff" : "var(--color-text-primary)",
          marginBottom: "16px", boxSizing: "border-box"
        }}
      />

      <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginBottom: "12px" }}>What do you need help with?</p>

      {actions.map((action, i) => (
        <div key={i} onClick={() => handleAction(action.prompt)} style={{
          ...card,
          display: "flex", alignItems: "center", gap: "12px",
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

export default CareerCoach