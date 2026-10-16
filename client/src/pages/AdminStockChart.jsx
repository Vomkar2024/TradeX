import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGeneralContext } from "../context/GeneralContext";
import axiosInstance from "../components/axiosInstance";

export default function AdminStockChart() {
  const { stocks, fetchStocks, showNotification } = useGeneralContext();
  const [selectedStocks, setSelectedStocks] = useState(["AAPL", "NVDA", "TSLA"]);
  const [timeframe, setTimeframe] = useState("1M");
  const [simulating, setSimulating] = useState(false);

  const colors = {
    AAPL: "#6366f1",
    MSFT: "#3b82f6",
    NVDA: "#10b981",
    TSLA: "#f43f5e",
    AMZN: "#f59e0b",
    GOOGL: "#8b5cf6",
  };

  const toggleStockSelection = (sym) => {
    if (selectedStocks.includes(sym)) {
      if (selectedStocks.length > 1) {
        setSelectedStocks(selectedStocks.filter((s) => s !== sym));
      }
    } else {
      setSelectedStocks([...selectedStocks, sym]);
    }
  };

  // Generate normalized comparative timeline data
  const comparisonData = useMemo(() => {
    const points = 30;
    const series = {};

    selectedStocks.forEach((sym) => {
      const stock = stocks.find((s) => s.Stock_Symbol === sym) || { Price: 100 };
      const seed = sym.charCodeAt(0);
      const data = [];
      let currentVal = 100; // Base normalized index at 100

      for (let i = 0; i < points; i++) {
        const rand = Math.sin(seed * (i + 1) * 37) * 0.5 + 0.5;
        const drift = (rand - 0.47) * 3;
        currentVal = Math.max(50, currentVal + drift);
        data.push({ index: i, value: parseFloat(currentVal.toFixed(2)) });
      }
      series[sym] = data;
    });

    return series;
  }, [selectedStocks, stocks]);

  // Simulate market fluctuation on the backend
  const handleTriggerMarketShift = async () => {
    setSimulating(true);
    try {
      // Pick a random stock and shift its price slightly
      const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
      if (randomStock) {
        const delta = (Math.random() * 6 - 3).toFixed(2);
        const newPrice = Math.max(10, parseFloat((randomStock.Price + parseFloat(delta)).toFixed(2)));
        const newPercent = parseFloat(((delta / randomStock.Price) * 100).toFixed(2));

        await axiosInstance.post("/api/stocks", {
          Stock_Symbol: randomStock.Stock_Symbol,
          Stock_name: randomStock.Stock_name,
          Price: newPrice,
          Stock_Exchange: randomStock.Stock_Exchange || "NASDAQ",
          change: parseFloat(delta),
          changePercent: newPercent,
        });

        await fetchStocks();
        showNotification(
          `Simulated price event: ${randomStock.Stock_Symbol} adjusted to $${newPrice} (${delta > 0 ? "+" : ""}${delta})`,
          "info"
        );
      }
    } catch (err) {
      showNotification("Could not simulate market shift: " + err.message, "error");
    } finally {
      setSimulating(false);
    }
  };

  const svgWidth = 840;
  const svgHeight = 360;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };

  const allVals = Object.values(comparisonData).flatMap((pts) => pts.map((p) => p.value));
  const minVal = allVals.length > 0 ? Math.min(...allVals) * 0.95 : 80;
  const maxVal = allVals.length > 0 ? Math.max(...allVals) * 1.05 : 120;
  const range = maxVal - minVal || 1;

  const getY = (val) => {
    return svgHeight - padding.bottom - ((val - minVal) / range) * (svgHeight - padding.top - padding.bottom);
  };

  const getX = (idx, total) => {
    const usableWidth = svgWidth - padding.left - padding.right;
    return padding.left + (idx / (total - 1)) * usableWidth;
  };

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
            <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Market Analytics & Relative Performance</h1>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "2px 8px",
                background: "rgba(99, 102, 241, 0.2)",
                color: "#a5b4fc",
                borderRadius: "var(--radius-full)",
                fontWeight: 700,
              }}
            >
              ADMIN TELEMETRY
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Cross-asset comparative charts, normalized performance trends, and market volatility triggers
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleTriggerMarketShift}
            disabled={simulating}
            className="btn-primary"
            style={{ fontSize: "0.85rem", padding: "8px 16px" }}
          >
            {simulating ? "Simulating..." : "⚡ Trigger Price Fluctuation"}
          </button>
          <Link to="/admin" className="btn-secondary" style={{ fontSize: "0.85rem", padding: "8px 16px" }}>
            Back to Admin Hub
          </Link>
        </div>
      </div>

      {/* Stock Selection Pills */}
      <div
        className="glass-panel"
        style={{
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--text-dim)", fontWeight: 700, marginRight: "4px" }}>
            OVERLAY ASSETS:
          </span>
          {stocks.map((s) => {
            const isSelected = selectedStocks.includes(s.Stock_Symbol);
            const color = colors[s.Stock_Symbol] || "var(--accent-primary)";
            return (
              <button
                key={s.Stock_Symbol}
                onClick={() => toggleStockSelection(s.Stock_Symbol)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-full)",
                  background: isSelected ? `${color}25` : "rgba(255, 255, 255, 0.04)",
                  border: `1px solid ${isSelected ? color : "var(--border-subtle)"}`,
                  color: isSelected ? "#fff" : "var(--text-muted)",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                <span>{s.Stock_Symbol}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", borderRadius: "var(--radius-md)", padding: "3px" }}>
          {["1W", "1M", "1Y"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                background: timeframe === tf ? "var(--accent-primary)" : "transparent",
                color: timeframe === tf ? "#fff" : "var(--text-muted)",
                border: "none",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Multi-Asset Performance Chart */}
      <div className="glass-panel" style={{ padding: "28px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "1.15rem" }}>Relative Growth Index (Base = 100)</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
              Normalized baseline comparison shows percentage outperformance over time
            </p>
          </div>
          <div style={{ display: "flex", gap: "16px", fontSize: "0.82rem", fontFamily: "var(--font-mono)" }}>
            {selectedStocks.map((sym) => (
              <span key={sym} style={{ color: colors[sym] || "var(--accent-primary)", fontWeight: 700 }}>
                ● {sym}
              </span>
            ))}
          </div>
        </div>

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: "100%", height: "auto" }}>
          {/* Baseline 100 line */}
          <line
            x1={padding.left}
            y1={getY(100)}
            x2={svgWidth - padding.right}
            y2={getY(100)}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeDasharray="4 4"
          />
          <text
            x={padding.left - 8}
            y={getY(100) + 4}
            fill="var(--text-dim)"
            fontSize="10"
            fontFamily="var(--font-mono)"
            textAnchor="end"
          >
            100.0 (Base)
          </text>

          {/* Lines for each selected stock */}
          {Object.entries(comparisonData).map(([sym, pts]) => {
            const color = colors[sym] || "#6366f1";
            const pathD = pts.reduce((acc, p, i) => {
              const x = getX(i, pts.length);
              const y = getY(p.value);
              return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
            }, "");

            return (
              <path
                key={sym}
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 40px 0 60px", color: "var(--text-dim)", fontSize: "0.78rem" }}>
          <span>Period Start</span>
          <span>Mid-Horizon</span>
          <span>Latest Session</span>
        </div>
      </div>
    </div>
  );
}
