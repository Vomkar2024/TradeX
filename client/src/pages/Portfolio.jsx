import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../context/GeneralContext";
import axiosInstance from "../components/axiosInstance";

export default function Portfolio() {
  const { walletBalance, stocks, refreshBalance, depositFunds, withdrawFunds, showNotification } = useGeneralContext();
  const navigate = useNavigate();

  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cash management modal states
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashModalType, setCashModalType] = useState("DEPOSIT"); // 'DEPOSIT' or 'WITHDRAW'
  const [cashAmount, setCashAmount] = useState(2500);

  // Quick trade modal
  const [sellModalStock, setSellModalStock] = useState(null);
  const [sellShares, setSellShares] = useState(1);
  const [submittingSell, setSubmittingSell] = useState(false);

  // Fetch portfolio holdings from backend
  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/stocks/portfolio");
      if (res.data?.success && Array.isArray(res.data.holdings)) {
        setHoldings(res.data.holdings);
      }
    } catch (err) {
      console.warn("Could not fetch portfolio holdings:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Merge holdings with current live market prices to compute real-time values
  const augmentedHoldings = useMemo(() => {
    return holdings.map((h) => {
      const liveStock = stocks.find((s) => s.Stock_Symbol === h.Stock_Symbol);
      const currentPrice = liveStock ? liveStock.Price : h.Price;
      const totalCostBasis = (h.Price || 0) * (h.Count || 0);
      const currentMarketValue = currentPrice * (h.Count || 0);
      const profitLoss = currentMarketValue - totalCostBasis;
      const profitLossPercent = totalCostBasis > 0 ? (profitLoss / totalCostBasis) * 100 : 0;

      return {
        ...h,
        currentPrice,
        totalCostBasis,
        currentMarketValue,
        profitLoss,
        profitLossPercent,
      };
    });
  }, [holdings, stocks]);

  // Aggregate totals
  const totalHoldingsValue = augmentedHoldings.reduce((sum, h) => sum + h.currentMarketValue, 0);
  const totalCostBasis = augmentedHoldings.reduce((sum, h) => sum + h.totalCostBasis, 0);
  const totalUnrealizedPnL = totalHoldingsValue - totalCostBasis;
  const totalPnLPercent = totalCostBasis > 0 ? (totalUnrealizedPnL / totalCostBasis) * 100 : 0;
  const totalNetEquity = totalHoldingsValue + (walletBalance || 0);

  const handleCashAction = async (e) => {
    e.preventDefault();
    if (cashAmount <= 0) return;

    if (cashModalType === "DEPOSIT") {
      await depositFunds(cashAmount, "Instant Simulated Wire");
    } else {
      if (cashAmount > walletBalance) {
        showNotification("Insufficient cash balance to withdraw this amount.", "error");
        return;
      }
      await withdrawFunds(cashAmount, "Instant Bank Transfer");
    }
    setCashModalOpen(false);
  };

  const handleQuickSell = async (e) => {
    e.preventDefault();
    if (!sellModalStock || sellShares <= 0) return;

    setSubmittingSell(true);
    try {
      const res = await axiosInstance.post("/api/orders", {
        Stock_Symbol: sellModalStock.Stock_Symbol,
        Stock_name: sellModalStock.Stock_name,
        Price: sellModalStock.currentPrice,
        Count: parseInt(sellShares, 10),
        Order_Type: "SELL",
        Stock_Type: "Equity",
        Stock_Exchange: sellModalStock.Stock_Exchange || "NASDAQ",
      });

      if (res.data?.success) {
        showNotification(
          `Successfully sold ${sellShares} shares of ${sellModalStock.Stock_Symbol}!`,
          "success"
        );
        setSellModalStock(null);
        await refreshBalance();
        await fetchPortfolio();
      } else {
        showNotification(res.data?.message || "Sell order failed.", "error");
      }
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to execute sell order.",
        "error"
      );
    } finally {
      setSubmittingSell(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Top Portfolio Valuation Summary */}
      <div
        className="glass-panel"
        style={{
          padding: "28px",
          background: "linear-gradient(135deg, rgba(17, 23, 38, 0.9) 0%, rgba(13, 17, 26, 0.98) 100%)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Net Portfolio Equity
            </div>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                color: "#fff",
                fontFamily: "var(--font-mono)",
                margin: "4px 0 8px",
              }}
            >
              ${totalNetEquity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span className={totalUnrealizedPnL >= 0 ? "badge-bullish" : "badge-bearish"}>
                {totalUnrealizedPnL >= 0 ? "▲ +" : "▼ "}
                ${Math.abs(totalUnrealizedPnL).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                ({totalPnLPercent.toFixed(2)}%) Total Return
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>
                Invested: ${totalCostBasis.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Quick Cash Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => {
                setCashModalType("DEPOSIT");
                setCashModalOpen(true);
              }}
              className="btn-success"
              style={{ padding: "10px 18px", fontSize: "0.88rem" }}
            >
              + Deposit Cash
            </button>
            <button
              onClick={() => {
                setCashModalType("WITHDRAW");
                setCashModalOpen(true);
              }}
              className="btn-secondary"
              style={{ padding: "10px 18px", fontSize: "0.88rem" }}
            >
              Withdraw Cash
            </button>
          </div>
        </div>

        {/* Sub-metrics bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>AVAILABLE CASH</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 700, color: "var(--neon-green)" }}>
              ${Number(walletBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>HOLDINGS VALUE</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
              ${totalHoldingsValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>ACTIVE POSITIONS</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 700, color: "var(--accent-primary)" }}>
              {augmentedHoldings.length} Positions
            </div>
          </div>
        </div>
      </div>

      {/* Asset Allocation Bar */}
      {augmentedHoldings.length > 0 && (
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "12px", color: "var(--text-secondary)" }}>
            Asset Portfolio Allocation
          </h3>
          <div style={{ display: "flex", height: "14px", borderRadius: "var(--radius-full)", overflow: "hidden", gap: "2px" }}>
            {augmentedHoldings.map((h, i) => {
              const pct = totalHoldingsValue > 0 ? (h.currentMarketValue / totalHoldingsValue) * 100 : 0;
              const colors = ["#6366f1", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#f59e0b"];
              const color = colors[i % colors.length];
              return (
                <div
                  key={h.Stock_Symbol}
                  style={{
                    width: `${pct}%`,
                    background: color,
                    transition: "width 0.3s ease",
                  }}
                  title={`${h.Stock_Symbol}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "12px" }}>
            {augmentedHoldings.map((h, i) => {
              const pct = totalHoldingsValue > 0 ? (h.currentMarketValue / totalHoldingsValue) * 100 : 0;
              const colors = ["#6366f1", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#f59e0b"];
              return (
                <div key={h.Stock_Symbol} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors[i % colors.length] }} />
                  <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{h.Stock_Symbol}</span>
                  <span style={{ color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>({pct.toFixed(1)}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h2 style={{ fontSize: "1.3rem", marginBottom: "16px" }}>Your Active Stock Positions</h2>

        <div style={{ overflowX: "auto" }}>
          <table className="trade-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Quantity</th>
                <th>Avg Buy Price</th>
                <th>Current Price</th>
                <th>Total Value</th>
                <th>Unrealized P&L</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Loading your portfolio holdings...
                  </td>
                </tr>
              ) : augmentedHoldings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    You currently have no open stock positions.{" "}
                    <button
                      onClick={() => navigate("/home")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent-primary)",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Browse Stocks
                    </button>{" "}
                    to place your first trade!
                  </td>
                </tr>
              ) : (
                augmentedHoldings.map((item) => {
                  const isProfit = item.profitLoss >= 0;
                  return (
                    <tr key={item._id || item.Stock_Symbol}>
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
                              fontSize: "0.75rem",
                            }}
                          >
                            {item.Stock_Symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#fff" }}>{item.Stock_Symbol}</div>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                              {item.Stock_name || item.Stock_Symbol}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                        {item.Count} Shares
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>
                        ${Number(item.Price).toFixed(2)}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                        ${Number(item.currentPrice).toFixed(2)}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                        ${Number(item.currentMarketValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={isProfit ? "badge-bullish" : "badge-bearish"}>
                          {isProfit ? "▲ +" : "▼ "}
                          ${Math.abs(item.profitLoss).toFixed(2)} ({item.profitLossPercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            onClick={() => navigate(`/stock/${item.Stock_Symbol}`)}
                            className="btn-secondary"
                            style={{ padding: "6px 10px", fontSize: "0.78rem" }}
                          >
                            Buy More
                          </button>
                          <button
                            onClick={() => {
                              setSellModalStock(item);
                              setSellShares(item.Count);
                            }}
                            className="btn-danger"
                            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
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

      {/* Deposit / Withdraw Modal */}
      {cashModalOpen && (
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
          onClick={() => setCashModalOpen(false)}
        >
          <div
            className="glass-panel"
            style={{ maxWidth: "420px", width: "100%", padding: "28px", background: "var(--bg-card-solid)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.25rem" }}>
                {cashModalType === "DEPOSIT" ? "Add Simulated Funds" : "Withdraw Funds"}
              </h3>
              <button
                onClick={() => setCashModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCashAction} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Amount ($ USD)
                </label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                  className="input-field"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem" }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-dim)" }}>
                <span>Available Cash: ${Number(walletBalance).toFixed(2)}</span>
                <span>Transfer Type: Simulated Wire</span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setCashModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={cashModalType === "DEPOSIT" ? "btn-success" : "btn-primary"}
                  style={{ flex: 1 }}
                >
                  Confirm {cashModalType === "DEPOSIT" ? "Deposit" : "Withdrawal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Sell Modal */}
      {sellModalStock && (
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
          onClick={() => setSellModalStock(null)}
        >
          <div
            className="glass-panel"
            style={{ maxWidth: "440px", width: "100%", padding: "28px", background: "var(--bg-card-solid)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.2rem" }}>Liquidate {sellModalStock.Stock_Symbol}</h3>
              <button
                onClick={() => setSellModalStock(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickSell} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <span>Current Market Price:</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#fff" }}>
                  ${sellModalStock.currentPrice.toFixed(2)}
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Number of Shares to Sell (Max: {sellModalStock.Count})
                </label>
                <input
                  type="number"
                  min="1"
                  max={sellModalStock.Count}
                  value={sellShares}
                  onChange={(e) => setSellShares(Math.min(sellModalStock.Count, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                  className="input-field"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem" }}
                  required
                />
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "1rem",
                  fontWeight: 700,
                }}
              >
                <span>Estimated Sale Proceeds:</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--neon-green)" }}>
                  ${(sellModalStock.currentPrice * sellShares).toFixed(2)}
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setSellModalStock(null)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSell}
                  className="btn-danger"
                  style={{ flex: 1.5 }}
                >
                  {submittingSell ? "Selling..." : "Confirm Liquidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
