import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../components/axiosInstance";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/users/all");
      if (res.data?.success && Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.warn("Could not fetch users list:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    const role = u.UserType || u.usertype || "User";
    if (roleFilter !== "ALL" && role.toUpperCase() !== roleFilter.toUpperCase()) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (u.Username || u.username || "").toLowerCase().includes(q);
      const matchEmail = (u.email || "").toLowerCase().includes(q);
      const matchId = u._id?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchId) return false;
    }
    return true;
  });

  const totalPlatformBalance = users.reduce((sum, u) => sum + (u.cashBalance || u.balance || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div
        className="glass-panel"
        style={{
          padding: "24px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Registered User Directory</h1>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "2px 8px",
                background: "rgba(168, 85, 247, 0.2)",
                color: "#c084fc",
                borderRadius: "var(--radius-full)",
                fontWeight: 700,
              }}
            >
              MEMBERSHIP DB
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Overview and balance auditing for all trader and administrator accounts
          </p>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
              Total Virtual Float
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 700, color: "var(--neon-green)" }}>
              ${Number(totalPlatformBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <Link to="/admin" className="btn-secondary" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
            Admin Hub
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", borderRadius: "var(--radius-md)", padding: "3px" }}>
          {["ALL", "USER", "ADMIN"].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              style={{
                background: roleFilter === role ? "var(--accent-primary)" : "transparent",
                color: roleFilter === role ? "#fff" : "var(--text-muted)",
                border: "none",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {role === "USER" ? "Traders Only" : role === "ADMIN" ? "Admins Only" : "All Roles"}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by Username, Email, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
          style={{ width: "280px", padding: "8px 12px", fontSize: "0.85rem" }}
        />
      </div>

      {/* Users Table */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="trade-table">
            <thead>
              <tr>
                <th>Account ID</th>
                <th>User</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Virtual Cash Balance</th>
                <th>Member Since</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Loading user registry...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const role = u.UserType || u.usertype || "User";
                  const isAdmin = role === "Admin";
                  const balance = u.cashBalance ?? u.balance ?? 0;
                  const dateStr = u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—";

                  return (
                    <tr key={u._id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-dim)" }}>
                        #{u._id.slice(-6)}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "50%",
                              background: isAdmin ? "rgba(168, 85, 247, 0.3)" : "rgba(99, 102, 241, 0.2)",
                              color: isAdmin ? "#c084fc" : "#a5b4fc",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 800,
                            }}
                          >
                            {(u.Username || u.username || "U").charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: "#fff" }}>
                            {u.Username || u.username}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                        {u.email}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            background: isAdmin ? "rgba(168, 85, 247, 0.2)" : "rgba(255, 255, 255, 0.08)",
                            color: isAdmin ? "#c084fc" : "var(--text-secondary)",
                            border: `1px solid ${isAdmin ? "rgba(168, 85, 247, 0.4)" : "var(--border-subtle)"}`,
                          }}
                        >
                          {role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                        ${Number(balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ color: "var(--text-dim)", fontSize: "0.82rem", fontFamily: "var(--font-mono)" }}>
                        {dateStr}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
