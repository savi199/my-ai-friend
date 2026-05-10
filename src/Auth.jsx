import { useState } from "react"
import { auth } from "./firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"

function Auth({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setError("")
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      onLogin()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", fontFamily: "sans-serif", textAlign: "center" }}>
      <h2>🌸 Welcome to Aria</h2>
      <p style={{ color: "#888" }}>Your personal AI friend</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
        />

        {error && <p style={{ color: "red", fontSize: "13px" }}>{error}</p>}

        <button
          onClick={handleSubmit}
          style={{ padding: "10px", background: "#6c63ff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
        >
          {isSignup ? "Sign Up" : "Login"}
        </button>

        <p style={{ color: "#888", fontSize: "13px" }}>
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <span
            onClick={() => setIsSignup(!isSignup)}
            style={{ color: "#6c63ff", cursor: "pointer" }}
          >
            {isSignup ? "Login" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  )
}

export default Auth