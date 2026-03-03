## Smart Menu – MERN Version

This project converts the original static Smart Menu HTML into a full MERN stack app using **MongoDB**, **Express**, **React**, and **Node.js**.

### 1. Backend (Node + Express + MongoDB)

- **Location**: `backend`
- **Main file**: `server.js`
- **APIs**:
  - `GET /api/menu?category=...` – list menu items (filter by category: `tiffin`, `starter`, `veg`, `nonveg`, `dessert`, `drink`)
  - `POST /api/menu/seed` – seed sample menu data (for development)
  - `POST /api/orders` – create an order
  - `GET /api/orders` – list all orders (simple admin view)

#### Backend setup

1. Go to backend folder and install dependencies:

```bash
cd backend
npm install
```

2. Create a `.env` file in the project root (same level as `.env.example`) or inside `backend` with at least:

```bash
cp ../.env.example .env  # or create manually
```

Make sure `MONGO_URI` points to a running MongoDB instance.

3. Start backend server:

```bash
npm run dev
```

The API runs on `http://localhost:5000`.

4. (Optional) Seed sample menu items:

```bash
curl -X POST http://localhost:5000/api/menu/seed
```

### 2. Frontend (React + Vite)

- **Location**: `frontend`
- **Entry**: `src/main.jsx`, `src/App.jsx`
- Uses **Bootstrap** for styling and connects to the backend via `/api` (Vite dev server proxies to `http://localhost:5000`).

#### Frontend setup

1. In another terminal, install dependencies and start dev server:

```bash
cd frontend
npm install
npm run dev
```

2. Open the URL shown in the terminal (usually `http://localhost:5173`).

### 3. How it works

- The React app shows:
  - Category buttons (Tiffins, Starters, Vegetarian, Non-Vegetarian, Desserts, Drinks)
  - Menu items loaded from MongoDB (via `GET /api/menu?category=...`)
  - A cart/order panel where customers enter **name**, **table number**, and quantities.
- When the user clicks **Place Order**, the app sends a `POST /api/orders` request with all selected items and the total amount.

You can keep the original static HTML/CSS files for reference or legacy usage; the new React frontend provides a dynamic, API-powered Smart Menu experience.

