import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useGeneralContext } from "../context/GeneralContext";

export default function Navbar() {
  const { user, walletBalance, logout } = useGeneralContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(5000);
  const { depositFunds } = useGeneralContext();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (depositAmount <= 0) return;
    await depositFunds(depositAmount, "Instant Bank Wire");
    setDepositModalOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(7, 9, 14, 0.82)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Brand Logo */}
          <Link
            to={user ? "/home" : "/"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: 800,
              fontSize: "1.35rem",
              letterSpacing: "-0.03em",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 900,
                fontSize: "1.1rem",
                boxShadow: "0 0 15px rgba(99, 102, 241, 0.5)",
              }}
            >
              TX
            </div>
            <span style={{ color: "#fff" }}>
              Trade<span style={{ color: "var(--accent-primary)" }}>X</span>
            </span>
            <span
              style={{
                fontSize: "0.68rem",
                textTransform: "uppercase",
                padding: "2px 6px",
                background: "rgba(99, 102, 241, 0.15)",
                color: "#818cf8",
                borderRadius: "4px",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                fontWeight: 700,
              }}
            >
              PRO
            </span>
          </Link>

          {/* Navigation Links */}
          <nav
            style={{
              display: "none",
              alignItems: "center",
              gap: "24px",
            }}
            className="desktop-nav"
          >
            {user ? (
              <>
                <Link
                  to="/home"
                  style={{
                    color: isActive("/home") ? "var(--text-main)" : "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    transition: "color 0.2s",
                  }}
                >
                  Dashboard
                </Link>
                <Link
                  to="/portfolio"
                  style={{
                    color: isActive("/portfolio") ? "var(--text-main)" : "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    transition: "color 0.2s",
                  }}
                >
                  Portfolio
                </Link>
                <Link
                  to="/stock/AAPL"
                  style={{
                    color: location.pathname.startsWith("/stock") ? "var(--text-main)" : "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    transition: "color 0.2s",
                  }}
                >
                  Charts
                </Link>
                <Link
                  to="/history"
                  style={{
                    color: isActive("/history") ? "var(--text-main)" : "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    transition: "color 0.2s",
                  }}
                >
                  Orders
                </Link>

                {/* Admin specific links */}
                {user.UserType === "Admin" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      background: "rgba(99, 102, 241, 0.1)",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                      borderRadius: "8px",
                      padding: "4px 12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "#a5b4fc",
                        fontWeight: 800,
                        letterSpacing: "0.05em",
                      }}
                    >
                      ADMIN:
                    </span>
                    <Link
                      to="/admin"
                      style={{
                        color: isActive("/admin") ? "#fff" : "#cbd5e1",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      Hub
                    </Link>
                    <Link
                      to="/admin/charts"
                      style={{
                        color: isActive("/admin/charts") ? "#fff" : "#cbd5e1",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      Analytics
                    </Link>
                    <Link
                      to="/admin/orders"
                      style={{
                        color: isActive("/admin/orders") ? "#fff" : "#cbd5e1",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      All Orders
                    </Link>
                    <Link
                      to="/admin/transactions"
                      style={{
                        color: isActive("/admin/transactions") ? "#fff" : "#cbd5e1",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      Ledger
                    </Link>
                    <Link
                      to="/admin/users"
                      style={{
                        color: isActive("/admin/users") ? "#fff" : "#cbd5e1",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      Users
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/"
                  style={{
                    color: isActive("/") ? "var(--text-main)" : "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                  }}
                >
                  Features
                </Link>
                <Link
                  to="/stock/AAPL"
                  style={{
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                  }}
                >
                  Live Demo Chart
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {user ? (
              <>
                {/* Live Cash Balance Pill */}
                <div
                  onClick={() => setDepositModalOpen(true)}
                  title="Click to add simulated cash"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "6px 14px",
                    borderRadius: "var(--radius-full)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span className="live-dot" />
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                    <span style={{ fontSize: "0.68rem", color: "var(--neon-green)", fontWeight: 700 }}>
                      CASH BALANCE
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color: "#fff",
                      }}
                    >
                      ${Number(walletBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <span
                    style={{
                      background: "rgba(16, 185, 129, 0.2)",
                      color: "var(--neon-green)",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      marginLeft: "4px",
                    }}
                  >
                    +
                  </span>
                </div>

                {/* Profile Pill */}
                <Link
                  to="/profile"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "var(--text-main)",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "var(--brand-gradient)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: "#fff",
                    }}
                  >
                    {user.Username ? user.Username.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span>{user.Username || "Trader"}</span>
                </Link>

                {/* Sign Out Button */}
                <button
                  onClick={handleLogout}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(244, 63, 94, 0.3)",
                    color: "#fb7185",
                    padding: "7px 12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    padding: "8px 16px",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                  style={{ fontSize: "0.88rem", padding: "8px 18px" }}
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: "none",
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: "1.5rem",
                cursor: "pointer",
              }}
              className="mobile-toggle"
              aria-label="Toggle navigation"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: "16px 20px",
              background: "rgba(10, 14, 23, 0.98)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {user ? (
              <>
                <Link to="/home" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                <Link to="/portfolio" onClick={() => setMobileMenuOpen(false)}>Portfolio</Link>
                <Link to="/stock/AAPL" onClick={() => setMobileMenuOpen(false)}>Charts</Link>
                <Link to="/history" onClick={() => setMobileMenuOpen(false)}>Order History</Link>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                {user.UserType === "Admin" && (
                  <>
                    <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.1)", margin: "4px 0" }} />
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>Admin Overview</Link>
                    <Link to="/admin/charts" onClick={() => setMobileMenuOpen(false)}>Admin Charts</Link>
                    <Link to="/admin/orders" onClick={() => setMobileMenuOpen(false)}>All Orders</Link>
                    <Link to="/admin/transactions" onClick={() => setMobileMenuOpen(false)}>All Transactions</Link>
                    <Link to="/admin/users" onClick={() => setMobileMenuOpen(false)}>All Users</Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  style={{
                    background: "rgba(244, 63, 94, 0.15)",
                    border: "none",
                    color: "#fb7185",
                    padding: "8px",
                    borderRadius: "6px",
                    textAlign: "center",
                    cursor: "pointer",
                    marginTop: "8px",
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>Landing Page</Link>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Quick Deposit Modal */}
      {depositModalOpen && (
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
          onClick={() => setDepositModalOpen(false)}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: "420px",
              width: "100%",
              padding: "28px",
              background: "var(--bg-card-solid)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.25rem" }}>Deposit Virtual Trading Cash</h3>
              <button
                onClick={() => setDepositModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "18px" }}>
              Top up your simulated wallet instantly to test higher volume trades. No real money is transferred.
            </p>
            <form onSubmit={handleDepositSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>
                  Deposit Amount ($ USD)
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="input-field"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem" }}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {[1000, 5000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    style={{
                      flex: 1,
                      padding: "6px",
                      background: depositAmount === amt ? "var(--neon-green-bg)" : "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${depositAmount === amt ? "var(--neon-green)" : "rgba(255, 255, 255, 0.1)"}`,
                      color: depositAmount === amt ? "var(--neon-green)" : "var(--text-secondary)",
                      borderRadius: "6px",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    +${amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-success"
                  style={{ flex: 1 }}
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 899px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </>
  );
}
