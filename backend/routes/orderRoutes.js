import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

// POST /api/orders - create new order
router.post("/", async (req, res) => {
  try {
    const { customerName, tableNumber, items, totalAmount, paymentMethod, cardDetails } = req.body;

    if (!customerName || !tableNumber || !items || !items.length || !totalAmount || !paymentMethod) {
      return res.status(400).json({ message: "Missing required order fields" });
    }

    const orderData = {
      customerName,
      tableNumber,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus: "pending",
    };

    if (paymentMethod === "card" && cardDetails) {
      orderData.cardDetails = cardDetails;
    }

    const order = await Order.create(orderData);

    res.status(201).json(order);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
});

// GET /api/orders - list orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().populate("items.menuItem").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// PATCH /api/orders/:id/status - update order status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "accepted", "rejected", "finished", "out_of_stock"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("items.menuItem");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

// PATCH /api/orders/:id/payment - update payment status
router.patch("/:id/payment", async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!["pending", "completed"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    ).populate("items.menuItem");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error("Error updating payment status:", err);
    res.status(500).json({ message: "Failed to update payment status" });
  }
});

export default router;
