import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGeneralContext } from "../context/GeneralContext";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("User");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { register } = useGeneralContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username || !email || !password) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    const result = await register(username, email, password, userType);
    setLoading(false);

    if (result.success) {
      if (result.user?.UserType === "Admin") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } else {
      setErrorMessage(result.message || "Registration failed.");
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
          maxWidth: "480px",
          width: "100%",
          padding: "36px 32px",
          background: "var(--bg-card-solid)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.75rem", marginBottom: "6px" }}>Create TradeX Account</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Start simulated paper trading with zero risk
          </p>
        </div>

        {/* Incentive Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <span style={{ fontSize: "1.5rem" }}>💰</span>
          <div>
            <div style={{ color: "var(--neon-green)", fontWeight: 700, fontSize: "0.85rem" }}>
              $25,000 Sign-Up Bonus
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
              Free virtual trading balance immediately loaded to your portfolio.
            </div>
          </div>
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

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
              Full Name or Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. AlexMorgan"
              className="input-field"
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@domain.com"
              className="input-field"
              required
            />
          </div>

          {/* Account Role Selector */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
              Account Role
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <label
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${userType === "User" ? "var(--accent-primary)" : "var(--border-card)"}`,
                  background: userType === "User" ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.02)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: userType === "User" ? "#fff" : "var(--text-muted)",
                }}
              >
                <input
                  type="radio"
                  name="userType"
                  value="User"
                  checked={userType === "User"}
                  onChange={() => setUserType("User")}
                  style={{ display: "none" }}
                />
                Trader / Investor
              </label>

              <label
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${userType === "Admin" ? "#a855f7" : "var(--border-card)"}`,
                  background: userType === "Admin" ? "rgba(168, 85, 247, 0.15)" : "rgba(255, 255, 255, 0.02)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: userType === "Admin" ? "#fff" : "var(--text-muted)",
                }}
              >
                <input
                  type="radio"
                  name="userType"
                  value="Admin"
                  checked={userType === "Admin"}
                  onChange={() => setUserType("Admin")}
                  style={{ display: "none" }}
                />
                Platform Admin
              </label>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
                Confirm
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Registering Account..." : "Create Account & Claim $25k"}
          </button>
        </form>

        {/* Switch to Login */}
        <div style={{ textAlign: "center", marginTop: "22px" }}>
          <span style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            Already have an account?{" "}
          </span>
          <Link
            to="/login"
            style={{ color: "var(--accent-primary)", fontWeight: 600, fontSize: "0.88rem" }}
          >
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
