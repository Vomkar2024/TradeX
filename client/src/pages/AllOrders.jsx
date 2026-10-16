import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../components/axiosInstance";

export default function AllOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/orders/all");
      if (res.data?.success && Array.isArray(res.data.orders)) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.warn("Could not fetch all orders:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  const filteredOrders = orders.filter((o) => {
    if (typeFilter !== "ALL" && o.Order_Type !== typeFilter) return false;
    if (statusFilter !== "ALL" && o.Order_Status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSymbol = o.Stock_Symbol?.toLowerCase().includes(q);
      const matchUser = o.UserId?.toString().toLowerCase().includes(q);
      const matchId = o._id?.toString().toLowerCase().includes(q);
      if (!matchSymbol && !matchUser && !matchId) return false;
    }
    return true;
  });

  const totalTradingVolume = orders.reduce((sum, o) => sum + (o.Total_price || 0), 0);

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
            <h1 style={{ fontSize: "1.75rem", margin: 0 }}>System-Wide Orders Ledger</h1>
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
              ADMIN AUDIT
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Comprehensive trade log of every order placed by all registered accounts
          </p>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
              Total Volume
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 700, color: "var(--neon-green)" }}>
              ${Number(totalTradingVolume).toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", borderRadius: "var(--radius-md)", padding: "3px" }}>
            {["ALL", "BUY", "SELL"].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                style={{
                  background: typeFilter === type ? "var(--accent-primary)" : "transparent",
                  color: typeFilter === type ? "#fff" : "var(--text-muted)",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {type}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ width: "auto", padding: "6px 12px", fontSize: "0.82rem" }}
          >
            <option value="ALL">All Statuses</option>
            <option value="EXECUTED">Executed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Search by Ticker, User ID, or Order ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
          style={{ width: "300px", padding: "8px 12px", fontSize: "0.85rem" }}
        />
      </div>

      {/* Orders Table */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="trade-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User Reference</th>
                <th>Time</th>
                <th>Ticker</th>
                <th>Side</th>
                <th>Shares</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Loading system orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const isBuy = o.Order_Type === "BUY";
                  return (
                    <tr key={o._id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-dim)" }}>
                        #{o._id.slice(-6)}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "#a5b4fc" }}>
                        {o.UserId?.toString().slice(-8) || "System"}
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {o.createdAt ? new Date(o.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                        {o.Stock_Symbol}
                      </td>
                      <td>
                        <span className={isBuy ? "badge-bullish" : "badge-bearish"}>
                          {o.Order_Type}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{o.Count}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>
                        ${Number(o.Price).toFixed(2)}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                        ${Number(o.Total_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            background: o.Order_Status === "EXECUTED" ? "var(--neon-green-bg)" : "rgba(255,255,255,0.08)",
                            color: o.Order_Status === "EXECUTED" ? "var(--neon-green)" : "var(--text-dim)",
                          }}
                        >
                          {o.Order_Status || "EXECUTED"}
                        </span>
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
