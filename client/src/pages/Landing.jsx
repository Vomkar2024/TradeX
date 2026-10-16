import { useState } from "react";
import { Link } from "react-router-dom";
import { useGeneralContext } from "../context/GeneralContext";

export default function Landing() {
  const { user, stocks } = useGeneralContext();
  const [calcAmount, setCalcAmount] = useState(10000);
  const [calcReturnRate, setCalcReturnRate] = useState(18);

  const potentialGain = Math.round(calcAmount * (calcReturnRate / 100));
  const totalPortfolioValue = calcAmount + potentialGain;

  const defaultStocks = stocks.length > 0 ? stocks : [
    { Stock_Symbol: "AAPL", Stock_name: "Apple Inc.", Price: 182.5, changePercent: 0.97 },
    { Stock_Symbol: "NVDA", Stock_name: "NVIDIA Corp.", Price: 125.6, changePercent: 3.97 },
    { Stock_Symbol: "MSFT", Stock_name: "Microsoft Corp.", Price: 420.72, changePercent: 0.83 },
    { Stock_Symbol: "TSLA", Stock_name: "Tesla, Inc.", Price: 218.85, changePercent: -1.93 },
    { Stock_Symbol: "AMZN", Stock_name: "Amazon.com Inc.", Price: 186.4, changePercent: 1.14 },
    { Stock_Symbol: "GOOGL", Stock_name: "Alphabet Inc.", Price: 175.98, changePercent: -0.48 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
      {/* Top Animated Ticker Tape */}
      <div
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          background: "rgba(13, 17, 26, 0.6)",
          padding: "10px 0",
          overflow: "hidden",
        }}
      >
        <div className="ticker-tape-container">
          <div className="ticker-tape-track">
            {[...defaultStocks, ...defaultStocks].map((s, idx) => {
              const isPositive = s.changePercent >= 0;
              return (
                <div
                  key={`${s.Stock_Symbol}-${idx}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "0 24px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{s.Stock_Symbol}</span>
                  <span style={{ color: "var(--text-muted)" }}>${Number(s.Price).toFixed(2)}</span>
                  <span
                    style={{
                      color: isPositive ? "var(--neon-green)" : "var(--neon-red)",
                      fontWeight: 600,
                    }}
                  >
                    {isPositive ? "▲" : "▼"} {Math.abs(s.changePercent)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section
        style={{
          textAlign: "center",
          maxWidth: "920px",
          margin: "0 auto",
          padding: "40px 20px 20px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            background: "rgba(99, 102, 241, 0.12)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: "var(--radius-full)",
            color: "#a5b4fc",
            fontSize: "0.85rem",
            fontWeight: 600,
            marginBottom: "24px",
          }}
        >
          <span className="live-dot" />
          <span>Real-Time US Equity Simulation Engine</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            lineHeight: 1.15,
            fontWeight: 800,
            marginBottom: "20px",
            letterSpacing: "-0.03em",
          }}
        >
          Master the Markets with{" "}
          <span
            style={{
              background: "var(--accent-gradient)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Zero Financial Risk
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            maxWidth: "760px",
            margin: "0 auto 36px",
          }}
        >
          TradeX gives you a professional simulated trading desk equipped with live charts,
          instant market orders, portfolio analytics, and $25,000 in virtual cash.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          {user ? (
            <Link to="/home" className="btn-primary" style={{ fontSize: "1.05rem", padding: "14px 32px" }}>
              Launch Your Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary" style={{ fontSize: "1.05rem", padding: "14px 32px" }}>
                Claim $25,000 Demo Account →
              </Link>
              <Link to="/stock/AAPL" className="btn-secondary" style={{ fontSize: "1.05rem", padding: "14px 28px" }}>
                View Live Charts
              </Link>
            </>
          )}
        </div>

        {/* Highlight Metrics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginTop: "60px",
          }}
        >
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--neon-green)", fontFamily: "var(--font-mono)" }}>
              $25,000
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
              Virtual Starting Cash
            </div>
          </div>
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#a5b4fc", fontFamily: "var(--font-mono)" }}>
              &lt; 50ms
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
              Simulated Execution Speed
            </div>
          </div>
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#38bdf8", fontFamily: "var(--font-mono)" }}>
              100%
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
              Risk-Free Learning
            </div>
          </div>
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#f472b6", fontFamily: "var(--font-mono)" }}>
              Live
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
              Interactive Candlestick Charts
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Simulation Calculator */}
      <section
        className="glass-panel"
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "40px",
          background: "linear-gradient(180deg, rgba(17, 23, 38, 0.9) 0%, rgba(10, 14, 23, 0.9) 100%)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "1.75rem", marginBottom: "8px" }}>Simulate Your Trading Growth</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
            See how your strategy compounds over time using TradeX virtual capital
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "36px", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Initial Simulated Investment:</span>
                <span style={{ color: "var(--text-main)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                  ${calcAmount.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent-primary)" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Target Strategy Return (%):</span>
                <span style={{ color: "var(--neon-green)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                  +{calcReturnRate}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={calcReturnRate}
                onChange={(e) => setCalcReturnRate(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--neon-green)" }}
              />
            </div>
          </div>

          <div
            style={{
              background: "rgba(0, 0, 0, 0.35)",
              border: "1px solid var(--border-card)",
              borderRadius: "var(--radius-lg)",
              padding: "28px",
              textAlign: "center",
            }}
          >
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Projected Total Portfolio
            </div>
            <div
              style={{
                fontSize: "2.4rem",
                fontWeight: 800,
                color: "#fff",
                fontFamily: "var(--font-mono)",
                margin: "12px 0 6px",
              }}
            >
              ${totalPortfolioValue.toLocaleString()}
            </div>
            <div
              style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "var(--radius-full)",
                background: "var(--neon-green-bg)",
                color: "var(--neon-green)",
                fontWeight: 700,
                fontSize: "0.88rem",
              }}
            >
              +${potentialGain.toLocaleString()} Profit Generated
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "10px" }}>Professional Grade Features</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Everything you need to test trading theories, analyze trends, and build confidence
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          <div className="glass-panel" style={{ padding: "30px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "16px" }}>📈</div>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Interactive Multi-Period Charts</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Switch seamlessly between line and candlestick modes across 1D, 1W, 1M, and 1Y time horizons with dynamic price cursor tooltips.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "30px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "16px" }}>⚡</div>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Instant Order Execution</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Execute market BUY and SELL slips with instantaneous order confirmation, portfolio balance deduction, and transaction receipts.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "30px" }}>
            <div style={{ fontSize: "2rem", marginBottom: "16px" }}>💼</div>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "10px" }}>Virtual Portfolio Manager</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Track real-time asset allocations, average purchase prices, unrealized profit/loss, and portfolio equity over time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
