const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const {
  apiLimiter,
  authLimiter,
  checkoutLimiter,
} = require("./middleware/rateLimiter");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();
app.use(helmet());
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL, // e.g., 'https://mchocolatesandcakes.com'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Blocked by CORS policy: Unauthorized origin."));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use((req, res, next) => {
  Object.defineProperty(req, "query", {
    value: req.query ? { ...req.query } : {},
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});
app.use(mongoSanitize());
app.use(
  hpp({
    whitelist: ["category", "sort", "status"], // Query params allowed to appear multiple times if needed
  }),
);
app.use("/api", apiLimiter);

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/upload", uploadRoutes);

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found on this server.`,
  });
});

app.use((err, req, res, next) => {
  if (err.name === "MulterError") {
    return res
      .status(400)
      .json({ success: false, message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    process.on("unhandledRejection", (err) => {
      console.error("Unhandled Promise Rejection 💥:", err.message);
      // In production, log error to monitoring and close server cleanly if critical
    });
    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception 💥:", err.message);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("Database connection failure:", err.message);
  });
