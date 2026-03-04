import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import connectDB from "./config/db.js";
import MenuItem from "./models/MenuItem.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// API routes
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

app.get('/', (req, res) => {
  res.send("Smart Menu API is running");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Smart Menu API is running" });
});

const PORT = process.env.PORT || 5001;

// Only listen if not running as a serverless function (Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Smart Menu API server running on port ${PORT}`);
  });
}

// CRITICAL FOR VERCEL: Export the app
export default app;
