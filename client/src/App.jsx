import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GeneralContextProvider, useGeneralContext } from "./context/GeneralContext";

// Components
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Register from "./components/Register";

// User Pages
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import StockChart from "./pages/StockChart";
import Portfolio from "./pages/Portfolio";
import History from "./pages/History";
import Profile from "./pages/Profile";

// Admin Pages
import Admin from "./pages/Admin";
import AdminStockChart from "./pages/AdminStockChart";
import AllOrders from "./pages/AllOrders";
import AllTransactions from "./pages/AllTransactions";
import Users from "./pages/Users";

// Protected Route Guard for logged-in users
function ProtectedRoute({ children }) {
  const { user, loading } = useGeneralContext();
  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center", color: "var(--text-muted)" }}>
        Checking session status...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Protected Route Guard for Admin users
function AdminRoute({ children }) {
  const { user, loading } = useGeneralContext();
  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center", color: "var(--text-muted)" }}>
        Verifying administrative privileges...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.UserType !== "Admin") {
    return <Navigate to="/home" replace />;
  }
  return children;
}

// Global Notification Alert Toast
function NotificationToast() {
  const { notification, clearNotification } = useGeneralContext();
  if (!notification) return null;

  const isSuccess = notification.type === "success";
  const isError = notification.type === "error";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        background: isSuccess
          ? "rgba(16, 185, 129, 0.95)"
          : isError
          ? "rgba(239, 68, 68, 0.95)"
          : "rgba(99, 102, 241, 0.95)",
        color: "#fff",
        padding: "12px 20px",
        borderRadius: "var(--radius-md)",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "0.9rem",
        fontWeight: 600,
        maxWidth: "420px",
        animation: "slideInUp 0.3s ease-out",
      }}
    >
      <span>{isSuccess ? "✓" : isError ? "⚠" : "ℹ"}</span>
      <span style={{ flex: 1 }}>{notification.message}</span>
      <button
        onClick={clearNotification}
        style={{
          background: "transparent",
          border: "none",
          color: "#fff",
          fontSize: "1.1rem",
          cursor: "pointer",
        }}
      >
        ✕
      </button>
    </div>
  );
}

function AppContent() {
  return (
    <div className="app-layout">
      <Navbar />
      <NotificationToast />

      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/stock/:symbol" element={<StockChart />} />

          {/* Protected Trader Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <Portfolio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/charts"
            element={
              <AdminRoute>
                <AdminStockChart />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AllOrders />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <AdminRoute>
                <AllTransactions />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            }
          />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer
        style={{
          marginTop: "auto",
          borderTop: "1px solid var(--border-subtle)",
          background: "rgba(7, 9, 14, 0.9)",
          padding: "24px 20px",
          textAlign: "center",
          color: "var(--text-dim)",
          fontSize: "0.82rem",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div>
            <strong style={{ color: "var(--text-secondary)" }}>TradeX</strong> — Smart Stock Simulation & Portfolio Intelligence Desk
          </div>
          <div>
            Simulated market environment for education. No real capital at risk. US market quotes streamed for educational testing.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <GeneralContextProvider>
        <AppContent />
      </GeneralContextProvider>
    </BrowserRouter>
  );
}
