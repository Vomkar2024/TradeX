import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useGeneralContext } from "../context/GeneralContext";
import axiosInstance from "../components/axiosInstance";

export default function Admin() {
  const { stocks, fetchStocks, showNotification } = useGeneralContext();

  const [stats, setStats] = useState({
    usersCount: 0,
    ordersCount: 0,
    transactionsCount: 0,
    stocksCount: 0,
  });

  // New stock form
  const [newSymbol, setNewSymbol] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newExchange, setNewExchange] = useState("NASDAQ");
  const [newChange, setNewChange] = useState("1.50");
  const [newChangePercent, setNewChangePercent] = useState("0.85");
  const [addingStock, setAddingStock] = useState(false);

  const fetchAdminStats = useCallback(async () => {
    try {
      const [usersRes, ordersRes, txRes] = await Promise.allSettled([
        axiosInstance.get("/api/users/all"),
        axiosInstance.get("/api/orders/all"),
        axiosInstance.get("/api/transactions/all"),
      ]);

      setStats({
        usersCount: usersRes.status === "fulfilled" ? usersRes.value.data?.count || 0 : 0,
        ordersCount: ordersRes.status === "fulfilled" ? ordersRes.value.data?.count || 0 : 0,
        transactionsCount: txRes.status === "fulfilled" ? txRes.value.data?.count || 0 : 0,
        stocksCount: stocks.length,
      });
    } catch (err) {
      console.warn("Could not fetch admin overview statistics:", err.message);
    }
  }, [stocks]);

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  const handleCreateStock = async (e) => {
    e.preventDefault();
    if (!newSymbol || !newName || !newPrice) {
      showNotification("Please provide symbol, company name, and price.", "error");
      return;
    }

    setAddingStock(true);
    try {
      const res = await axiosInstance.post("/api/stocks", {
        Stock_Symbol: newSymbol.toUpperCase().trim(),
        Stock_name: newName.trim(),
        Price: parseFloat(newPrice),
        Stock_Exchange: newExchange,
        change: parseFloat(newChange) || 0,
        changePercent: parseFloat(newChangePercent) || 0,
        volume: 35000000,
      });

      if (res.data?.success) {
        showNotification(`Stock '${newSymbol.toUpperCase()}' listed successfully!`, "success");
        setNewSymbol("");
        setNewName("");
        setNewPrice("");
        await fetchStocks();
        await fetchAdminStats();
      } else {
        showNotification(res.data?.message || "Failed to add stock.", "error");
      }
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to list stock. Ensure admin permissions.",
        "error"
      );
    } finally {
      setAddingStock(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
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
          borderLeft: "4px solid var(--accent-primary)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "1.75rem", margin: 0 }}>TradeX Admin Command Center</h1>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "2px 8px",
                background: "rgba(168, 85, 247, 0.2)",
                color: "#c084fc",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                borderRadius: "var(--radius-full)",
                fontWeight: 800,
              }}
            >
              SUPERUSER
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Platform metrics oversight, order auditing, and stock catalog administration
          </p>
        </div>

        {/* Quick Links */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Link to="/admin/orders" className="btn-secondary" style={{ fontSize: "0.82rem", padding: "8px 14px" }}>
            All Orders
          </Link>
          <Link to="/admin/transactions" className="btn-secondary" style={{ fontSize: "0.82rem", padding: "8px 14px" }}>
            Transactions
          </Link>
          <Link to="/admin/users" className="btn-secondary" style={{ fontSize: "0.82rem", padding: "8px 14px" }}>
            User Directory
          </Link>
          <Link to="/admin/charts" className="btn-primary" style={{ fontSize: "0.82rem", padding: "8px 14px" }}>
            Stock Charts
          </Link>
        </div>
      </div>

      {/* High-level Statistics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
        <div className="glass-panel" style={{ padding: "20px" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 700 }}>
            Registered Users
          </span>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)", margin: "8px 0" }}>
            {stats.usersCount}
          </div>
          <Link to="/admin/users" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: 600 }}>
            Manage Users →
          </Link>
        </div>

        <div className="glass-panel" style={{ padding: "20px" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 700 }}>
            Total Orders Placed
          </span>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--neon-green)", fontFamily: "var(--font-mono)", margin: "8px 0" }}>
            {stats.ordersCount}
          </div>
          <Link to="/admin/orders" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: 600 }}>
            View Order Ledger →
          </Link>
        </div>

        <div className="glass-panel" style={{ padding: "20px" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 700 }}>
            Platform Transactions
          </span>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#38bdf8", fontFamily: "var(--font-mono)", margin: "8px 0" }}>
            {stats.transactionsCount}
          </div>
          <Link to="/admin/transactions" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: 600 }}>
            Inspect Receipts →
          </Link>
        </div>

        <div className="glass-panel" style={{ padding: "20px" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 700 }}>
            Listed Stock Tickers
          </span>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f472b6", fontFamily: "var(--font-mono)", margin: "8px 0" }}>
            {stocks.length}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Real-Time Catalogs
          </span>
        </div>
      </div>

      {/* Add / Update Stock Catalog Form */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }} className="admin-grid">
        <div className="glass-panel" style={{ padding: "28px" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "6px" }}>List New Stock / Update Price</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
            Add new market securities to allow users to trade them across TradeX
          </p>

          <form onSubmit={handleCreateStock} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Stock Symbol (Ticker)
                </label>
                <input
                  type="text"
                  placeholder="e.g. META"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  className="input-field"
                  style={{ fontFamily: "var(--font-mono)" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Exchange
                </label>
                <select
                  value={newExchange}
                  onChange={(e) => setNewExchange(e.target.value)}
                  className="input-field"
                >
                  <option value="NASDAQ">NASDAQ</option>
                  <option value="NYSE">NYSE</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                Company Name
              </label>
              <input
                type="text"
                placeholder="e.g. Meta Platforms, Inc."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Initial Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="510.50"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="input-field"
                  style={{ fontFamily: "var(--font-mono)" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Change ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newChange}
                  onChange={(e) => setNewChange(e.target.value)}
                  className="input-field"
                  style={{ fontFamily: "var(--font-mono)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Change (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newChangePercent}
                  onChange={(e) => setNewChangePercent(e.target.value)}
                  className="input-field"
                  style={{ fontFamily: "var(--font-mono)" }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={addingStock}
              className="btn-primary"
              style={{ padding: "12px", marginTop: "10px" }}
            >
              {addingStock ? "Listing Security..." : "List / Update Stock in Catalog"}
            </button>
          </form>
        </div>

        {/* Existing Catalog Glance */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Active Securities Catalog</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "380px", overflowY: "auto" }}>
            {stocks.map((s) => (
              <div
                key={s.Stock_Symbol}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: "#fff", fontFamily: "var(--font-mono)" }}>
                    {s.Stock_Symbol}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    {s.Stock_name}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-main)" }}>
                    ${Number(s.Price).toFixed(2)}
                  </div>
                  <span className={(s.changePercent ?? 0) >= 0 ? "badge-bullish" : "badge-bearish"}>
                    {s.changePercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .admin-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
