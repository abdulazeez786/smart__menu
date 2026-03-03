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

// PATCH /api/menu/images - clear image URLs, optionally by category
router.patch("/images", async (req, res) => {
  try {
    const { category } = req.body || {};
    const filter = {};
    if (category) {
      filter.category = String(category).toLowerCase();
    }

    const result = await MenuItem.updateMany(filter, { $unset: { imageUrl: "" } });
    res.json({
      message: "Image URLs cleared",
      matchedCount: result.matchedCount ?? result.n,
      modifiedCount: result.modifiedCount ?? result.nModified,
    });
  } catch (err) {
    console.error("Error clearing image URLs:", err);
    res.status(500).json({ message: "Failed to clear image URLs" });
  }
});

// POST /api/menu/bulk - insert menu items (admin/dev utility)
// Supports either:
// - { items: [{ name, category, price, description?, imageUrl?, isAvailable? }, ...] }
// - { names: ["Idli", "Dosa"], category?: "tiffin", price?: 100 }
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
        imageUrl: it.imageUrl ? String(it.imageUrl) : undefined,
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

    // Basic validation
    const allowedCategories = ["tiffin", "starter", "veg", "nonveg", "dessert", "drink"];
    const invalid = toInsert.find(
      (it) =>
        !it.name ||
        !allowedCategories.includes(it.category) ||
        !Number.isFinite(it.price) ||
        it.price <= 0
    );
    if (invalid) {
      return res.status(400).json({
        message:
          "Invalid item(s). Each item needs a non-empty name, valid category, and positive price.",
        exampleAllowedCategories: allowedCategories,
      });
    }

    const created = await MenuItem.insertMany(toInsert);
    res.status(201).json({ message: "Menu items created", count: created.length });
  } catch (err) {
    console.error("Error bulk creating menu items:", err);
    res.status(500).json({ message: "Failed to create menu items" });
  }
});

// Seed sample data (for dev only)
router.post("/seed", async (req, res) => {
  try {
    await MenuItem.deleteMany({});
    
    const allItems = [];

    const buildFoodImageUrl = (name, category) => {
      // loremflickr gives a wide variety of real photos by tags.
      // lock makes it deterministic per item, so images don't shuffle on every seed.
      const cat = String(category || "").toLowerCase();

      const baseTagsByCategory = {
        tiffin: ["southindian", "breakfast", "tiffin", "dosa", "idli"],
        starter: ["starter", "appetizer", "snack", "fingerfood"],
        veg: ["vegetarian", "veg", "curry", "indianfood"],
        nonveg: ["chicken", "meat", "nonveg", "indianfood"],
        dessert: ["dessert", "sweet", "cake", "pastry"],
        drink: ["drink", "beverage", "juice", "coffee"],
      };

      const normalizeWords = (value) =>
        String(value || "")
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 3); // keep tags focused

      const tags = [
        ...(baseTagsByCategory[cat] || ["food"]),
        ...normalizeWords(name),
      ]
        .map((t) => encodeURIComponent(t))
        .join(",");

      let hash = 0;
      const input = `${cat}:${name}`;
      for (let i = 0; i < input.length; i++) {
        hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
      }
      const lock = (hash % 10000) + 1;

      return `https://loremflickr.com/800/600/${tags}?lock=${lock}`;
    };

    // --- Non-Veg Items (40 items) ---
    const nonVegNames = [
      "Chicken Biryani", "Mutton Biryani", "Chicken Tikka Masala", "Butter Chicken", "Chicken Handi",
      "Fish Fry", "Prawns Masala", "Chicken Lollipop", "Egg Curry", "Chicken 65",
      "Mutton Rogan Josh", "Chicken Korma", "Tandoori Chicken", "Chicken Masala", "Fish Curry",
      "Chicken Fry", "Chicken Kabab", "Mutton Fry", "Egg Biryani", "Prawns Fry",
      "Chicken Keema", "Chicken Dum Biryani", "Mutton Dum Biryani", "Chili Chicken", "Garlic Chicken",
      "Chicken Moghlai", "Lemon Chicken", "Ginger Chicken", "Chicken Seekh Kabab", "Mutton Keema",
      "Pepper Chicken", "Chicken Majestic", "Fish Fingers", "Tandoori Prawns", "Chicken Drumsticks",
      "Chicken Wings", "Hyderabadi Biryani", "Chicken Kolhapuri", "Mutton Chops", "Egg Bhurji"
    ];
    nonVegNames.forEach((name, i) => {
      allItems.push({
        name,
        category: "nonveg",
        description: `Authentic and spicy ${name} prepared with traditional spices.`,
        price: 250 + i * 10,
        imageUrl: buildFoodImageUrl(name, "nonveg"),
        isAvailable: true
      });
    });

    // --- Desserts (40 items) ---
    const dessertNames = [
      "Gulab Jamun", "Rasgulla", "Kulfi", "Ice Cream", "Brownie",
      "Cheesecake", "Pudding", "Pastry", "Fruit Salad", "Custard",
      "Jalebi", "Gajar Ka Halwa", "Rasmalai", "Mousse", "Donut",
      "Cupcake", "Apple Pie", "Tiramisu", "Double Ka Meetha", "Basundi",
      "Shahi Tukda", "Payasam", "Falooda", "Milkshake", "Choco Lava Cake",
      "Black Forest", "Red Velvet", "Butterscotch Cake", "Waffles", "Pancakes",
      "Soan Papdi", "Mysore Pak", "Badam Halwa", "Coconut Burfi", "Rabri",
      "Kheer", "Phirni", "Fruit Cream", "Trifle", "Bread Pudding"
    ];
    dessertNames.forEach((name, i) => {
      allItems.push({
        name,
        category: "dessert",
        description: `Sweet and delicious ${name} to end your meal perfectly.`,
        price: 80 + i * 5,
        imageUrl: buildFoodImageUrl(name, "dessert"),
        isAvailable: true
      });
    });

    // --- Drinks (40 items) ---
    const drinkNames = [
      "Fresh Lime Soda", "Cold Coffee", "Masala Chai", "Lemon Tea", "Mango Lassi",
      "Sweet Lassi", "Salted Lassi", "Fruit Juice", "Coca Cola", "Pepsi",
      "Sprite", "Thums Up", "Iced Tea", "Milkshake", "Buttermilk",
      "Ginger Tea", "Green Tea", "Filter Coffee", "Rose Milk", "Badam Milk",
      "Chocolate Milk", "Virgin Mojito", "Blue Lagoon", "Fruit Punch", "Oreo Shake",
      "Kitkat Shake", "Mocktail", "Mineral Water", "Pina Colada", "Sunrise",
      "Watermelon Juice", "Orange Juice", "Pineapple Juice", "Apple Juice", "Grape Juice",
      "Cocktail", "Smoothie", "Energy Drink", "Soda", "Jal Jeera"
    ];
    drinkNames.forEach((name, i) => {
      allItems.push({
        name,
        category: "drink",
        description: `Refreshing ${name} to keep you cool.`,
        price: 40 + i * 3,
        imageUrl: buildFoodImageUrl(name, "drink"),
        isAvailable: true
      });
    });

    // --- Professional Tiffin Items ---
    const tiffinNames = [
      "Idli Sambar",
      "Masala Dosa",
      "Plain Dosa",
      "Onion Uthappam",
      "Ghee Roast Dosa",
      "Podi Idli",
      "Medu Vada",
      "Upma",
      "Pongal",
      "Poori Bhaji",
      "Paneer Paratha",
      "Aloo Paratha",
      "Veg Sandwich",
      "Cheese Sandwich",
      "Veg Cutlet",
      "Paneer Roll",
      "Veg Frankie",
      "Chole Bhature",
      "Stuffed Kulcha",
      "Mysore Bonda",
      "Rava Dosa",
      "Set Dosa",
      "Mini Idli",
      "Curd Rice",
      "Lemon Rice",
      "Tamarind Rice",
      "Puliyogare",
      "Vegetable Pulao",
      "Bisibele Bath",
      "Khichdi",
      "Kothu Parotta",
      "Egg Dosa",
      "Paneer Dosa",
      "Cheese Dosa",
      "Ragi Dosa",
      "Kara Bath",
      "Idiyappam",
      "Aval Upma",
      "Sabudana Khichdi"
    ];
    tiffinNames.forEach((name, i) => {
      allItems.push({
        name,
        category: "tiffin",
        description: `Classic South Indian tiffin - ${name}.`,
        price: 80 + i * 5,
        imageUrl: buildFoodImageUrl(name, "tiffin"),
        isAvailable: true
      });
    });

    // --- Starters (40 items) ---
    const starterNames = [
      "Paneer Tikka", "Gobi Manchurian", "Chilli Paneer", "Veg Spring Rolls", "Crispy Corn",
      "Baby Corn 65", "Veg Manchow Soup", "Sweet Corn Soup", "Hara Bhara Kebab", "Veg Seekh Kebab",
      "Cheese Balls", "French Fries", "Peri Peri Fries", "Nachos & Salsa", "Garlic Bread",
      "Stuffed Mushrooms", "Veg Cutlet", "Onion Pakora", "Mirchi Bajji", "Chicken 65",
      "Chicken Tikka", "Tandoori Wings", "Fish Fingers", "Chicken Lollipop", "Pepper Chicken",
      "Corn Cheese Toast", "Paneer 65", "Mushroom Pepper Fry", "Chilli Gobi", "Schezwan Paneer",
      "Crispy Veg", "Tandoori Paneer", "Aloo Tikki", "Veg Nuggets", "Cheese Chilli Toast",
      "Salt & Pepper Baby Corn", "Prawn Tempura", "Tandoori Prawns", "Masala Papad", "Peanut Masala"
    ];
    starterNames.forEach((name, i) => {
      allItems.push({
        name,
        category: "starter",
        description: `Perfect starter to begin your meal - ${name}.`,
        price: 140 + i * 6,
        imageUrl: buildFoodImageUrl(name, "starter"),
        isAvailable: true
      });
    });

    // --- Vegetarian mains (40 items) ---
    const vegNames = [
      "Paneer Butter Masala", "Kadai Paneer", "Palak Paneer", "Shahi Paneer", "Paneer Tikka Masala",
      "Veg Kolhapuri", "Mix Veg Curry", "Aloo Gobi", "Aloo Matar", "Matar Paneer",
      "Dal Fry", "Dal Tadka", "Dal Makhani", "Chana Masala", "Rajma Masala",
      "Bhindi Masala", "Baingan Bharta", "Mushroom Masala", "Kadai Mushroom", "Veg Korma",
      "Sambar", "Rasam", "Curd Curry", "Navratan Korma", "Veg Chettinad",
      "Paneer Bhurji", "Malai Kofta", "Kofta Curry", "Chole", "Veg Jalfrezi",
      "Capsicum Masala", "Corn Palak", "Corn Masala", "Paneer Korma", "Methi Malai Matar",
      "Gutti Vankaya", "Bagara Baingan", "Paneer Lababdar", "Veg Handi", "Dum Aloo"
    ];
    vegNames.forEach((name, i) => {
      allItems.push({
        name,
        category: "veg",
        description: `Traditional vegetarian main course - ${name}.`,
        price: 190 + i * 7,
        imageUrl: buildFoodImageUrl(name, "veg"),
        isAvailable: true
      });
    });

    const created = await MenuItem.insertMany(allItems);
    res.status(201).json({ message: "Detailed menu seeded", count: created.length });
  } catch (err) {
    console.error("Error seeding menu items:", err);
    res.status(500).json({ message: "Failed to seed menu items" });
  }
});

export default router;
