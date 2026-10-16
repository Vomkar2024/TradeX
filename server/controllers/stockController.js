const Stock = require("../models/stockSchema");

// Default initial market stocks for simulation
const DEFAULT_MARKET_STOCKS = [
  {
    Stock_Symbol: "AAPL",
    Stock_name: "Apple Inc.",
    Price: 182.5,
    Stock_Exchange: "NASDAQ",
    change: 1.75,
    changePercent: 0.97,
    volume: 48920100,
    marketCap: 2800000000000,
  },
  {
    Stock_Symbol: "MSFT",
    Stock_name: "Microsoft Corporation",
    Price: 420.72,
    Stock_Exchange: "NASDAQ",
    change: 3.45,
    changePercent: 0.83,
    volume: 21345000,
    marketCap: 3120000000000,
  },
  {
    Stock_Symbol: "GOOGL",
    Stock_name: "Alphabet Inc.",
    Price: 175.98,
    Stock_Exchange: "NASDAQ",
    change: -0.85,
    changePercent: -0.48,
    volume: 18950200,
    marketCap: 2210000000000,
  },
  {
    Stock_Symbol: "AMZN",
    Stock_name: "Amazon.com Inc.",
    Price: 186.4,
    Stock_Exchange: "NASDAQ",
    change: 2.1,
    changePercent: 1.14,
    volume: 32410800,
    marketCap: 1940000000000,
  },
  {
    Stock_Symbol: "TSLA",
    Stock_name: "Tesla, Inc.",
    Price: 218.85,
    Stock_Exchange: "NASDAQ",
    change: -4.3,
    changePercent: -1.93,
    volume: 67890000,
    marketCap: 695000000000,
  },
  {
    Stock_Symbol: "NVDA",
    Stock_name: "NVIDIA Corporation",
    Price: 125.6,
    Stock_Exchange: "NASDAQ",
    change: 4.8,
    changePercent: 3.97,
    volume: 89450000,
    marketCap: 3080000000000,
  },
];

/**
 * @desc    Get all available market stocks (with auto-seed if none exist)
 * @route   GET /api/stocks
 * @access  Public
 */
const getAllStocks = async (req, res) => {
  try {
    // Look for market catalog stocks (UserId is null)
    let marketStocks = await Stock.find({ UserId: null });

    // Seed default stocks if empty
    if (!marketStocks || marketStocks.length === 0) {
      marketStocks = await Stock.insertMany(DEFAULT_MARKET_STOCKS);
    }

    return res.status(200).json({
      success: true,
      count: marketStocks.length,
      data: marketStocks,
    });
  } catch (error) {
    console.error("Get All Stocks Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stock catalog.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get stock details by Symbol
 * @route   GET /api/stocks/:symbol
 * @access  Public
 */
const getStockBySymbol = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    let stock = await Stock.findOne({ Stock_Symbol: symbol, UserId: null });

    if (!stock) {
      // Check fallback list
      const fallback = DEFAULT_MARKET_STOCKS.find((s) => s.Stock_Symbol === symbol);
      if (fallback) {
        stock = await Stock.create(fallback);
      } else {
        return res.status(404).json({
          success: false,
          message: `Stock with symbol '${symbol}' not found.`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: stock,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stock details.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get user's portfolio holdings
 * @route   GET /api/stocks/portfolio
 * @access  Private
 */
const getUserPortfolio = async (req, res) => {
  try {
    const userId = req.user._id;
    // Portfolio holdings are Stock documents where UserId is the logged-in user and Count > 0
    const holdings = await Stock.find({ UserId: userId, Count: { $gt: 0 } });

    const totalPortfolioValue = holdings.reduce(
      (acc, item) => acc + (item.Total_price || item.Price * item.Count),
      0
    );

    return res.status(200).json({
      success: true,
      totalPortfolioValue: parseFloat(totalPortfolioValue.toFixed(2)),
      count: holdings.length,
      holdings,
    });
  } catch (error) {
    console.error("Portfolio Fetch Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user portfolio.",
      error: error.message,
    });
  }
};

/**
 * @desc    Add or update a market stock (Admin/System)
 * @route   POST /api/stocks
 * @access  Private/Admin
 */
const addOrUpdateStock = async (req, res) => {
  try {
    const {
      Stock_Symbol,
      Stock_name,
      Price,
      Stock_Exchange,
      change,
      changePercent,
      volume,
      marketCap,
    } = req.body;

    if (!Stock_Symbol || !Stock_name || Price == null) {
      return res.status(400).json({
        success: false,
        message: "Stock_Symbol, Stock_name, and Price are required.",
      });
    }

    const symbol = Stock_Symbol.toUpperCase().trim();

    let stock = await Stock.findOne({ Stock_Symbol: symbol, UserId: null });
    if (stock) {
      stock.Stock_name = Stock_name;
      stock.Price = Price;
      if (Stock_Exchange) stock.Stock_Exchange = Stock_Exchange;
      if (change != null) stock.change = change;
      if (changePercent != null) stock.changePercent = changePercent;
      if (volume != null) stock.volume = volume;
      if (marketCap != null) stock.marketCap = marketCap;
      await stock.save();
    } else {
      stock = await Stock.create({
        Stock_Symbol: symbol,
        Stock_name,
        Price,
        Stock_Exchange: Stock_Exchange || "NASDAQ",
        change: change || 0,
        changePercent: changePercent || 0,
        volume: volume || 0,
        marketCap: marketCap || 0,
        UserId: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stock catalog item saved successfully.",
      data: stock,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save stock.",
      error: error.message,
    });
  }
};

module.exports = {
  getAllStocks,
  getStockBySymbol,
  getUserPortfolio,
  addOrUpdateStock,
};
