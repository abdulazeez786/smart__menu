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
            <input className="form-control" value={id} onChange={(e) => setId(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-bold">Password</label>
            <input type="password" className="form-control" value={pass} onChange={(e) => setPass(e.target.value)} required />
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

  const fetchMyOrders = async () => {
    if (userOrders.length === 0) return;
    try {
      const res = await API.get(`/orders?t=${new Date().getTime()}`);
      setOrders(res.data.filter(o => userOrders.includes(o._id)));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchMyOrders();
    const interval = setInterval(fetchMyOrders, 10000);
    return () => clearInterval(interval);
  }, [userOrders]);

  if (userOrders.length === 0) return null;

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow-sm p-4 rounded-4 bg-white border-0">
        <h4 className="fw-bold mb-4">Your Active Orders</h4>
        <div className="row g-3">
          {orders.map((o) => (
            <div className="col-12" key={o._id}>
              <div className="p-3 rounded-3 border bg-light d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-bold">Table {o.tableNumber} - {o.customerName}</div>
                  <div className="small text-muted">{o.items.map(i => i.menuItem?.name).join(", ")}</div>
                </div>
                <div className="text-end">
                  <span className={`badge ${o.status === 'finished' ? 'bg-success' : 'bg-primary'}`}>
                    {o.status.toUpperCase()}
                  </span>
                  <div className="small mt-1 text-muted">Payment: {o.paymentStatus.toUpperCase()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MenuView = ({ isAdmin = false, toggleAvailability = null }) => {
  const [activeCategory, setActiveCategory] = useState("tiffin");
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await API.get("/menu", { params: { category: activeCategory, _t: new Date().getTime() } });
      setMenuItems(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [activeCategory]);

  return (
    <div className="row">
      <div className="col-12 mb-4">
        <div className="btn-group flex-wrap">
          {categories.map((cat) => (
            <button key={cat.id} className={`btn category-btn ${activeCategory === cat.id ? "active" : ""}`} onClick={() => setActiveCategory(cat.id)}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div className="col-12">
        {loading ? <p className="text-center py-5">Loading...</p> : (
          <div className="row g-3">
            {menuItems.map((item) => (
              <div className="col-md-4" key={item._id}>
                <div className={`card h-100 shadow-sm border-0 rounded-3 ${!item.isAvailable ? 'opacity-75 grayscale' : ''}`}>
                  <div className="card-body d-flex flex-column">
                    <h6 className="card-title fw-bold">{item.name}</h6>
                    <p className="extra-small text-muted">{item.description}</p>
                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-success">₹{item.price}</span>
                      {isAdmin ? (
                        <button className={`btn btn-sm ${item.isAvailable ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleAvailability(item._id, item.isAvailable)}>
                          {item.isAvailable ? "Mark Unavailable" : "Mark Available"}
                        </button>
                      ) : (
                        <button className="btn btn-sm btn-primary rounded-pill" onClick={() => addItem(item)} disabled={!item.isAvailable}>
                          {item.isAvailable ? "Add" : "Sold Out"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PaymentGatewayModal = ({ total, onPaymentSuccess, onCancel }) => {
  const [method, setMethod] = useState("qr");
  const [processing, setProcessing] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [cardData, setCardData] = useState({ number: "", holder: "", type: "Visa" });

  const handleFinalPay = () => {
    if (method === 'card' && (!cardData.number || !cardData.holder)) {
      alert("Please fill card details");
      return;
    }
    setProcessing(true);
    // Automatic Razorpay Simulation
    setTimeout(() => {
      setProcessing(false);
      onPaymentSuccess(method, method === 'card' ? cardData : null);
    }, 2500);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header bg-primary text-white border-0 rounded-top-4">
            <h5 className="modal-title fw-bold">Checkout - Razorpay</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel}></button>
          </div>
          <div className="modal-body p-4">
            <div className="text-center mb-4">
              <span className="text-muted d-block small">PAYABLE AMOUNT</span>
              <h2 className="fw-bold text-primary">₹{total}</h2>
            </div>

            <div className="nav nav-pills nav-fill mb-4 bg-light p-1 rounded-pill">
              {['qr', 'card', 'cash'].map(m => (
                <button key={m} className={`nav-link rounded-pill py-2 small ${method === m ? 'active' : ''}`} onClick={() => {setMethod(m); setQrScanned(false);}}>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>

            {method === 'qr' && (
              <div className="text-center py-3">
                <div className="p-3 bg-white border rounded-4 d-inline-block mb-3">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=pay_mystical_wanderers_${total}`} alt="QR" />
                </div>
                <p className="small text-muted mb-3">Scan the QR code to pay using any UPI app</p>
                {!qrScanned ? (
                  <button className="btn btn-outline-primary btn-sm rounded-pill" onClick={() => setQrScanned(true)}>Click after Scanning</button>
                ) : (
                  <div className="text-success fw-bold">✓ QR Scanned Successfully!</div>
                )}
              </div>
            )}

            {method === 'card' && (
              <div className="bg-light p-3 rounded-4">
                <div className="mb-3">
                  <label className="extra-small fw-bold text-muted">CARD NUMBER</label>
                  <input className="form-control" placeholder="1234 5678 9101 1121" value={cardData.number} onChange={e => setCardData({...cardData, number: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="extra-small fw-bold text-muted">CARD HOLDER</label>
                  <input className="form-control" placeholder="FULL NAME" value={cardData.holder} onChange={e => setCardData({...cardData, holder: e.target.value})} />
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="extra-small fw-bold text-muted">CARD TYPE</label>
                    <select className="form-select" value={cardData.type} onChange={e => setCardData({...cardData, type: e.target.value})}>
                      <option>Visa</option><option>MasterCard</option><option>Rupay</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="extra-small fw-bold text-muted">CVV</label>
                    <input className="form-control" type="password" placeholder="***" maxLength="3" />
                  </div>
                </div>
              </div>
            )}

            {method === 'cash' && (
              <div className="text-center py-4 bg-light rounded-4">
                <p className="mb-0">Please pay at the counter or to the server.</p>
                <small className="text-muted">Order will be processed after confirmation.</small>
              </div>
            )}

            <button 
              className="btn btn-primary btn-lg w-100 mt-4 rounded-pill fw-bold shadow-sm" 
              onClick={handleFinalPay}
              disabled={processing || (method === 'qr' && !qrScanned)}
            >
              {processing ? (
                <span><span className="spinner-border spinner-border-sm me-2"></span>Processing...</span>
              ) : `Pay Now ₹${total}`}
            </button>
          </div>
          <div className="modal-footer border-0 justify-content-center bg-light rounded-bottom-4">
            <small className="text-muted ls-1">POWERED BY <b>RAZORPAY</b></small>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartView = () => {
  const { customerName, setCustomerName, tableNumber, setTableNumber, items, clearCart, totalAmount, addOrderToHistory } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [showGateway, setShowGateway] = useState(false);

  const onPaymentComplete = async (method, cardDetails) => {
    setShowGateway(false);
    setSubmitting(true);
    try {
      const payload = {
        customerName,
        tableNumber: Number(tableNumber),
        totalAmount,
        paymentMethod: method,
        paymentStatus: method === 'cash' ? 'pending' : 'completed',
        items: items.map(i => ({ menuItem: i.menuItem._id, quantity: i.quantity })),
        cardDetails: method === 'card' ? { cardType: cardDetails.type, cardNumber: cardDetails.number, cardHolder: cardDetails.holder } : undefined
      };
      const res = await API.post("/orders", payload);
      addOrderToHistory(res.data._id);
      clearCart();
      setMessage("Success! Order placed and payment recorded.");
    } catch (err) {
      console.error(err);
      setMessage("Order Failed. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {showGateway && <PaymentGatewayModal total={totalAmount} onCancel={() => setShowGateway(false)} onPaymentSuccess={onPaymentComplete} />}
      <div className="card shadow-sm border-0 sticky-top" style={{ top: '80px' }}>
        <div className="card-body">
          <h5 className="card-title fw-bold mb-3">Your Order</h5>
          <input className="form-control form-control-sm mb-2" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Your Name" />
          <input className="form-control form-control-sm mb-3" type="number" value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="Table No." />
          <ul className="list-group list-group-flush mb-3">
            {items.map(i => (
              <li key={i.menuItem._id} className="list-group-item px-0 d-flex justify-content-between small">
                <span>{i.menuItem.name} x{i.quantity}</span>
                <span>₹{i.menuItem.price * i.quantity}</span>
              </li>
            ))}
          </ul>
          <div className="d-flex justify-content-between fw-bold mb-3"><span>Total</span><span className="text-success">₹{totalAmount}</span></div>
          {message && <div className="alert alert-info py-2 small">{message}</div>}
          <button className="btn btn-success w-100 fw-bold rounded-pill" onClick={() => setShowGateway(true)} disabled={items.length === 0 || submitting}>
            {submitting ? "Placing Order..." : "Proceed to Pay"}
          </button>
        </div>
      </div>
    </>
  );
};

const AdminPage = () => {
  const [orders, setOrders] = useState([]);
  const [view, setView] = useState("orders");

  const loadOrders = async () => {
    try {
      const res = await API.get(`/orders?t=${new Date().getTime()}`);
      setOrders(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => { if (view === 'orders') loadOrders(); }, 15000);
    return () => clearInterval(interval);
  }, [view]);

  const toggleAvailability = async (id, current) => {
    try {
      await API.patch(`/menu/${id}/availability`, { isAvailable: !current });
      alert("Updated availability!");
    } catch (err) { console.error(err); }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.patch(`/orders/${id}/status`, { status });
      loadOrders();
    } catch (err) { console.error(err); }
  };

  const confirmPayment = async (id) => {
    try {
      await API.patch(`/orders/${id}/payment`, { paymentStatus: 'completed' });
      loadOrders();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0">{view === 'orders' ? 'Live Orders' : 'Menu Management'}</h2>
        <div className="btn-group shadow-sm rounded-pill overflow-hidden">
          <button className={`btn ${view === 'orders' ? 'btn-dark' : 'btn-white'}`} onClick={() => setView('orders')}>Orders</button>
          <button className={`btn ${view === 'menu' ? 'btn-dark' : 'btn-white'}`} onClick={() => setView('menu')}>Menu</button>
        </div>
      </div>

      {view === 'menu' ? (
        <MenuView isAdmin={true} toggleAvailability={toggleAvailability} />
      ) : (
        <div className="row g-3">
          {orders.map(o => (
            <div className="col-md-4" key={o._id}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 pt-3 d-flex justify-content-between">
                  <span className="badge bg-primary">TABLE {o.tableNumber}</span>
                  <span className={`badge ${o.paymentStatus === 'completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                    {o.paymentStatus.toUpperCase()}
                  </span>
                </div>
                <div className="card-body">
                  <h5 className="fw-bold">{o.customerName}</h5>
                  <div className="small text-muted mb-3">Placed: {new Date(o.createdAt).toLocaleTimeString()}</div>
                  <ul className="list-group list-group-flush mb-3">
                    {o.items.map((it, idx) => (
                      <li key={idx} className="list-group-item px-0 d-flex justify-content-between small">
                        <span>{it.menuItem?.name} x{it.quantity}</span>
                        <span>₹{it.menuItem?.price * it.quantity}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="d-flex justify-content-between fw-bold mb-3"><span>Total</span><span className="text-success">₹{o.totalAmount}</span></div>
                  {o.paymentMethod === 'card' && o.cardDetails && (
                    <div className="extra-small bg-light p-2 rounded mb-3 border">
                      <b>CARD:</b> {o.cardDetails.cardNumber} <br/> <b>HOLDER:</b> {o.cardDetails.cardHolder} ({o.cardDetails.cardType})
                    </div>
                  )}
                  <div className="d-grid gap-2">
                    {o.status === 'pending' && <button className="btn btn-sm btn-primary" onClick={() => updateStatus(o._id, 'accepted')}>Accept Order</button>}
                    {o.status === 'accepted' && <button className="btn btn-sm btn-success" onClick={() => updateStatus(o._id, 'finished')}>Finish/Serve</button>}
                    {o.paymentStatus === 'pending' && <button className="btn btn-sm btn-outline-success" onClick={() => confirmPayment(o._id)}>Confirm Payment Recvd</button>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MenuPage = () => (
  <div className="menu-page-wrapper py-4">
    <div className="container">
      <div className="row g-4">
        <div className="col-lg-8"><MenuView /><UserOrderTracking /></div>
        <div className="col-lg-4"><CartView /></div>
      </div>
    </div>
  </div>
);

const App = () => (
  <CartProvider>
    <Routes>
      <Route path="/" element={<RoleSelectionPage />} />
      <Route path="/role-select" element={<RoleSelectionPage />} />
      <Route path="/menu" element={<Layout><MenuPage /></Layout>} />
      <Route path="/login" element={<Layout><LoginPage /></Layout>} />
      <Route path="/admin" element={<ProtectedRoute><Layout><AdminPage /></Layout></ProtectedRoute>} />
    </Routes>
  </CartProvider>
);

export default App;
