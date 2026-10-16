import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useGeneralContext } from "../context/GeneralContext";
import axiosInstance from "../components/axiosInstance";

export default function History() {
  const { showNotification } = useGeneralContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL, BUY, SELL
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, EXECUTED, PENDING, CANCELLED
  const [searchTicker, setSearchTicker] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/orders");
      if (res.data?.success && Array.isArray(res.data.orders)) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.warn("Could not fetch user orders:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (orderId) => {
    try {
      const res = await axiosInstance.put(`/api/orders/${orderId}/cancel`);
      if (res.data?.success) {
        showNotification("Order successfully cancelled.", "success");
        await fetchOrders();
      } else {
        showNotification(res.data?.message || "Failed to cancel order.", "error");
      }
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Could not cancel this order.",
        "error"
      );
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (typeFilter !== "ALL" && o.Order_Type !== typeFilter) return false;
    if (statusFilter !== "ALL" && o.Order_Status !== statusFilter) return false;
    if (searchTicker && !o.Stock_Symbol?.toLowerCase().includes(searchTicker.toLowerCase())) {
      return false;
    }
    return true;
  });

  const totalVolume = orders.reduce((sum, o) => sum + (o.Total_price || 0), 0);
  const executedCount = orders.filter((o) => o.Order_Status === "EXECUTED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header & Metrics */}
      <div
        className="glass-panel"
        style={{
          padding: "24px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Trading & Order History</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Audit trail of all executed market slips and simulated orders
          </p>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
              Total Orders
            </span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
              {orders.length}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
              Executed
            </span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 700, color: "var(--neon-green)" }}>
              {executedCount}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
              Volume Traded
            </span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 700, color: "var(--accent-primary)" }}>
              ${Number(totalVolume).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
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
          {/* Order Type Toggle */}
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

          {/* Status Filter */}
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
          placeholder="Filter by Ticker (e.g. AAPL)..."
          value={searchTicker}
          onChange={(e) => setSearchTicker(e.target.value)}
          className="input-field"
          style={{ width: "240px", padding: "8px 12px", fontSize: "0.85rem" }}
        />
      </div>

      {/* Orders Table */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="trade-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Ticker</th>
                <th>Side</th>
                <th>Shares</th>
                <th>Price</th>
                <th>Total Value</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Loading order history...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No orders found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const isBuy = o.Order_Type === "BUY";
                  const dateStr = o.createdAt
                    ? new Date(o.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recent";

                  return (
                    <tr key={o._id}>
                      <td style={{ color: "var(--text-dim)", fontSize: "0.82rem", fontFamily: "var(--font-mono)" }}>
                        {dateStr}
                      </td>
                      <td>
                        <Link
                          to={`/stock/${o.Stock_Symbol}`}
                          style={{
                            fontWeight: 700,
                            color: "#fff",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {o.Stock_Symbol}
                        </Link>
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
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            background:
                              o.Order_Status === "EXECUTED"
                                ? "var(--neon-green-bg)"
                                : o.Order_Status === "PENDING"
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(255, 255, 255, 0.08)",
                            color:
                              o.Order_Status === "EXECUTED"
                                ? "var(--neon-green)"
                                : o.Order_Status === "PENDING"
                                ? "#f59e0b"
                                : "var(--text-dim)",
                          }}
                        >
                          {o.Order_Status || "EXECUTED"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {o.Order_Status === "PENDING" ? (
                          <button
                            onClick={() => handleCancelOrder(o._id)}
                            style={{
                              background: "rgba(244, 63, 94, 0.15)",
                              border: "1px solid rgba(244, 63, 94, 0.3)",
                              color: "#fb7185",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        ) : (
                          <span style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>—</span>
                        )}
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
