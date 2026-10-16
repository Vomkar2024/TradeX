import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGeneralContext } from "../context/GeneralContext";
import axiosInstance from "../components/axiosInstance";

export default function StockChart() {
  const { symbol = "AAPL" } = useParams();
  const navigate = useNavigate();
  const { user, walletBalance, stocks, refreshBalance, showNotification } = useGeneralContext();

  const [timeframe, setTimeframe] = useState("1M");
  const [chartType, setChartType] = useState("line"); // 'line' or 'candlestick'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Trade Slip states
  const [tradeAction, setTradeAction] = useState("BUY");
  const [tradeShares, setTradeShares] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find active stock or default
  const activeStock = useMemo(() => {
    const found = stocks.find((s) => s.Stock_Symbol?.toUpperCase() === symbol?.toUpperCase());
    if (found) return found;
    return {
      Stock_Symbol: symbol?.toUpperCase() || "AAPL",
      Stock_name: symbol?.toUpperCase() === "NVDA" ? "NVIDIA Corp." : symbol?.toUpperCase() === "TSLA" ? "Tesla Inc." : "Apple Inc.",
      Price: 182.5,
      Stock_Exchange: "NASDAQ",
      change: 2.45,
      changePercent: 1.36,
      volume: 48920000,
      marketCap: 2820000000000,
    };
  }, [stocks, symbol]);

  // Generate realistic OHLC / series data based on stock price and timeframe
  const chartData = useMemo(() => {
    const basePrice = activeStock.Price || 150;
    let points = 24;
    let volatility = 0.015;

    if (timeframe === "1D") {
      points = 24;
      volatility = 0.008;
    } else if (timeframe === "1W") {
      points = 35;
      volatility = 0.012;
    } else if (timeframe === "1M") {
      points = 30;
      volatility = 0.02;
    } else if (timeframe === "1Y") {
      points = 52;
      volatility = 0.035;
    } else {
      points = 60;
      volatility = 0.05;
    }

    // Seed deterministic random based on ticker symbol
    const seed = activeStock.Stock_Symbol.charCodeAt(0) + activeStock.Stock_Symbol.charCodeAt(activeStock.Stock_Symbol.length - 1);
    let current = basePrice * 0.92;
    const items = [];

    for (let i = 0; i < points; i++) {
      const pseudoRand = Math.sin(seed * (i + 1) * 99) * 0.5 + 0.5;
      const trend = (i / points) * (basePrice * 0.12);
      const delta = (pseudoRand - 0.48) * (basePrice * volatility);
      const close = Math.max(10, current + delta + trend * 0.1);
      const open = i === 0 ? basePrice * 0.91 : items[i - 1].close;
      const high = Math.max(open, close) + pseudoRand * 3;
      const low = Math.min(open, close) - (1 - pseudoRand) * 3;
      current = close;

      items.push({
        index: i,
        time: `${i + 1}`,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
      });
    }

    // Ensure the last item matches current active price
    if (items.length > 0) {
      items[items.length - 1].close = activeStock.Price;
      if (items[items.length - 1].high < activeStock.Price) {
        items[items.length - 1].high = activeStock.Price + 0.5;
      }
    }
    return items;
  }, [activeStock, timeframe]);

  // Chart dimensions and scales
  const svgWidth = 800;
  const svgHeight = 360;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  const prices = chartData.flatMap((d) => [d.low, d.high]);
  const minPrice = Math.min(...prices) * 0.995;
  const maxPrice = Math.max(...prices) * 1.005;
  const priceRange = maxPrice - minPrice || 1;

  const getY = (val) => {
    return svgHeight - padding.bottom - ((val - minPrice) / priceRange) * (svgHeight - padding.top - padding.bottom);
  };

  const getX = (idx) => {
    const usableWidth = svgWidth - padding.left - padding.right;
    return padding.left + (idx / (chartData.length - 1)) * usableWidth;
  };

  // Build SVG path for line chart
  const linePath = useMemo(() => {
    if (chartData.length === 0) return "";
    const usableWidth = svgWidth - padding.left - padding.right;
    const calcY = (val) => svgHeight - padding.bottom - ((val - minPrice) / priceRange) * (svgHeight - padding.top - padding.bottom);
    const calcX = (idx) => padding.left + (idx / (chartData.length - 1)) * usableWidth;

    return chartData.reduce((acc, d, i) => {
      const x = calcX(i);
      const y = calcY(d.close);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, "");
  }, [chartData, minPrice, priceRange]);

  // Area path for gradient under line
  const areaPath = useMemo(() => {
    if (!linePath || chartData.length === 0) return "";
    const usableWidth = svgWidth - padding.left - padding.right;
    const firstX = padding.left;
    const lastX = padding.left + usableWidth;
    const bottomY = svgHeight - padding.bottom;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, chartData.length]);


  const activePoint = hoveredIndex !== null ? chartData[hoveredIndex] : chartData[chartData.length - 1];
  const isPositive = (activeStock.changePercent ?? 0) >= 0;

  // Execute trade from slip
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showNotification("Please sign in to place live simulated orders.", "error");
      navigate("/login");
      return;
    }

    if (tradeShares <= 0) return;
    setIsSubmitting(true);

    try {
      const res = await axiosInstance.post("/api/orders", {
        Stock_Symbol: activeStock.Stock_Symbol,
        Stock_name: activeStock.Stock_name,
        Price: activeStock.Price,
        Count: parseInt(tradeShares, 10),
        Order_Type: tradeAction,
        Stock_Type: "Equity",
        Stock_Exchange: activeStock.Stock_Exchange || "NASDAQ",
      });

      if (res.data?.success) {
        showNotification(
          `Filled ${tradeAction} order for ${tradeShares} shares of ${activeStock.Stock_Symbol} at $${activeStock.Price.toFixed(2)}`,
          "success"
        );
        await refreshBalance();
      } else {
        showNotification(res.data?.message || "Order placement failed.", "error");
      }
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Order rejected. Please check available cash or holdings.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCost = (activeStock.Price * tradeShares).toFixed(2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Top Header & Ticker Selector */}
      <div
        className="glass-panel"
        style={{
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <select
            value={activeStock.Stock_Symbol}
            onChange={(e) => navigate(`/stock/${e.target.value}`)}
            className="input-field"
            style={{
              width: "auto",
              padding: "8px 14px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: "1.1rem",
              background: "rgba(255, 255, 255, 0.05)",
            }}
          >
            {stocks.map((s) => (
              <option key={s.Stock_Symbol} value={s.Stock_Symbol} style={{ background: "#111827" }}>
                {s.Stock_Symbol} — {s.Stock_name}
              </option>
            ))}
          </select>

          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
              <span style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#fff" }}>
                ${activePoint ? activePoint.close.toFixed(2) : activeStock.Price.toFixed(2)}
              </span>
              <span className={isPositive ? "badge-bullish" : "badge-bearish"} style={{ fontSize: "0.88rem" }}>
                {isPositive ? "▲ +" : "▼ "}
                {activeStock.change ? `$${Math.abs(activeStock.change).toFixed(2)} ` : ""}
                ({activeStock.changePercent}%)
              </span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {activeStock.Stock_name} • {activeStock.Stock_Exchange || "NASDAQ"} • Real-Time Interactive Feed
            </div>
          </div>
        </div>

        {/* Chart Controls (Timeframe & Mode) */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", borderRadius: "var(--radius-md)", padding: "4px" }}>
            {["1D", "1W", "1M", "1Y", "ALL"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  background: timeframe === tf ? "var(--accent-primary)" : "transparent",
                  color: timeframe === tf ? "#fff" : "var(--text-muted)",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {tf}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", borderRadius: "var(--radius-md)", padding: "4px" }}>
            <button
              onClick={() => setChartType("line")}
              style={{
                background: chartType === "line" ? "rgba(255,255,255,0.12)" : "transparent",
                color: chartType === "line" ? "#fff" : "var(--text-muted)",
                border: "none",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Line
            </button>
            <button
              onClick={() => setChartType("candlestick")}
              style={{
                background: chartType === "candlestick" ? "rgba(255,255,255,0.12)" : "transparent",
                color: chartType === "candlestick" ? "#fff" : "var(--text-muted)",
                border: "none",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Candles
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Chart + Trade Execution Slip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }} className="chart-layout-grid">
        {/* SVG Interactive Chart Canvas */}
        <div className="glass-panel" style={{ padding: "24px 20px 16px", position: "relative" }}>
          {/* Active Hover Price Badge */}
          {hoveredIndex !== null && activePoint && (
            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "24px",
                background: "rgba(17, 24, 39, 0.9)",
                border: "1px solid var(--border-card)",
                padding: "6px 14px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                gap: "12px",
                fontSize: "0.78rem",
                fontFamily: "var(--font-mono)",
                zIndex: 10,
              }}
            >
              <span>O: <strong style={{ color: "#fff" }}>${activePoint.open}</strong></span>
              <span>H: <strong style={{ color: "var(--neon-green)" }}>${activePoint.high}</strong></span>
              <span>L: <strong style={{ color: "var(--neon-red)" }}>${activePoint.low}</strong></span>
              <span>C: <strong style={{ color: "#fff" }}>${activePoint.close}</strong></span>
            </div>
          )}

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: "100%", height: "auto", overflow: "visible" }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const yVal = minPrice + pct * priceRange;
              const yPos = getY(yVal);
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={svgWidth - padding.right}
                    y2={yPos}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 10}
                    y={yPos + 4}
                    fill="var(--text-dim)"
                    fontSize="11"
                    fontFamily="var(--font-mono)"
                    textAnchor="end"
                  >
                    ${yVal.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Line Chart Mode */}
            {chartType === "line" && (
              <>
                <path d={areaPath} fill="url(#chartGradient)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke={isPositive ? "var(--accent-primary)" : "var(--neon-red)"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Candlestick Chart Mode */}
            {chartType === "candlestick" &&
              chartData.map((d, i) => {
                const x = getX(i);
                const isBull = d.close >= d.open;
                const candleColor = isBull ? "var(--neon-green)" : "var(--neon-red)";
                const bodyTop = getY(Math.max(d.open, d.close));
                const bodyBottom = getY(Math.min(d.open, d.close));
                const bodyHeight = Math.max(2, bodyBottom - bodyTop);

                return (
                  <g key={i}>
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={getY(d.high)}
                      x2={x}
                      y2={getY(d.low)}
                      stroke={candleColor}
                      strokeWidth="1.2"
                    />
                    {/* Body */}
                    <rect
                      x={x - 4}
                      y={bodyTop}
                      width="8"
                      height={bodyHeight}
                      fill={candleColor}
                      rx="1"
                    />
                  </g>
                );
              })}

            {/* Hover Crosshair & Overlay Sensors */}
            {hoveredIndex !== null && (
              <>
                <line
                  x1={getX(hoveredIndex)}
                  y1={padding.top}
                  x2={getX(hoveredIndex)}
                  y2={svgHeight - padding.bottom}
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(chartData[hoveredIndex].close)}
                  r="5"
                  fill="var(--accent-primary)"
                  stroke="#fff"
                  strokeWidth="2"
                />
              </>
            )}

            {/* Transparent hover detection bars */}
            {chartData.map((_, i) => {
              const x = getX(i);
              const barWidth = svgWidth / chartData.length;
              return (
                <rect
                  key={i}
                  x={x - barWidth / 2}
                  y={padding.top}
                  width={barWidth}
                  height={svgHeight - padding.top - padding.bottom}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  style={{ cursor: "crosshair" }}
                />
              );
            })}
          </svg>

          {/* Time axis labels */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 40px 0 60px",
              color: "var(--text-dim)",
              fontSize: "0.78rem",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span>Past Period ({timeframe})</span>
            <span>Market Midpoint</span>
            <span>Latest Close</span>
          </div>
        </div>

        {/* Buy / Sell Quick Execution Slip */}
        <div className="glass-panel" style={{ padding: "24px", background: "var(--bg-card-solid)" }}>
          <h3 style={{ fontSize: "1.15rem", marginBottom: "16px" }}>Order Execution Slip</h3>

          {/* Action Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <button
              type="button"
              onClick={() => setTradeAction("BUY")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "var(--radius-md)",
                border: "none",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                background: tradeAction === "BUY" ? "var(--neon-green)" : "rgba(255, 255, 255, 0.05)",
                color: tradeAction === "BUY" ? "#000" : "var(--text-muted)",
              }}
            >
              BUY
            </button>
            <button
              type="button"
              onClick={() => setTradeAction("SELL")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "var(--radius-md)",
                border: "none",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                background: tradeAction === "SELL" ? "var(--neon-red)" : "rgba(255, 255, 255, 0.05)",
                color: tradeAction === "SELL" ? "#fff" : "var(--text-muted)",
              }}
            >
              SELL
            </button>
          </div>

          <form onSubmit={handleOrderSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                Order Type
              </label>
              <select className="input-field" disabled style={{ background: "rgba(0,0,0,0.3)" }}>
                <option>Market Order (Instant Fill)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                Quantity (Shares)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={tradeShares}
                onChange={(e) => setTradeShares(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="input-field"
                style={{ fontFamily: "var(--font-mono)", fontSize: "1.05rem" }}
                required
              />
            </div>

            {/* Quick Share Buttons */}
            <div style={{ display: "flex", gap: "6px" }}>
              {[5, 10, 25, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTradeShares(num)}
                  style={{
                    flex: 1,
                    padding: "6px",
                    background: tradeShares === num ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${tradeShares === num ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                    color: tradeShares === num ? "#fff" : "var(--text-dim)",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  {num}
                </button>
              ))}
            </div>

            {/* Calculated Order Cost Summary */}
            <div
              style={{
                background: "rgba(0, 0, 0, 0.35)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                <span>Unit Price</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "#fff" }}>
                  ${Number(activeStock.Price).toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                <span>Trading Fee</span>
                <span style={{ color: "var(--neon-green)" }}>$0.00 (Zero Fee)</span>
              </div>
              <div
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                <span>Total Value</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-primary)" }}>
                  ${Number(totalCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", textAlign: "center" }}>
              Available Cash: ${Number(walletBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={tradeAction === "BUY" ? "btn-success" : "btn-danger"}
              style={{ padding: "12px", width: "100%", marginTop: "4px" }}
            >
              {isSubmitting ? "Routing Order..." : `Execute ${tradeAction} Order`}
            </button>
          </form>
        </div>
      </div>

      {/* Fundamental Market Statistics */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "1.15rem", marginBottom: "16px" }}>Key Market Metrics & Fundamentals</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Day Range</div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, marginTop: "4px" }}>
              ${(activeStock.Price * 0.98).toFixed(2)} - ${(activeStock.Price * 1.02).toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", textTransform: "uppercase" }}>52-Week Range</div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, marginTop: "4px" }}>
              ${(activeStock.Price * 0.75).toFixed(2)} - ${(activeStock.Price * 1.25).toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Trading Volume</div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, marginTop: "4px" }}>
              {activeStock.volume ? activeStock.volume.toLocaleString() : "42,100,500"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Market Capitalization</div>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, marginTop: "4px" }}>
              ${activeStock.marketCap ? `${(activeStock.marketCap / 1e12).toFixed(2)}T` : "$2.85T"}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .chart-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
