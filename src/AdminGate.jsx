import React, { useState } from "react";
import "./AdminGate.css";

export default function AdminGate({ password, children }) {
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === password) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="gate-backdrop">
      <form
        className={`gate-card ${shaking ? "gate-shake" : ""}`}
        onSubmit={handleSubmit}
      >
        <div className="gate-icon">🔒</div>
        <h2>Admin Access</h2>
        <p>Enter the password to continue</p>

        <input
          className={`gate-input ${error ? "gate-input-error" : ""}`}
          type="password"
          placeholder="Password"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          autoFocus
        />

        {error && (
          <span className="gate-error-msg">Incorrect password</span>
        )}

        <button type="submit" className="gate-btn">
          Unlock
        </button>
      </form>
    </div>
  );
}
