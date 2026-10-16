import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../context/GeneralContext";
import axiosInstance from "../components/axiosInstance";

export default function Profile() {
  const { user, walletBalance, refreshProfile, logout, showNotification } = useGeneralContext();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.Username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.Username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { Username: username, email };
      if (newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const res = await axiosInstance.put("/api/users/profile", payload);
      if (res.data?.success) {
        showNotification("Profile updated successfully!", "success");
        setNewPassword("");
        await refreshProfile();
      } else {
        showNotification(res.data?.message || "Failed to update profile.", "error");
      }
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Error updating account details.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Profile Header Card */}
      <div
        className="glass-panel"
        style={{
          padding: "32px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          flexWrap: "wrap",
          background: "linear-gradient(135deg, rgba(17, 23, 38, 0.9) 0%, rgba(13, 17, 26, 0.95) 100%)",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "var(--brand-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.2rem",
            fontWeight: 800,
            color: "#fff",
            boxShadow: "0 8px 24px var(--accent-glow)",
          }}
        >
          {user?.Username ? user.Username.charAt(0).toUpperCase() : "U"}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "1.6rem", margin: 0 }}>{user?.Username || "Trader Account"}</h1>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "2px 8px",
                background: "rgba(99, 102, 241, 0.2)",
                color: "#a5b4fc",
                border: "1px solid rgba(99, 102, 241, 0.4)",
                borderRadius: "var(--radius-full)",
                fontWeight: 700,
              }}
            >
              {user?.UserType || "Trader"}
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: "4px" }}>
            {user?.email} • Account ID: {user?._id?.slice(-8) || "TX-PRO"}
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="btn-danger"
          style={{ padding: "8px 18px", fontSize: "0.85rem" }}
        >
          Sign Out
        </button>
      </div>

      {/* Account Settings & Financial Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "24px" }} className="profile-grid">
        {/* Edit Form */}
        <div className="glass-panel" style={{ padding: "28px" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "20px" }}>Edit Personal Information</h2>
          <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Username / Display Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Change Password (Leave blank to keep existing)
              </label>
              <input
                type="password"
                placeholder="New password (optional)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ marginTop: "10px", padding: "12px" }}
            >
              {saving ? "Saving Changes..." : "Save Profile Details"}
            </button>
          </form>
        </div>

        {/* Financial & Status Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="glass-panel" style={{ padding: "24px" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 700 }}>
              Virtual Cash Reserves
            </span>
            <div
              style={{
                fontSize: "1.8rem",
                fontWeight: 800,
                color: "var(--neon-green)",
                fontFamily: "var(--font-mono)",
                margin: "8px 0 6px",
              }}
            >
              ${Number(walletBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
              Virtual paper currency allocated for stock execution experiments.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: "12px" }}>Account Privileges</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Access Level:</span>
                <strong style={{ color: "#fff" }}>{user?.UserType || "Trader"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Commission:</span>
                <strong style={{ color: "var(--neon-green)" }}>$0.00 / Free</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Execution Mode:</span>
                <strong style={{ color: "#fff" }}>Simulated Real-Time</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
