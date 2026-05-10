import { useState, useEffect, useRef } from "react"
import { db, auth } from "./firebase"
import { doc, getDoc, setDoc, collection, addDoc, getDocs, orderBy, query, deleteDoc } from "firebase/firestore"
import { onAuthStateChanged, signOut } from "firebase/auth"
import Auth from "./Auth"
import HealthTracker from "./HealthTracker"
import StudyMode from "./StudyMode"
import CareerCoach from "./CareerCoach"
import Notes from "./Notes"
import Reminders from "./Reminders"

function App() {
  const [chats, setChats] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [displayedMessages, setDisplayedMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [memory, setMemory] = useState("")
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [showHealth, setShowHealth] = useState(false)
  const [showStudy, setShowStudy] = useState(false)
  const [showCareer, setShowCareer] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [todayHealth, setTodayHealth] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editText, setEditText] = useState("")
  const [listening, setListening] = useState(false)
  const [showReminders, setShowReminders] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthReady(true)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!user) return
    loadMemory()
    loadChats()
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [displayedMessages])

  useEffect(() => {
    document.body.style.background = darkMode ? "#1a1a1a" : "#ffffff"
    document.body.style.color = darkMode ? "#ffffff" : "#000000"
  }, [darkMode])

  const loadMemory = async () => {
    const ref = doc(db, "users", user.uid)
    const snap = await getDoc(ref)
    if (snap.exists()) setMemory(snap.data().memory || "")
  }

  const saveMemory = async (newMemory) => {
    const ref = doc(db, "users", user.uid)
    await setDoc(ref, { memory: newMemory }, { merge: true })
    setMemory(newMemory)
  }

  const loadChats = async () => {
    const q = query(collection(db, "users", user.uid, "chats"), orderBy("createdAt", "desc"))
    const snap = await getDocs(q)
    const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    setChats(loaded)
  }

  const newChat = async () => {
    const ref = await addDoc(collection(db, "users", user.uid, "chats"), {
      title: "New Chat",
      createdAt: Date.now(),
      messages: []
    })
    setCurrentChatId(ref.id)
    setMessages([])
    setDisplayedMessages([])
    await loadChats()
  }

  const openChat = async (chat) => {
    setCurrentChatId(chat.id)
    setMessages(chat.messages || [])
    setDisplayedMessages(chat.messages || [])
  }

  const saveMessages = async (msgs, chatId) => {
    const title = msgs[0]?.content?.slice(0, 30) || "New Chat"
    const ref = doc(db, "users", user.uid, "chats", chatId)
    await setDoc(ref, { messages: msgs, title, updatedAt: Date.now() }, { merge: true })
    await loadChats()
  }

  const deleteChat = async (chatId, e) => {
    e.stopPropagation()
    if (!window.confirm("Delete this chat?")) return
    const ref = doc(db, "users", user.uid, "chats", chatId)
    await deleteDoc(ref)
    if (currentChatId === chatId) {
      setCurrentChatId(null)
      setMessages([])
      setDisplayedMessages([])
    }
    await loadChats()
  }

  const editMessage = async (index) => {
    if (!editText.trim()) return
    const updatedMessages = messages.map((msg, i) =>
      i === index ? { ...msg, content: editText } : msg
    )
    setMessages(updatedMessages)
    setDisplayedMessages(updatedMessages)
    setEditingIndex(null)
    setEditText("")
    await saveMessages(updatedMessages, currentChatId)
  }

  const speakText = (text) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-IN"
    utterance.rate = 1
    utterance.pitch = 1.1
    utterance.volume = 1
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.name.includes("Female") || v.name.includes("Samantha") || v.name.includes("Google"))
    if (preferred) utterance.voice = preferred
    window.speechSynthesis.speak(utterance)
  }

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return alert("Your browser doesn't support voice input! Use Chrome.")
    const recognition = new SpeechRecognition()
    recognition.lang = "en-IN"
    recognition.interimResults = false
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
    }
    recognition.start()
  }

  const animateReply = (allMessages) => {
    const last = allMessages[allMessages.length - 1]
    if (last.role !== "assistant") return
    const words = last.content.split(" ")
    let current = ""
    let i = 0
    const prev = allMessages.slice(0, -1)
    setDisplayedMessages([...prev, { role: "assistant", content: "" }])
    const interval = setInterval(() => {
      current += (i > 0 ? " " : "") + words[i]
      i++
      setDisplayedMessages([...prev, { role: "assistant", content: current }])
      if (i >= words.length) {
        clearInterval(interval)
        speakText(last.content)
      }
    }, 40)
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    let chatId = currentChatId
    if (!chatId) {
      const ref = await addDoc(collection(db, "users", user.uid, "chats"), {
        title: input.slice(0, 30),
        createdAt: Date.now(),
        messages: []
      })
      chatId = ref.id
      setCurrentChatId(chatId)
    }

    const userMessage = { role: "user", content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setDisplayedMessages(updatedMessages)
    setInput("")
    setLoading(true)

    try {
      const response = await fetch(" https://my-ai-friend.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          memory: memory || "",
          health: todayHealth
        })
      })
      const data = await response.json()
      const aiReply = { role: "assistant", content: data.choices[0].message.content }
      const finalMessages = [...updatedMessages, aiReply]
      setMessages(finalMessages)
      animateReply(finalMessages)
      await saveMessages(finalMessages, chatId)

      if (finalMessages.length % 5 === 0) {
        const memRes = await fetch(" https://my-ai-friend.onrender.com/extract-memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: finalMessages })
        })
        const memData = await memRes.json()
        if (memData.memory) await saveMemory(memData.memory)
      }
    } catch (err) {
      console.error(err)
    }

    setLoading(false)
  }

  const closeAllPanels = () => {
    setShowHealth(false)
    setShowStudy(false)
    setShowCareer(false)
    setShowNotes(false)
    setShowTools(false)
  }

  if (!authReady) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Georgia, serif", color: "var(--color-text-secondary)" }}>
      Loading Aria...
    </div>
  )

  if (!user) return <Auth onLogin={() => {}} />

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Georgia, serif", background: darkMode ? "#1a1a1a" : "var(--color-background-tertiary)" }}>

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? "260px" : "0px",
        minWidth: sidebarOpen ? "260px" : "0px",
        overflow: "hidden",
        transition: "all 0.3s ease",
        background: darkMode ? "#111111" : "var(--color-background-secondary)",
        borderRight: "0.5px solid var(--color-border-tertiary)",
        display: "flex", flexDirection: "column"
      }}>
        <div style={{ padding: "16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <span style={{ fontSize: "18px", fontWeight: "500", color: darkMode ? "#ffffff" : "var(--color-text-primary)", display: "block", marginBottom: "12px" }}>🌸 Aria</span>
          <button onClick={() => { setShowSearch(!showSearch); setSearchQuery("") }} style={{
            width: "100%", padding: "8px", borderRadius: "var(--border-radius-md)",
            border: "0.5px solid var(--color-border-secondary)", background: "transparent",
            cursor: "pointer", fontSize: "13px", color: darkMode ? "#ffffff" : "var(--color-text-primary)",
            textAlign: "left", marginBottom: "8px"
          }}>🔍 Search chats</button>
          {showSearch && (
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              autoFocus
              style={{
                width: "100%", padding: "8px", borderRadius: "var(--border-radius-md)",
                border: "0.5px solid var(--color-border-secondary)", fontSize: "13px",
                background: darkMode ? "#2a2a2a" : "var(--color-background-primary)",
                color: darkMode ? "#ffffff" : "var(--color-text-primary)",
                boxSizing: "border-box", marginBottom: "8px"
              }}
            />
          )}
          <button onClick={newChat} style={{
            width: "100%", padding: "8px", borderRadius: "var(--border-radius-md)",
            border: "0.5px solid var(--color-border-secondary)", background: "transparent",
            cursor: "pointer", fontSize: "13px", color: darkMode ? "#ffffff" : "var(--color-text-primary)",
            textAlign: "left"
          }}>+ New Chat</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {chats.length === 0 && (
            <p style={{ fontSize: "12px", color: "var(--color-text-tertiary)", padding: "8px", textAlign: "center" }}>No chats yet</p>
          )}
          {chats
            .filter(chat =>
              chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              chat.messages?.some(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .map(chat => (
              <div key={chat.id} onClick={() => openChat(chat)} style={{
                padding: "10px 12px", borderRadius: "var(--border-radius-md)", cursor: "pointer",
                marginBottom: "4px", fontSize: "13px",
                color: darkMode ? "#ffffff" : "var(--color-text-primary)",
                background: currentChatId === chat.id ? (darkMode ? "#2a2a2a" : "var(--color-background-primary)") : "transparent",
                border: currentChatId === chat.id ? "0.5px solid var(--color-border-tertiary)" : "0.5px solid transparent",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {chat.title || "New Chat"}
                  </span>
                  <span onClick={(e) => deleteChat(chat.id, e)} style={{ marginLeft: "8px", opacity: 0.4, fontSize: "12px", cursor: "pointer", flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}>
                    🗑️
                  </span>
                </div>
              </div>
            ))}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "var(--color-background-info)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: "500", color: "var(--color-text-info)"
            }}>
              {user.email[0].toUpperCase()}
            </div>
            <span style={{ fontSize: "12px", color: darkMode ? "#aaaaaa" : "var(--color-text-secondary)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </span>
          </div>
          <button onClick={() => signOut(auth)} style={{
            padding: "4px 8px", fontSize: "11px", borderRadius: "var(--border-radius-md)",
            border: "0.5px solid var(--color-border-secondary)", background: "transparent",
            cursor: "pointer", color: darkMode ? "#aaaaaa" : "var(--color-text-secondary)"
          }}>Out</button>
        </div>
      </div>

      {/* Main Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ padding: "12px 20px", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", gap: "12px", background: darkMode ? "#111111" : "var(--color-background-primary)" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "16px", color: "var(--color-text-secondary)", padding: "4px" }}>☰</button>
          <span style={{ fontSize: "15px", fontWeight: "500", color: darkMode ? "#ffffff" : "var(--color-text-primary)" }}>
            {currentChatId ? (chats.find(c => c.id === currentChatId)?.title || "Chat") : "Aria"}
          </span>
          {memory && <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>🧠 remembers you</span>}

          <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => setDarkMode(!darkMode)} style={{
              padding: "4px 10px", borderRadius: "var(--border-radius-md)",
              border: "0.5px solid var(--color-border-secondary)",
              background: "transparent", cursor: "pointer",
              fontSize: "13px", color: darkMode ? "#ffffff" : "var(--color-text-secondary)"
            }}>{darkMode ? "☀️" : "🌙"}</button>

            <button onClick={() => window.speechSynthesis.cancel()} style={{
              padding: "4px 10px", borderRadius: "var(--border-radius-md)",
              border: "0.5px solid var(--color-border-secondary)",
              background: "transparent", cursor: "pointer", fontSize: "13px"
            }}>🔇</button>

            {/* Tools dropdown */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowTools(!showTools)} style={{
                padding: "4px 12px", borderRadius: "var(--border-radius-md)",
                border: "0.5px solid var(--color-border-secondary)",
                background: showTools ? "var(--color-background-info)" : "transparent",
                cursor: "pointer", fontSize: "13px",
                color: showTools ? "var(--color-text-info)" : (darkMode ? "#ffffff" : "var(--color-text-secondary)")
              }}>🛠️ Tools ▾</button>

              {showTools && (
                <div style={{
                  position: "absolute", top: "36px", right: 0, zIndex: 200,
                  background: darkMode ? "#1a1a1a" : "var(--color-background-primary)",
                  border: "0.5px solid var(--color-border-secondary)",
                  borderRadius: "var(--border-radius-lg)",
                  padding: "8px", minWidth: "160px"
                }}>
                  {[
                    { icon: "🏥", label: "Health", action: () => { setShowHealth(!showHealth); setShowStudy(false); setShowCareer(false); setShowNotes(false); setShowTools(false) }},
                    { icon: "📚", label: "Study", action: () => { setShowStudy(!showStudy); setShowHealth(false); setShowCareer(false); setShowNotes(false); setShowTools(false) }},
                    { icon: "💼", label: "Career", action: () => { setShowCareer(!showCareer); setShowHealth(false); setShowStudy(false); setShowNotes(false); setShowTools(false) }},
                    { icon: "📝", label: "Notes", action: () => { setShowNotes(!showNotes); setShowHealth(false); setShowStudy(false); setShowCareer(false); setShowTools(false) }},
                    { icon: "⏰", label: "Reminders", action: () => { setShowReminders(!showReminders); setShowHealth(false); setShowStudy(false); setShowCareer(false); setShowNotes(false); setShowTools(false) }},
                  ].map((item, i) => (
                    <div key={i} onClick={item.action} style={{
                      padding: "8px 12px", borderRadius: "var(--border-radius-md)",
                      cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px",
                      color: darkMode ? "#ffffff" : "var(--color-text-primary)"
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = darkMode ? "#2a2a2a" : "var(--color-background-secondary)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {item.icon} {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", background: darkMode ? "#1a1a1a" : "var(--color-background-tertiary)" }}>
          {displayedMessages.length === 0 && (
            <div style={{ textAlign: "center", marginTop: "80px" }}>
              <p style={{ fontSize: "28px", marginBottom: "8px" }}>🌸</p>
              <p style={{ fontSize: "20px", fontWeight: "500", color: darkMode ? "#ffffff" : "var(--color-text-primary)", marginBottom: "8px" }}>Hey! I'm Aria</p>
              <p style={{ fontSize: "14px", color: darkMode ? "#aaaaaa" : "var(--color-text-secondary)" }}>Your personal AI friend. Talk to me about anything!</p>
            </div>
          )}
          {(displayedMessages.length ? displayedMessages : messages).map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "16px" }}>
              {msg.role === "assistant" && (
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--color-background-info)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", marginRight: "8px", flexShrink: 0 }}>
                  🌸
                </div>
              )}
              <div style={{ maxWidth: "70%" }}>
                {editingIndex === i ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={3}
                      style={{
                        padding: "10px", borderRadius: "var(--border-radius-md)",
                        border: "0.5px solid var(--color-border-secondary)",
                        fontSize: "14px", width: "100%", boxSizing: "border-box",
                        background: darkMode ? "#2a2a2a" : "var(--color-background-primary)",
                        color: darkMode ? "#ffffff" : "var(--color-text-primary)"
                      }}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => editMessage(i)} style={{
                        padding: "6px 14px", borderRadius: "var(--border-radius-md)",
                        background: "var(--color-background-info)", border: "none",
                        cursor: "pointer", fontSize: "12px", color: "var(--color-text-info)"
                      }}>Save</button>
                      <button onClick={() => setEditingIndex(null)} style={{
                        padding: "6px 14px", borderRadius: "var(--border-radius-md)",
                        background: "transparent", border: "0.5px solid var(--color-border-secondary)",
                        cursor: "pointer", fontSize: "12px", color: darkMode ? "#ffffff" : "var(--color-text-primary)"
                      }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      padding: "10px 14px", borderRadius: "var(--border-radius-lg)",
                      background: msg.role === "user" ? "var(--color-background-info)" : (darkMode ? "#2a2a2a" : "var(--color-background-primary)"),
                      border: "0.5px solid var(--color-border-tertiary)",
                      fontSize: "14px", lineHeight: "1.6",
                      color: msg.role === "user" ? "var(--color-text-info)" : (darkMode ? "#ffffff" : "var(--color-text-primary)")
                    }}>
                      {msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div style={{ textAlign: "right", marginTop: "4px" }}>
                        <span onClick={() => { setEditingIndex(i); setEditText(msg.content) }}
                          style={{ fontSize: "11px", color: "var(--color-text-tertiary)", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.color = "var(--color-text-primary)"}
                          onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-tertiary)"}
                        >✏️ edit</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--color-background-info)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🌸</div>
              <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>Aria is thinking...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "16px 20px", borderTop: "0.5px solid var(--color-border-tertiary)", background: darkMode ? "#111111" : "var(--color-background-primary)" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", maxWidth: "800px", margin: "0 auto" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Talk to Aria..."
              style={{
                flex: 1, padding: "10px 14px", borderRadius: "var(--border-radius-lg)",
                border: "0.5px solid var(--color-border-secondary)", fontSize: "14px",
                background: darkMode ? "#2a2a2a" : "var(--color-background-secondary)",
                color: darkMode ? "#ffffff" : "var(--color-text-primary)"
              }}
            />
            <button onClick={startVoice} style={{
              padding: "10px 14px", borderRadius: "var(--border-radius-lg)",
              background: listening ? "var(--color-background-danger)" : "transparent",
              border: "0.5px solid var(--color-border-secondary)",
              cursor: "pointer", fontSize: "16px"
            }}>{listening ? "🔴" : "🎙️"}</button>
            <button onClick={sendMessage} style={{
              padding: "10px 18px", borderRadius: "var(--border-radius-lg)",
              background: "var(--color-background-info)", border: "none",
              cursor: "pointer", fontSize: "13px", fontWeight: "500",
              color: "var(--color-text-info)"
            }}>Send</button>
          </div>
        </div>
      </div>

      {showHealth && <HealthTracker userId={user.uid} darkMode={darkMode} onClose={() => setShowHealth(false)} onSave={(data) => setTodayHealth(data)} />}
      {showStudy && <StudyMode darkMode={darkMode} onClose={() => setShowStudy(false)} onSendToAria={(prompt) => { setInput(prompt); setShowStudy(false); setTimeout(() => sendMessage(), 100) }} />}
      {showCareer && <CareerCoach darkMode={darkMode} onClose={() => setShowCareer(false)} onSendToAria={(prompt) => { setInput(prompt); setShowCareer(false); setTimeout(() => sendMessage(), 100) }} />}
      {showNotes && <Notes userId={user.uid} darkMode={darkMode} onClose={() => setShowNotes(false)} />}
        {showReminders && <Reminders userId={user.uid} darkMode={darkMode} onClose={() => setShowReminders(false)} />}
    </div>
  )
}

export default App
