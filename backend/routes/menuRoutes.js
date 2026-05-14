import express from "express";
import MenuItem from "../models/MenuItem.js";

const router = express.Router();

// GET /api/menu - all items, optional category query
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) {
      filter.category = category.toLowerCase();
    }
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    console.error("Error fetching menu items:", err);
    res.status(500).json({ message: "Failed to fetch menu items" });
  }
});

// PATCH /api/menu/:id/availability - Toggle item availability (Admin)
router.patch("/:id/availability", async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    console.error("Error updating availability:", err);
    res.status(500).json({ message: "Failed to update availability" });
  }
});

// DELETE /api/menu - remove all menu items (admin/dev utility)
router.delete("/", async (req, res) => {
  try {
    const result = await MenuItem.deleteMany({});
    res.json({ message: "All menu items deleted", deletedCount: result.deletedCount });
  } catch (err) {
    console.error("Error deleting menu items:", err);
    res.status(500).json({ message: "Failed to delete menu items" });
  }
});

// POST /api/menu/bulk - insert menu items (admin/dev utility)
router.post("/bulk", async (req, res) => {
  try {
    const { items, names, category, price } = req.body || {};
    let toInsert = [];
    if (Array.isArray(items) && items.length > 0) {
      toInsert = items.map((it) => ({
        name: String(it.name || "").trim(),
        category: String(it.category || "").toLowerCase().trim(),
        description: it.description ? String(it.description) : undefined,
        price: Number(it.price),
        isAvailable: typeof it.isAvailable === "boolean" ? it.isAvailable : true,
      }));
    } else if (Array.isArray(names) && names.length > 0) {
      const cat = String(category || "tiffin").toLowerCase().trim();
      const p = Number.isFinite(Number(price)) ? Number(price) : 100;
      toInsert = names.map((n) => ({
        name: String(n || "").trim(),
        category: cat,
        price: p,
        isAvailable: true,
      }));
    } else {
      return res.status(400).json({ message: "Provide either 'items' or 'names' array" });
    }
    const created = await MenuItem.insertMany(toInsert);
    res.status(201).json({ message: "Menu items created", count: created.length });
  } catch (err) {
    console.error("Error bulk creating menu items:", err);
    res.status(500).json({ message: "Failed to create menu items" });
  }
});

// Seed sample data (GET method, no images)
router.get("/seed", async (req, res) => {
  try {
    await MenuItem.deleteMany({});
    const allItems = [];
    const nonVegNames = ["Chicken Biryani", "Mutton Biryani", "Chicken Tikka", "Butter Chicken"];
    nonVegNames.forEach((name, i) => {
      allItems.push({ name, category: "nonveg", description: `Authentic ${name}.`, price: 250 + i * 10, isAvailable: true });
    });
    const tiffinNames = ["Idli Sambar", "Masala Dosa", "Plain Dosa", "Vada"];
    tiffinNames.forEach((name, i) => {
      allItems.push({ name, category: "tiffin", description: `Classic ${name}.`, price: 80 + i * 5, isAvailable: true });
    });
    const created = await MenuItem.insertMany(allItems);
    res.status(201).json({ message: "Detailed menu seeded without images", count: created.length });
  } catch (err) {
    console.error("Error seeding menu items:", err);
    res.status(500).json({ message: "Failed to seed menu items" });
  }
});

export default router;
