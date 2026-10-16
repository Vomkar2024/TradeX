import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGeneralContext } from "../context/GeneralContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { login } = useGeneralContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (result.user?.UserType === "Admin") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } else {
      setErrorMessage(result.message || "Failed to log in.");
    }
  };

  const handleQuickFill = (type) => {
    if (type === "trader") {
      setEmail("trader@tradex.com");
      setPassword("password123");
    } else if (type === "admin") {
      setEmail("admin@tradex.com");
      setPassword("admin123");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 120px)",
        padding: "20px",
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: "460px",
          width: "100%",
          padding: "36px 32px",
          background: "var(--bg-card-solid)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              margin: "0 auto 12px",
              borderRadius: "14px",
              background: "var(--brand-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
            }}
          >
            <span style={{ color: "#fff", fontWeight: 900, fontSize: "1.3rem" }}>TX</span>
          </div>
          <h2 style={{ fontSize: "1.75rem", marginBottom: "6px" }}>Welcome Back</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Sign in to access your TradeX portfolio and live charts
          </p>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--neon-red-bg)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              color: "#fb7185",
              borderRadius: "var(--radius-md)",
              fontSize: "0.85rem",
              marginBottom: "18px",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@tradex.com"
              className="input-field"
              required
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-primary)",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Authenticating..." : "Sign In to TradeX"}
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-subtle)" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", textAlign: "center", marginBottom: "10px" }}>
            FAST DEMO PRESETS
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => handleQuickFill("trader")}
              style={{
                flex: 1,
                padding: "8px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--border-card)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-secondary)",
                fontSize: "0.78rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Demo Trader
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("admin")}
              style={{
                flex: 1,
                padding: "8px",
                background: "rgba(99, 102, 241, 0.1)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                borderRadius: "var(--radius-md)",
                color: "#a5b4fc",
                fontSize: "0.78rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Demo Admin
            </button>
          </div>
        </div>

        {/* Switch to Register */}
        <div style={{ textAlign: "center", marginTop: "22px" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            Don&apos;t have an account?{" "}
          </span>
          <Link
            to="/register"
            style={{ color: "var(--accent-primary)", fontWeight: 600, fontSize: "0.88rem" }}
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
