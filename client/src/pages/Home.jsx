import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGeneralContext } from "../context/GeneralContext";
import axiosInstance from "../components/axiosInstance";

export default function Home() {
  const { user, walletBalance, stocks, refreshBalance, showNotification } = useGeneralContext();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStockForTrade, setSelectedStockForTrade] = useState(null);
  const [tradeType, setTradeType] = useState("BUY");
  const [tradeCount, setTradeCount] = useState(5);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Filter stocks by ticker or company name
  const filteredStocks = stocks.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.Stock_Symbol && s.Stock_Symbol.toLowerCase().includes(q)) ||
      (s.Stock_name && s.Stock_name.toLowerCase().includes(q))
    );
  });

  const handleOpenTrade = (stock, type = "BUY") => {
    setSelectedStockForTrade(stock);
    setTradeType(type);
    setTradeCount(1);
  };

  const handleExecuteTrade = async (e) => {
    e.preventDefault();
    if (!selectedStockForTrade || tradeCount <= 0) return;

    setSubmittingOrder(true);
    try {
      const orderData = {
        Stock_Symbol: selectedStockForTrade.Stock_Symbol,
        Stock_name: selectedStockForTrade.Stock_name,
        Price: selectedStockForTrade.Price,
        Count: parseInt(tradeCount, 10),
        Order_Type: tradeType,
        Stock_Type: "Equity",
        Stock_Exchange: selectedStockForTrade.Stock_Exchange || "NASDAQ",
      };

      const res = await axiosInstance.post("/api/orders", orderData);
      if (res.data && res.data.success) {
        showNotification(
          `Successfully executed ${tradeType} order for ${tradeCount} shares of ${selectedStockForTrade.Stock_Symbol}!`,
          "success"
        );
        setSelectedStockForTrade(null);
        await refreshBalance();
      } else {
        showNotification(res.data?.message || "Order placement failed.", "error");
      }
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to execute order. Please check balance or holdings.",
        "error"
      );
    } finally {
      setSubmittingOrder(false);
    }
  };

  const totalOrderAmount = selectedStockForTrade
    ? (selectedStockForTrade.Price * tradeCount).toFixed(2)
    : "0.00";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Top Welcome & Market Indices Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "24px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          background: "linear-gradient(135deg, rgba(17, 23, 38, 0.85) 0%, rgba(13, 17, 26, 0.95) 100%)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "1.75rem", margin: 0 }}>
              Welcome back, {user?.Username || "Trader"}
            </h1>
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
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            US Markets are open. Live simulated quote streaming active.
          </p>
        </div>

        {/* Quick Indices Chips */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div
            style={{
              padding: "8px 14px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-card)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontWeight: 700 }}>S&P 500</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", color: "var(--neon-green)" }}>
              5,842.10 (+0.42%)
            </span>
          </div>

          <div
            style={{
              padding: "8px 14px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-card)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontWeight: 700 }}>NASDAQ</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", color: "var(--neon-green)" }}>
              18,485.20 (+0.78%)
            </span>
          </div>

          <div
            style={{
              padding: "8px 14px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-card)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontWeight: 700 }}>DOW JONES</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", color: "var(--neon-red)" }}>
              42,980.50 (-0.15%)
            </span>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase" }}>
            Simulated Cash Balance
          </div>
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              color: "#fff",
              fontFamily: "var(--font-mono)",
              margin: "8px 0 4px",
            }}
          >
            ${Number(walletBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--neon-green)", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>● Ready to Trade</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase" }}>
            Available Equities
          </div>
          <div
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              color: "var(--accent-primary)",
              fontFamily: "var(--font-mono)",
              margin: "8px 0 4px",
            }}
          >
            {stocks.length} Tickers
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            NASDAQ & NYSE Listed Stocks
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "20px" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase" }}>
            Quick Actions
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
            <Link to="/portfolio" className="btn-secondary" style={{ flex: 1, padding: "8px 12px", fontSize: "0.82rem" }}>
              My Portfolio
            </Link>
            <Link to="/history" className="btn-secondary" style={{ flex: 1, padding: "8px 12px", fontSize: "0.82rem" }}>
              Order History
            </Link>
          </div>
        </div>
      </div>

      {/* Stocks Catalog Table */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.3rem", margin: 0 }}>Live Stock Market Catalog</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "2px" }}>
              Select any asset to trade instantly or inspect historical price action
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search ticker or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ width: "260px", padding: "8px 14px", fontSize: "0.88rem" }}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="trade-table">
            <thead>
              <tr>
                <th>Ticker / Name</th>
                <th>Exchange</th>
                <th>Price</th>
                <th>24h Change</th>
                <th>Volume</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No stocks matching &quot;{searchQuery}&quot; found.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => {
                  const isBullish = (stock.changePercent ?? 0) >= 0;
                  return (
                    <tr key={stock.Stock_Symbol}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "rgba(99, 102, 241, 0.15)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#818cf8",
                              fontWeight: 800,
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.78rem",
                            }}
                          >
                            {stock.Stock_Symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.95rem" }}>
                              {stock.Stock_Symbol}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                              {stock.Stock_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-neutral">{stock.Stock_Exchange || "NASDAQ"}</span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                        ${Number(stock.Price).toFixed(2)}
                      </td>
                      <td>
                        <span className={isBullish ? "badge-bullish" : "badge-bearish"}>
                          {isBullish ? "▲" : "▼"}{" "}
                          {stock.change ? `$${Math.abs(stock.change).toFixed(2)} ` : ""}
                          ({stock.changePercent !== undefined ? `${stock.changePercent}%` : "0.0%"})
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-dim)" }}>
                        {stock.volume ? stock.volume.toLocaleString() : "24,500,000"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            onClick={() => navigate(`/stock/${stock.Stock_Symbol}`)}
                            className="btn-secondary"
                            style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                          >
                            Chart
                          </button>
                          <button
                            onClick={() => handleOpenTrade(stock, "BUY")}
                            className="btn-success"
                            style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                          >
                            Buy
                          </button>
                          <button
                            onClick={() => handleOpenTrade(stock, "SELL")}
                            className="btn-danger"
                            style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                          >
                            Sell
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Trade Slip Modal */}
      {selectedStockForTrade && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setSelectedStockForTrade(null)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: "460px",
              width: "100%",
              padding: "28px",
              background: "var(--bg-card-solid)",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ fontSize: "1.25rem", margin: 0 }}>
                  Trade {selectedStockForTrade.Stock_Symbol}
                </h3>
                <span className="badge-neutral">{selectedStockForTrade.Stock_Exchange || "NASDAQ"}</span>
              </div>
              <button
                onClick={() => setSelectedStockForTrade(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Order Type Toggle (BUY vs SELL) */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
              <button
                type="button"
                onClick={() => setTradeType("BUY")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  background: tradeType === "BUY" ? "var(--neon-green)" : "rgba(255, 255, 255, 0.05)",
                  color: tradeType === "BUY" ? "#000" : "var(--text-muted)",
                  transition: "all 0.2s",
                }}
              >
                BUY (Long)
              </button>
              <button
                type="button"
                onClick={() => setTradeType("SELL")}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  background: tradeType === "SELL" ? "var(--neon-red)" : "rgba(255, 255, 255, 0.05)",
                  color: tradeType === "SELL" ? "#fff" : "var(--text-muted)",
                  transition: "all 0.2s",
                }}
              >
                SELL (Liquidate)
              </button>
            </div>

            <form onSubmit={handleExecuteTrade} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: "var(--radius-md)" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Execution Price</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                  ${Number(selectedStockForTrade.Price).toFixed(2)}
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Number of Shares
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={tradeCount}
                  onChange={(e) => setTradeCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="input-field"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem" }}
                  required
                />
              </div>

              {/* Total Calculation */}
              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  borderBottom: "1px solid var(--border-subtle)",
                  padding: "12px 0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Total Order Cost</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.3rem", fontWeight: 800, color: "#fff" }}>
                  ${Number(totalOrderAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-dim)" }}>
                <span>Available Cash: ${Number(walletBalance).toFixed(2)}</span>
                <span>Commission: $0.00</span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedStockForTrade(null)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className={tradeType === "BUY" ? "btn-success" : "btn-danger"}
                  style={{ flex: 1.5 }}
                >
                  {submittingOrder ? "Executing..." : `Submit ${tradeType} Order`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
