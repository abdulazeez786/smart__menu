import React, { useEffect, useState } from "react";
import axios from "axios";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
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

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const isAdminLoggedIn = localStorage.getItem("isAdminAuthenticated") === "true";

  const handleAdminClick = () => {
    if (isAdminLoggedIn) {
      navigate("/admin");
    } else {
      navigate("/login");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdminAuthenticated");
    navigate("/");
  };

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
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={handleAdminClick}
            >
              Admin
            </button>
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

const OrderTracker = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPublicOrders = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/orders?t=${new Date().getTime()}`); // Cache busting
      const activeOrders = res.data.filter(o => 
        o.status === "pending" || 
        o.status === "accepted" || 
        o.status === "out_of_stock"
      ).slice(0, 10);
      setOrders(activeOrders);
    } catch (err) {
      console.error("Failed to fetch public orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicOrders();
    const interval = setInterval(fetchPublicOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  if (orders.length === 0 && !loading) return null;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'accepted': return { color: '#0d6efd', fontWeight: 'bold' };
      case 'out_of_stock': return { color: '#dc3545', fontWeight: 'bold' };
      default: return { color: '#ffc107', fontWeight: 'bold' };
    }
  };

  return (
    <div className="container my-5">
      <div className="order-tracker-card p-4 shadow-sm rounded-4 bg-white border">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold mb-0" style={{ color: '#2c3e50' }}>Live Orders</h4>
          <span className="badge bg-success rounded-pill px-3 py-2">LIVE TRACKING</span>
        </div>
        
        <div className="row g-3">
          {orders.map((o) => (
            <div className="col-12 col-md-6 col-lg-4" key={o._id}>
              <div className="p-3 rounded-3 border-start border-4 bg-light shadow-xs" 
                   style={{ borderLeftColor: getStatusStyle(o.status).color }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="small text-muted text-uppercase fw-bold ls-1">Table #{o.tableNumber}</div>
                    <div className="h6 fw-bold mb-0 text-truncate" style={{ maxWidth: '150px' }}>{o.customerName}</div>
                  </div>
                  <div className="text-end">
                    <div className="small text-muted mb-1">STATUS</div>
                    <div style={getStatusStyle(o.status)}>
                      {o.status === 'out_of_stock' ? 'OUT OF STOCK' : o.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {loading && <div className="text-center mt-3"><div className="spinner-border spinner-border-sm text-secondary"></div></div>}
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
      // Added timestamp to force fresh API call every time
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
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    className="card-img-top"
                    alt={item.name}
                    style={{ height: '180px', objectFit: 'cover' }}
                  />
                )}
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
          {!loading && !error && menuItems.length === 0 && (
            <div className="text-center py-5">
              <p className="text-muted">No dishes found matching your criteria.</p>
            </div>
          )}
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
  } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  
  const [cardDetails, setCardDetails] = useState({
    cardType: "Visa",
    cardNumber: "",
    cardHolder: "",
  });

  const handleCardChange = (e) => {
    setCardDetails({ ...cardDetails, [e.target.name]: e.target.value });
  };

  const submitOrder = async () => {
    if (!customerName || !tableNumber || items.length === 0) {
      setMessage("Please fill details and add at least one item.");
      return;
    }

    if (paymentMethod === "card" && (!cardDetails.cardNumber || !cardDetails.cardHolder)) {
      setMessage("Please fill in card details.");
      return;
    }

    const confirmed = window.confirm(
      `Confirm order for ₹${totalAmount} using ${paymentMethod.toUpperCase()}?`
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      setMessage("");
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

      if (paymentMethod === "card") {
        payload.cardDetails = cardDetails;
      }

      await API.post("/orders", payload);
      clearCart();
      
      if (paymentMethod === "qr") {
        setMessage("Order placed successfully! Please wait for your order.");
      } else {
        setMessage("Order placed successfully!");
      }

      setCardDetails({ cardType: "Visa", cardNumber: "", cardHolder: "" });
      
    } catch (err) {
      console.error(err);
      setMessage("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card shadow-sm border-0 sticky-top" style={{ top: '80px' }}>
      <div className="card-body">
        <h5 className="card-title fw-bold mb-3">Your Order</h5>
        <div className="mb-3">
          <label className="form-label small fw-bold">Name</label>
          <input
            className="form-control form-control-sm"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        <div className="mb-3">
          <label className="form-label small fw-bold">Table Number</label>
          <input
            type="number"
            className="form-control form-control-sm"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="Enter table number"
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label small fw-bold">Payment Method</label>
          <div className="d-flex gap-2">
            {["cash", "qr", "card"].map((method) => (
              <button
                key={method}
                type="button"
                className={`btn btn-sm flex-grow-1 ${paymentMethod === method ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setPaymentMethod(method)}
              >
                {method.toUpperCase()}
              </button>
            ))}
          </div>
          
          {paymentMethod === "qr" && (
            <div className="mt-2 text-center p-2 bg-light rounded border">
              <small className="text-muted d-block mb-1">Scan to Pay</small>
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Payment_For_SmartMenu" 
                alt="Payment QR"
                style={{ width: '80px', height: '80px' }}
              />
            </div>
          )}

          {paymentMethod === "card" && (
            <div className="mt-2 p-2 bg-light rounded border">
              <div className="mb-2">
                <label className="form-label extra-small fw-bold mb-1">Card Type</label>
                <select 
                  className="form-select form-select-sm" 
                  name="cardType" 
                  value={cardDetails.cardType}
                  onChange={handleCardChange}
                >
                  <option>Visa</option>
                  <option>MasterCard</option>
                  <option>Rupay</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="form-label extra-small fw-bold mb-1">Card Number</label>
                <input 
                  className="form-control form-control-sm" 
                  name="cardNumber"
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={cardDetails.cardNumber}
                  onChange={handleCardChange}
                />
              </div>
              <div className="mb-0">
                <label className="form-label extra-small fw-bold mb-1">Holder Name</label>
                <input 
                  className="form-control form-control-sm" 
                  name="cardHolder"
                  placeholder="Name on card"
                  value={cardDetails.cardHolder}
                  onChange={handleCardChange}
                />
              </div>
            </div>
          )}
        </div>

        <ul className="list-group mb-3">
          {items.map((i) => (
            <li
              key={i.menuItem._id}
              className="list-group-item d-flex justify-content-between align-items-center p-2 border-0 border-bottom"
            >
              <div className="small">
                <div className="fw-semibold">{i.menuItem.name}</div>
                <div className="text-muted">
                  ₹ {i.menuItem.price} x{" "}
                  <input
                    type="number"
                    min="1"
                    value={i.quantity}
                    onChange={(e) =>
                      updateQuantity(
                        i.menuItem._id,
                        Number(e.target.value)
                      )
                    }
                    className="quantity-input"
                    style={{ width: '40px' }}
                  />
                </div>
              </div>
              <button
                className="btn btn-sm text-danger"
                onClick={() => removeItem(i.menuItem._id)}
              >
                ✕
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="list-group-item text-muted small text-center py-3 border-0">
              Your cart is empty.
            </li>
          )}
        </ul>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="fw-bold">Total:</span>
          <span className="fw-bold text-success h5 mb-0">₹ {totalAmount}</span>
        </div>
        {message && <div className={`alert alert-info py-2 small mb-3`}>{message}</div>}
        <button
          className="btn btn-success w-100 fw-bold py-2"
          onClick={submitOrder}
          disabled={submitting || items.length === 0}
        >
          {submitting ? "Placing Order..." : "Place Order & Pay"}
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
      
      <OrderTracker />

      <footer>
        <div className="footer">
          <div className="icon1">
            <h5 className="he">Thank You</h5>
            <div className="icon">
              <img
                src="https://www.wavetransit.com/wp-content/uploads/2021/08/Facebook-logo.png"
                className="im"
              />
              <img
                src="https://i.ytimg.com/vi/LU9zpCZFPJQ/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBIkeTlagG_2bi0U4rfZWfqDciEoQ"
                className="im"
              />
              <img
                src="https://i.pinimg.com/736x/ee/af/9c/eeaf9ce3ab22ecb3904daea1b2eab04a.jpg"
                className="im"
              />
            </div>
          </div>
        </div>
      </footer>
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
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await API.patch(`/orders/${orderId}/status`, { status });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status } : o));
    } catch (err) {
      console.error(err);
      alert("Failed to update order status.");
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
          <button className="btn btn-outline-dark btn-sm" onClick={loadOrders}>
            Refresh Orders
          </button>
        </div>

        {loading && <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}
        {error && <div className="alert alert-danger">{error}</div>}
        
        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-5 bg-white rounded shadow-sm">
            <p className="text-muted">No orders found.</p>
          </div>
        )}

        <div className="row g-4">
          {orders.map((order) => (
            <div className="col-lg-6 col-xl-4" key={order._id}>
              <div className="card h-100 shadow-sm border-0 order-card">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center pt-3 px-3">
                  <div className="d-flex flex-column gap-1">
                    <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status === 'out_of_stock' ? 'OUT OF STOCK' : order.status.toUpperCase()}
                    </span>
                    <span className={`badge ${order.paymentStatus === 'completed' ? 'bg-success' : 'bg-secondary'}`}>
                      PAYMENT: {order.paymentStatus.toUpperCase()}
                    </span>
                  </div>
                  <small className="text-muted">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </small>
                </div>
                <div className="card-body">
                  <h5 className="mb-1">{order.customerName}</h5>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <p className="text-muted mb-0">Table No: <span className="fw-bold text-dark">{order.tableNumber}</span></p>
                    <span className="badge bg-light text-dark border">
                      Method: {order.paymentMethod?.toUpperCase()}
                    </span>
                  </div>
                  
                  {order.paymentMethod === 'card' && order.cardDetails && (
                    <div className="card-details-mini mb-3 p-2 bg-light rounded border small">
                      <div className="fw-bold border-bottom mb-1 pb-1">Card Details</div>
                      <div>Type: {order.cardDetails.cardType}</div>
                      <div>Holder: {order.cardDetails.cardHolder}</div>
                      <div>No: {order.cardDetails.cardNumber.replace(/\d(?=\d{4})/g, "*")}</div>
                    </div>
                  )}
                  
                  <div className="order-items-list mb-3">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="d-flex justify-content-between small mb-1 border-bottom pb-1">
                        <span>{it.menuItem?.name || "Item"} x {it.quantity}</span>
                        <span>₹{(it.menuItem?.price || 0) * it.quantity}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="fw-bold">Total Amount</span>
                    <span className="h5 mb-0 text-success fw-bold">₹{order.totalAmount}</span>
                  </div>
                </div>
                <div className="card-footer bg-light border-0 p-3">
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex gap-2">
                      {order.status === "pending" && (
                        <>
                          <button 
                            className="btn btn-primary btn-sm flex-grow-1"
                            onClick={() => updateStatus(order._id, "accepted")}
                          >
                            Accept
                          </button>
                          <button 
                            className="btn btn-outline-danger btn-sm flex-grow-1"
                            onClick={() => updateStatus(order._id, "rejected")}
                          >
                            Reject
                          </button>
                          <button 
                            className="btn btn-danger btn-sm flex-grow-1"
                            onClick={() => updateStatus(order._id, "out_of_stock")}
                          >
                            Out of Stock
                          </button>
                        </>
                      )}
                      {order.status === "accepted" && (
                        <button 
                          className="btn btn-success btn-sm w-100"
                          onClick={() => updateStatus(order._id, "finished")}
                        >
                          Mark Finished
                        </button>
                      )}
                      {order.status === "out_of_stock" && (
                        <button className="btn btn-dark btn-sm w-100" disabled>
                          Cancelled (Out of Stock)
                        </button>
                      )}
                      {order.status === "rejected" && (
                        <button className="btn btn-outline-danger btn-sm w-100" disabled>
                          Rejected
                        </button>
                      )}
                    </div>
                    
                    {order.paymentStatus === "pending" ? (
                      <button 
                        className="btn btn-warning btn-sm w-100"
                        onClick={() => updatePaymentStatus(order._id, "completed")}
                      >
                        Confirm Payment Received
                      </button>
                    ) : (
                      <button className="btn btn-outline-success btn-sm w-100" disabled>
                        ✓ Paid
                      </button>
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
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Layout>
    </CartProvider>
  );
};

export default App;
