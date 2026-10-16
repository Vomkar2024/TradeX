import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../components/axiosInstance";

export default function AllTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/transactions/all");
      if (res.data?.success && Array.isArray(res.data.transactions)) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.warn("Could not fetch transactions:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = transactions.filter((t) => {
    const type = t.Transaction_type || t.type;
    if (filterType !== "ALL" && type?.toUpperCase() !== filterType.toUpperCase()) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const userRef = (typeof t.user === "object" ? t.user?.Username || t.user?.email : t.user) || "";
      const mode = t.Payment_mode || t.paymentMode || "";
      const matchUser = userRef.toLowerCase().includes(q);
      const matchMode = mode.toLowerCase().includes(q);
      const matchId = t._id?.toLowerCase().includes(q);
      if (!matchUser && !matchMode && !matchId) return false;
    }
    return true;
  });

  const totalVolume = transactions.reduce((sum, t) => sum + (t.Amount || t.amount || 0), 0);

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
            <h1 style={{ fontSize: "1.75rem", margin: 0 }}>System Financial Ledger</h1>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "2px 8px",
                background: "rgba(56, 189, 248, 0.2)",
                color: "#38bdf8",
                borderRadius: "var(--radius-full)",
                fontWeight: 700,
              }}
            >
              CASH FLOW AUDIT
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
            Ledger of all deposits, withdrawals, and stock order settlement transactions
          </p>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
              Gross Volume
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
              ${Number(totalVolume).toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
          {["ALL", "DEPOSIT", "WITHDRAWAL", "BUY", "SELL"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                background: filterType === type ? "var(--accent-primary)" : "transparent",
                color: filterType === type ? "#fff" : "var(--text-muted)",
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

        <input
          type="text"
          placeholder="Search by User, Mode, or Tx ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
          style={{ width: "280px", padding: "8px 12px", fontSize: "0.85rem" }}
        />
      </div>

      {/* Transactions Table */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="trade-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>User / Account</th>
                <th>Type</th>
                <th>Payment Mode</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    Loading financial transactions...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const txType = (tx.Transaction_type || tx.type || "UNKNOWN").toUpperCase();
                  const isCredit = txType === "DEPOSIT" || txType === "SELL";
                  const amount = tx.Amount || tx.amount || 0;
                  const time = tx.Time || tx.time || tx.createdAt;
                  const userDisplay =
                    typeof tx.user === "object"
                      ? tx.user?.Username || tx.user?.email || "User"
                      : String(tx.user || tx.userId || "System").slice(-8);

                  return (
                    <tr key={tx._id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-dim)" }}>
                        #{tx._id.slice(-6)}
                      </td>
                      <td style={{ fontWeight: 600, color: "#a5b4fc" }}>
                        {userDisplay}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            background: isCredit ? "var(--neon-green-bg)" : "rgba(255, 255, 255, 0.08)",
                            color: isCredit ? "var(--neon-green)" : "var(--text-secondary)",
                          }}
                        >
                          {txType}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.85rem" }}>
                        {tx.Payment_mode || tx.paymentMode || "Simulated Wire"}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: isCredit ? "var(--neon-green)" : "#fff" }}>
                        {isCredit ? "+" : "-"}${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span style={{ fontSize: "0.75rem", color: "var(--neon-green)", fontWeight: 700 }}>
                          ● {tx.status || "SUCCESS"}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-dim)", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}>
                        {time ? new Date(time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
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
