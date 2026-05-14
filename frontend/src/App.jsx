import React, { useEffect, useState } from "react";
import axios from "axios";
import { Routes, Route, useNavigate, Navigate, Link } from "react-router-dom";
import { CartProvider, useCart } from "./CartContext.jsx";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

const categories = [
  { id: "tiffin", label: "Tiffins" },
  { id: "starter", label: "Starters" },
  { id: "veg", label: "Vegetarian" },
  { id: "nonveg", label: "Non-Vegetarian" },
  { id: "dessert", label: "Desserts" },
  { id: "drink", label: "Drinks" },
];

// Admin Credentials
const ADMIN_ID = "admin";
const ADMIN_PASS = "admin123";

const Layout = ({ children, hideNav = false }) => {
  const navigate = useNavigate();
  const isAdminLoggedIn = localStorage.getItem("isAdminAuthenticated") === "true";

  const handleLogout = () => {
    localStorage.removeItem("isAdminAuthenticated");
    navigate("/");
  };

  if (hideNav) return <div className="main-container">{children}</div>;

  return (
    <div>
      <nav className="navbar navbar-expand-lg bg fixed-top">
        <div className="container-fluid">
          <span
            className="navbar-brand brand-text"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            Mystical Wanderes
          </span>
          <div className="d-flex gap-2">
            <Link to="/role-select" className="btn btn-sm btn-outline-danger">Switch Role</Link>
            {isAdminLoggedIn && (
              <button
                className="btn btn-sm btn-dark"
                onClick={handleLogout}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>
      <div className="main-container">{children}</div>
    </div>
  );
};

const RoleSelectionPage = () => {
  const navigate = useNavigate();
  return (
    <div className="background d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "100vh", width: "100vw" }}>
      <div id="hero-content" style={{ position: 'relative', background: 'rgba(255,255,255,0.1)', padding: '40px', borderRadius: '30px', backdropFilter: 'blur(2px)' }}>
        <h1 className="mb-5 fw-bold" style={{ fontSize: '4rem', fontFamily: 'cursive', color: 'orangered' }}>Mystical Wanderes</h1>
        <div className="row w-100 justify-content-center g-4" style={{ maxWidth: "800px" }}>
          <div className="col-md-6">
            <div 
              className="card p-5 text-center shadow-lg border-0 h-100" 
              style={{ cursor: 'pointer', transition: '0.3s', borderRadius: '25px', backgroundColor: 'rgba(255,255,255,0.95)' }}
              onClick={() => navigate("/menu")}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div className="display-4 mb-3">🍽️</div>
              <h3 className="fw-bold" style={{ color: 'orangered', fontFamily: 'cursive' }}>Customer</h3>
              <p className="text-muted">Order delicious food from our menu</p>
            </div>
          </div>
          <div className="col-md-6">
            <div 
              className="card p-5 text-center shadow-lg border-0 h-100" 
              style={{ cursor: 'pointer', transition: '0.3s', borderRadius: '25px', backgroundColor: 'rgba(255,255,255,0.95)' }}
              onClick={() => navigate("/admin")}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div className="display-4 mb-3">🔐</div>
              <h3 className="fw-bold" style={{ color: 'orangered', fontFamily: 'cursive' }}>Admin</h3>
              <p className="text-muted">Manage orders and restaurant settings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (id === ADMIN_ID && pass === ADMIN_PASS) {
      localStorage.setItem("isAdminAuthenticated", "true");
      navigate("/admin");
    } else {
      setError("Invalid Admin ID or Password");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
      <div className="card shadow-sm p-4" style={{ width: "100%", maxWidth: "400px" }}>
        <h3 className="text-center mb-4">Admin Login</h3>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label small fw-bold">Admin ID</label>
            <input 
              className="form-control" 
              value={id} 
              onChange={(e) => setId(e.target.value)} 
              required 
            />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-bold">Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={pass} 
              onChange={(e) => setPass(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-danger w-100 fw-bold">Login</button>
        </form>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("isAdminAuthenticated") === "true";
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const UserOrderTracking = () => {
  const { userOrders } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyOrders = async () => {
    if (userOrders.length === 0) return;
    try {
      setLoading(true);
      const res = await API.get(`/orders?t=${new Date().getTime()}`);
      const filtered = res.data.filter(o => userOrders.includes(o._id));
      setOrders(filtered);
    } catch (err) {
      console.error("Failed to fetch tracking orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
    const interval = setInterval(fetchMyOrders, 10000);
    return () => clearInterval(interval);
  }, [userOrders]);

  if (userOrders.length === 0) return null;

  const getStatusInfo = (status) => {
    switch (status) {
      case 'accepted': return { color: '#0d6efd', label: 'Preparing...', icon: '👨‍🍳' };
      case 'finished': return { color: '#198754', label: 'Served', icon: '✅' };
      case 'rejected': return { color: '#dc3545', label: 'Rejected', icon: '❌' };
      case 'out_of_stock': return { color: '#6c757d', label: 'Out of Stock', icon: '⚠️' };
      default: return { color: '#ffc107', label: 'Pending', icon: '⏳' };
    }
  };

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow-sm p-4 rounded-4 bg-white">
        <h4 className="fw-bold mb-4">Track Your Orders</h4>
        <div className="row g-3">
          {orders.map((o) => {
            const info = getStatusInfo(o.status);
            return (
              <div className="col-12" key={o._id}>
                <div className="p-3 rounded-3 border bg-light d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold">{o.customerName} - Table {o.tableNumber}</div>
                    <div className="small text-muted">
                      {o.items.map(i => `${i.menuItem?.name} x${i.quantity}`).join(", ")}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="h5 mb-0" style={{ color: info.color }}>
                      {info.icon} {info.label}
                    </div>
                    <div className="extra-small text-muted">{o.paymentStatus === 'completed' ? 'Paid' : 'Payment Pending'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MenuView = () => {
  const [activeCategory, setActiveCategory] = useState("tiffin");
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { addItem } = useCart();

  const fetchItems = async (category, search = "") => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/menu", {
        params: { category, search, _t: new Date().getTime() },
      });
      setMenuItems(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load menu. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(activeCategory, searchTerm);
  }, [activeCategory, searchTerm]);

  return (
    <div className="row">
      <div className="col-12 mb-4">
        <div className="input-group mb-3">
          <span className="input-group-text bg-white border-end-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search text-muted" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
          </span>
          <input 
            type="text" 
            className="form-control border-start-0 py-2 shadow-none" 
            placeholder="Search for dishes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="btn-group flex-wrap" role="group">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={
                "btn category-btn " +
                (activeCategory === cat.id ? "active" : "")
              }
              onClick={() => { setActiveCategory(cat.id); setSearchTerm(""); }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div className="col-12">
        {loading && <p className="text-center py-5">Loading delicious items...</p>}
        {error && <p className="text-danger">{error}</p>}
        <div className="row g-3">
          {menuItems.map((item) => (
            <div className="col-md-4" key={item._id}>
              <div className="card h-100 shadow-sm border-0 rounded-3 overflow-hidden">
                <div className="card-body d-flex flex-column">
                  <h6 className="card-title fw-bold mb-1">{item.name}</h6>
                  <p className="card-text text-muted extra-small mb-2" style={{ fontSize: '11px' }}>
                    {item.description}
                  </p>
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <span className="fw-bold text-success">₹ {item.price}</span>
                    <button
                      className="btn btn-sm btn-primary px-3 rounded-pill"
                      onClick={() => addItem(item)}
                      disabled={!item.isAvailable}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CartView = () => {
  const {
    customerName,
    setCustomerName,
    tableNumber,
    setTableNumber,
    paymentMethod,
    setPaymentMethod,
    items,
    updateQuantity,
    removeItem,
    clearCart,
    totalAmount,
    addOrderToHistory
  } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const submitOrder = async () => {
    if (!customerName || !tableNumber || items.length === 0) {
      setMessage("Please fill details and add at least one item.");
      return;
    }

    const confirmed = window.confirm(
      `Confirm order for ₹${totalAmount}?`
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      const payload = {
        customerName,
        tableNumber: Number(tableNumber),
        totalAmount,
        paymentMethod,
        items: items.map((i) => ({
          menuItem: i.menuItem._id,
          quantity: i.quantity,
        })),
      };

      const res = await API.post("/orders", payload);
      addOrderToHistory(res.data._id);
      clearCart();
      setMessage("Order placed successfully! Track it below.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 sticky-top" style={{ top: '80px' }}>
      <div className="card-body">
        <h5 className="card-title fw-bold mb-3">Your Order</h5>
        <div className="mb-2">
          <label className="form-label small fw-bold mb-1">Name</label>
          <input
            className="form-control form-control-sm"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        <div className="mb-3">
          <label className="form-label small fw-bold mb-1">Table</label>
          <input
            type="number"
            className="form-control form-control-sm"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="No."
          />
        </div>

        <ul className="list-group mb-3">
          {items.map((i) => (
            <li key={i.menuItem._id} className="list-group-item d-flex justify-content-between align-items-center p-2 border-0 border-bottom">
              <div className="small">
                <div className="fw-semibold">{i.menuItem.name}</div>
                <div className="text-muted">₹ {i.menuItem.price} x {i.quantity}</div>
              </div>
              <button className="btn btn-sm text-danger" onClick={() => removeItem(i.menuItem._id)}>✕</button>
            </li>
          ))}
        </ul>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="fw-bold">Total:</span>
          <span className="fw-bold text-success h5 mb-0">₹ {totalAmount}</span>
        </div>
        {message && <div className="alert alert-info py-2 small mb-3">{message}</div>}
        <button
          className="btn btn-success w-100 fw-bold py-2"
          onClick={submitOrder}
          disabled={submitting || items.length === 0}
        >
          {submitting ? "Placing..." : "Place Order"}
        </button>
      </div>
    </div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div id="hero" className="background">
        <div id="hero-content">
          <h1>Mystical Wanderers</h1>
          <h3>Quality and Tasty Food Point</h3>
          <button onClick={() => navigate("/menu")}>View Menu</button>
        </div>
      </div>
      <UserOrderTracking />
    </div>
  );
};

const MenuPage = () => {
  return (
    <div className="menu-page-wrapper">
      <div className="container py-4">
        <div className="row g-4">
          <div className="col-lg-8">
            <MenuView />
            <UserOrderTracking />
          </div>
          <div className="col-lg-4">
            <CartView />
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/orders?t=${new Date().getTime()}`);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await API.patch(`/orders/${orderId}/status`, { status });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status } : o));
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  const updatePaymentStatus = async (orderId, paymentStatus) => {
    try {
      await API.patch(`/orders/${orderId}/payment`, { paymentStatus });
      setOrders(orders.map(o => o._id === orderId ? { ...o, paymentStatus } : o));
    } catch (err) {
      console.error(err);
      alert("Failed to update payment status.");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "accepted": return "bg-primary";
      case "rejected": return "bg-danger";
      case "finished": return "bg-success";
      case "out_of_stock": return "bg-dark";
      default: return "bg-warning text-dark";
    }
  };

  return (
    <div className="admin-page-wrapper py-5">
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="admin-title">Order Dashboard</h2>
          <button className="btn btn-outline-dark btn-sm" onClick={loadOrders}>Refresh</button>
        </div>

        <div className="row g-4">
          {orders.map((order) => (
            <div className="col-lg-6 col-xl-4" key={order._id}>
              <div className="card h-100 shadow-sm border-0 order-card">
                <div className="card-header bg-white border-0 pt-3 px-3">
                  <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <div className="card-body">
                  <h5 className="mb-1">{order.customerName} (Table {order.tableNumber})</h5>
                  <div className="order-items-list my-3">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="small mb-1 border-bottom pb-1 d-flex justify-content-between">
                        <span>{it.menuItem?.name} x{it.quantity}</span>
                        <span>₹{(it.menuItem?.price || 0) * it.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="d-flex justify-content-between fw-bold">
                    <span>Total</span>
                    <span className="text-success">₹{order.totalAmount}</span>
                  </div>
                </div>
                <div className="card-footer bg-light border-0 p-3">
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex gap-2">
                      {order.status === "pending" && (
                        <>
                          <button className="btn btn-primary btn-sm flex-grow-1" onClick={() => updateStatus(order._id, "accepted")}>Accept</button>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => updateStatus(order._id, "rejected")}>Reject</button>
                        </>
                      )}
                      {order.status === "accepted" && (
                        <button className="btn btn-success btn-sm w-100" onClick={() => updateStatus(order._id, "finished")}>Mark Finished</button>
                      )}
                    </div>
                    {order.paymentStatus === "pending" && (
                      <button className="btn btn-warning btn-sm w-100" onClick={() => updatePaymentStatus(order._id, "completed")}>Confirm Payment</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<RoleSelectionPage />} />
        <Route path="/role-select" element={<RoleSelectionPage />} />
        <Route path="/home" element={<Layout><HomePage /></Layout>} />
        <Route path="/menu" element={<Layout><MenuPage /></Layout>} />
        <Route path="/login" element={<Layout><LoginPage /></Layout>} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <Layout><AdminPage /></Layout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </CartProvider>
  );
};

export default App;
