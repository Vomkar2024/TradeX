import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../components/axiosInstance";

export const GeneralContext = createContext(null);

export const GeneralContextProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("tradex_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("tradex_token") || "");
  const [loading, setLoading] = useState(true);

  // Helper to extract balance number from any user representation
  const getBalanceFromUser = (u) => {
    if (!u) return 0;
    if (typeof u.cashBalance === "number") return u.cashBalance;
    if (typeof u.balance === "number") return u.balance;
    const parsed = parseFloat(u.cashBalance || u.balance);
    return isNaN(parsed) ? 0 : parsed;
  };

  const [walletBalance, setWalletBalance] = useState(() => getBalanceFromUser(user));
  const [stocks, setStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Helper to show dismissible alerts/toasts
  const showNotification = useCallback((message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  }, []);

  const clearNotification = () => setNotification(null);

  // Sync token and user in localStorage
  const saveAuthSession = (userData, tokenString) => {
    if (tokenString) {
      localStorage.setItem("tradex_token", tokenString);
      setToken(tokenString);
    }
    if (userData) {
      const balanceVal = getBalanceFromUser(userData);
      const normalizedUser = {
        ...userData,
        cashBalance: balanceVal,
        balance: balanceVal,
        Username: userData.Username || userData.username || "Trader",
        username: userData.username || userData.Username || "Trader",
        UserType: userData.UserType || userData.usertype || "User",
        usertype: userData.usertype || userData.UserType || "User",
      };
      localStorage.setItem("tradex_user", JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      setWalletBalance(balanceVal);
    }
  };

  // Clear auth session
  const clearAuthSession = () => {
    localStorage.removeItem("tradex_token");
    localStorage.removeItem("tradex_user");
    setToken("");
    setUser(null);
    setWalletBalance(0);
  };

  // Fetch live market stocks catalog
  const fetchStocks = useCallback(async () => {
    setStocksLoading(true);
    try {
      const res = await axiosInstance.get("/api/stocks");
      if (res.data && res.data.data) {
        setStocks(res.data.data);
      }
    } catch (err) {
      console.warn("Could not fetch stocks from backend:", err.message);
      // Fallback default simulation stocks if backend is offline
      setStocks([
        { Stock_Symbol: "AAPL", Stock_name: "Apple Inc.", Price: 182.5, change: 1.75, changePercent: 0.97, volume: 48920100, Stock_Exchange: "NASDAQ" },
        { Stock_Symbol: "MSFT", Stock_name: "Microsoft Corporation", Price: 420.72, change: 3.45, changePercent: 0.83, volume: 21345000, Stock_Exchange: "NASDAQ" },
        { Stock_Symbol: "GOOGL", Stock_name: "Alphabet Inc.", Price: 175.98, change: -0.85, changePercent: -0.48, volume: 18950200, Stock_Exchange: "NASDAQ" },
        { Stock_Symbol: "AMZN", Stock_name: "Amazon.com Inc.", Price: 186.4, change: 2.1, changePercent: 1.14, volume: 32410800, Stock_Exchange: "NASDAQ" },
        { Stock_Symbol: "TSLA", Stock_name: "Tesla, Inc.", Price: 218.85, change: -4.3, changePercent: -1.93, volume: 67890000, Stock_Exchange: "NASDAQ" },
        { Stock_Symbol: "NVDA", Stock_name: "NVIDIA Corporation", Price: 125.6, change: 4.8, changePercent: 3.97, volume: 89450000, Stock_Exchange: "NASDAQ" },
      ]);
    } finally {
      setStocksLoading(false);
    }
  }, []);

  // Refresh user wallet balance from backend
  const refreshBalance = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axiosInstance.get("/api/users/balance");
      const balanceVal =
        typeof res.data?.cashBalance === "number"
          ? res.data.cashBalance
          : typeof res.data?.balance === "number"
          ? res.data.balance
          : null;

      if (balanceVal !== null) {
        setWalletBalance(balanceVal);
        setUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, cashBalance: balanceVal, balance: balanceVal };
          localStorage.setItem("tradex_user", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.warn("Failed to refresh balance:", err.message);
    }
  }, [token]);

  // Refresh full user profile
  const refreshProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await axiosInstance.get("/api/users/profile");
      if (res.data?.user) {
        const u = res.data.user;
        const balanceVal = getBalanceFromUser(u);
        const normalizedUser = {
          ...u,
          cashBalance: balanceVal,
          balance: balanceVal,
          Username: u.Username || u.username || "Trader",
          username: u.username || u.Username || "Trader",
          UserType: u.UserType || u.usertype || "User",
          usertype: u.usertype || u.UserType || "User",
        };
        setUser(normalizedUser);
        setWalletBalance(balanceVal);
        localStorage.setItem("tradex_user", JSON.stringify(normalizedUser));
      }
    } catch (err) {
      console.warn("Profile fetch failed / session expired:", err.message);
      if (err.response?.status === 401) {
        clearAuthSession();
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    try {
      const res = await axiosInstance.post("/api/users/login", { email, password });
      if (res.data && res.data.success) {
        saveAuthSession(res.data.user, res.data.token);
        showNotification(`Welcome back, ${res.data.user.Username}!`, "success");
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data?.message || "Login failed" };
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid credentials or network issue.";
      showNotification(msg, "error");
      return { success: false, message: msg };
    }
  };

  // Register handler
  const register = async (username, email, password, userType = "User") => {
    try {
      const res = await axiosInstance.post("/api/users/register", {
        Username: username,
        email,
        password,
        UserType: userType,
      });
      if (res.data && res.data.success) {
        saveAuthSession(res.data.user, res.data.token);
        showNotification("Account created! $25,000 virtual trading cash credited.", "success");
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data?.message || "Registration failed" };
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      showNotification(msg, "error");
      return { success: false, message: msg };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await axiosInstance.post("/api/users/logout");
    } catch (err) {
      console.warn("Logout error:", err.message);
    } finally {
      clearAuthSession();
      showNotification("You have been signed out.", "info");
    }
  };

  // Deposit virtual funds
  const depositFunds = async (amount, paymentMode = "UPI") => {
    try {
      const numAmount = parseFloat(amount);
      const res = await axiosInstance.post("/api/transactions/deposit", {
        amount: numAmount,
        Amount: numAmount,
        paymentMode: paymentMode,
        Payment_mode: paymentMode,
      });
      if (res.data?.success) {
        showNotification(
          `Successfully deposited $${numAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}!`,
          "success"
        );
        const newBal =
          typeof res.data.cashBalance === "number"
            ? res.data.cashBalance
            : typeof res.data.balance === "number"
            ? res.data.balance
            : null;

        if (newBal !== null) {
          setWalletBalance(newBal);
          setUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, cashBalance: newBal, balance: newBal };
            localStorage.setItem("tradex_user", JSON.stringify(updated));
            return updated;
          });
        }
        await refreshBalance();
        return { success: true, transaction: res.data.transaction, cashBalance: newBal };
      }
      return { success: false, message: res.data?.message || "Deposit failed" };
    } catch (err) {
      const msg = err.response?.data?.message || "Deposit transaction failed.";
      showNotification(msg, "error");
      return { success: false, message: msg };
    }
  };

  // Withdraw virtual funds
  const withdrawFunds = async (amount, paymentMode = "Bank Transfer") => {
    try {
      const numAmount = parseFloat(amount);
      const res = await axiosInstance.post("/api/transactions/withdraw", {
        amount: numAmount,
        Amount: numAmount,
        paymentMode: paymentMode,
        Payment_mode: paymentMode,
      });
      if (res.data?.success) {
        showNotification(
          `Successfully withdrew $${numAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}!`,
          "success"
        );
        const newBal =
          typeof res.data.cashBalance === "number"
            ? res.data.cashBalance
            : typeof res.data.balance === "number"
            ? res.data.balance
            : null;

        if (newBal !== null) {
          setWalletBalance(newBal);
          setUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, cashBalance: newBal, balance: newBal };
            localStorage.setItem("tradex_user", JSON.stringify(updated));
            return updated;
          });
        }
        await refreshBalance();
        return { success: true, transaction: res.data.transaction, cashBalance: newBal };
      }
      return { success: false, message: res.data?.message || "Withdrawal failed" };
    } catch (err) {
      const msg = err.response?.data?.message || "Withdrawal transaction failed.";
      showNotification(msg, "error");
      return { success: false, message: msg };
    }
  };

  useEffect(() => {
    refreshProfile();
    fetchStocks();
  }, [refreshProfile, fetchStocks]);

  const value = {
    user,
    token,
    loading,
    walletBalance,
    stocks,
    stocksLoading,
    notification,
    showNotification,
    clearNotification,
    login,
    register,
    logout,
    refreshBalance,
    refreshProfile,
    fetchStocks,
    depositFunds,
    withdrawFunds,
  };

  return (
    <GeneralContext.Provider value={value}>
      {children}
    </GeneralContext.Provider>
  );
};

export const useGeneralContext = () => {
  const context = useContext(GeneralContext);
  if (!context) {
    throw new Error("useGeneralContext must be used within a GeneralContextProvider");
  }
  return context;
};

export default GeneralContext;
