import React, { useEffect, useState, useMemo } from "react";
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

const CHEF_ID = "chef";
const CHEF_PASS = "chef123";
const OWNER_ID = "owner";
const OWNER_PASS = "owner123";

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const isChef = localStorage.getItem("isChefAuthenticated") === "true";
  const isOwner = localStorage.getItem("isOwnerAuthenticated") === "true";

  const handleLogout = () => {
    localStorage.removeItem("isChefAuthenticated");
    localStorage.removeItem("isOwnerAuthenticated");
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
            <Link to="/role-select" className="btn btn-sm btn-outline-danger">Switch Role</Link>
            {(isChef || isOwner) && (
              <button className="btn btn-sm btn-dark" onClick={handleLogout}>Logout</button>
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
        <h1 className="mb-5 fw-bold text-center" style={{ fontSize: '3.5rem', fontFamily: 'cursive', color: 'orangered' }}>Mystical Wanderes</h1>
        <div className="row w-100 justify-content-center g-4" style={{ maxWidth: "900px" }}>
          <div className="col-md-4">
            <div className="card p-4 text-center shadow-lg border-0 h-100 role-card" onClick={() => navigate("/menu")}>
              <div className="display-4 mb-3">🍽️</div>
              <h3 className="fw-bold" style={{ color: 'orangered', fontFamily: 'cursive' }}>Customer</h3>
              <p className="text-muted small">Order delicious food</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-4 text-center shadow-lg border-0 h-100 role-card" onClick={() => navigate("/chef")}>
              <div className="display-4 mb-3">👨‍🍳</div>
              <h3 className="fw-bold" style={{ color: 'orangered', fontFamily: 'cursive' }}>Chef</h3>
              <p className="text-muted small">Manage orders & menu</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-4 text-center shadow-lg border-0 h-100 role-card" onClick={() => navigate("/owner")}>
              <div className="display-4 mb-3">💰</div>
              <h3 className="fw-bold" style={{ color: 'orangered', fontFamily: 'cursive' }}>Owner</h3>
              <p className="text-muted small">Financial summaries</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginPage = ({ type }) => {
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (type === "chef") {
      if (id.trim() === CHEF_ID && pass.trim() === CHEF_PASS) {
        localStorage.setItem("isChefAuthenticated", "true");
        navigate("/chef");
      } else setError("Invalid Chef Credentials");
    } else {
      if (id.trim() === OWNER_ID && pass.trim() === OWNER_PASS) {
        localStorage.setItem("isOwnerAuthenticated", "true");
        navigate("/owner");
      } else setError("Invalid Owner Credentials");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
      <div className="card shadow-sm p-4" style={{ width: "100%", maxWidth: "400px" }}>
        <h3 className="text-center mb-4 text-capitalize">{type} Login</h3>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label small fw-bold">ID</label>
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
                  <span className={`badge ${o.status === 'finished' ? 'bg-success' : 'bg-primary'}`}>{o.status.toUpperCase()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MenuView = ({ isChef = false, toggleAvailability = null }) => {
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
                    <p className="extra-small text-muted" style={{fontSize:'11px'}}>{item.description}</p>
                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-success">₹{item.price}</span>
                      {isChef ? (
                        <button className={`btn btn-sm ${item.isAvailable ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleAvailability(item._id, item.isAvailable)}>
                          {item.isAvailable ? "Disable" : "Enable"}
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
    if (method === 'card' && (!cardData.number || !cardData.holder)) { alert("Please fill card details"); return; }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPaymentSuccess(method, method === 'card' ? cardData : null);
    }, 2000);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header bg-primary text-white border-0 rounded-top-4">
            <h5 className="modal-title fw-bold">Razorpay Checkout</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel}></button>
          </div>
          <div className="modal-body p-4">
            <div className="text-center mb-4">
              <span className="text-muted d-block small">AMOUNT</span>
              <h2 className="fw-bold text-primary">₹{total}</h2>
            </div>
            <div className="nav nav-pills nav-fill mb-4 bg-light p-1 rounded-pill">
              {['qr', 'card', 'cash'].map(m => (
                <button key={m} className={`nav-link rounded-pill py-2 small ${method === m ? 'active' : ''}`} onClick={() => setMethod(m)}>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
            {method === 'qr' && (
              <div className="text-center py-3">
                <div className="p-3 bg-white border rounded-4 d-inline-block mb-3">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=pay_${total}`} alt="QR" />
                </div>
                <p className="small text-muted mb-3">Scan and Pay</p>
                <button className={`btn btn-sm ${qrScanned ? 'btn-success' : 'btn-outline-primary'}`} onClick={() => setQrScanned(true)}>
                  {qrScanned ? "✓ Scanned" : "Click after Scanning"}
                </button>
              </div>
            )}
            {method === 'card' && (
              <div className="bg-light p-3 rounded-4">
                <input className="form-control mb-2" placeholder="Card Number" value={cardData.number} onChange={e => setCardData({...cardData, number: e.target.value})} />
                <input className="form-control mb-2" placeholder="Card Holder Name" value={cardData.holder} onChange={e => setCardData({...cardData, holder: e.target.value})} />
                <select className="form-select" value={cardData.type} onChange={e => setCardData({...cardData, type: e.target.value})}>
                  <option>Visa</option><option>MasterCard</option><option>Rupay</option>
                </select>
              </div>
            )}
            {method === 'cash' && <div className="text-center py-4 bg-light rounded-4">Please pay at counter.</div>}
            <button className="btn btn-primary btn-lg w-100 mt-4 rounded-pill fw-bold" onClick={handleFinalPay} disabled={processing || (method === 'qr' && !qrScanned)}>
              {processing ? "Processing..." : `Pay ₹${total}`}
            </button>
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
      setMessage("Order Placed Successfully!");
    } catch (err) { setMessage("Failed to place order."); } finally { setSubmitting(false); }
  };

  return (
    <>
      {showGateway && <PaymentGatewayModal total={totalAmount} onCancel={() => setShowGateway(false)} onPaymentSuccess={onPaymentComplete} />}
      <div className="card shadow-sm border-0 sticky-top" style={{ top: '80px' }}>
        <div className="card-body">
          <h5 className="card-title fw-bold mb-3">Order Details</h5>
          <div className="mb-2">
            <label className="extra-small fw-bold">Customer Name</label>
            <input className="form-control form-control-sm" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Your Name" />
          </div>
          <div className="mb-3">
            <label className="extra-small fw-bold">Select Table (0-20)</label>
            <select className="form-select form-select-sm" value={tableNumber} onChange={e => setTableNumber(e.target.value)}>
              <option value="">Choose Table</option>
              {[...Array(21).keys()].map(n => <option key={n} value={n}>Table {n}</option>)}
            </select>
          </div>
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
          <button className="btn btn-success w-100 fw-bold rounded-pill" onClick={() => { if(!customerName || !tableNumber) alert("Fill Name and Table!"); else setShowGateway(true); }} disabled={items.length === 0 || submitting}>
            Proceed to Pay
          </button>
        </div>
      </div>
    </>
  );
};

const ChefPage = () => {
  const [orders, setOrders] = useState([]);
  const [view, setView] = useState("orders");

  const loadData = async () => {
    try {
      const res = await API.get(`/orders?t=${new Date().getTime()}`);
      setOrders(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => { if (view === 'orders') loadData(); }, 10000);
    return () => clearInterval(interval);
  }, [view]);

  const updateStatus = async (id, status) => {
    try { await API.patch(`/orders/${id}/status`, { status }); loadData(); } catch (err) { console.error(err); }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">{view === 'orders' ? 'Chef Orders' : 'Menu Management'}</h2>
        <div className="btn-group rounded-pill overflow-hidden shadow-sm">
          <button className={`btn btn-sm ${view === 'orders' ? 'btn-dark' : 'btn-light'}`} onClick={() => setView('orders')}>Orders</button>
          <button className={`btn btn-sm ${view === 'menu' ? 'btn-dark' : 'btn-light'}`} onClick={() => setView('menu')}>Menu</button>
        </div>
      </div>
      {view === 'menu' ? (
        <MenuView isChef={true} toggleAvailability={async (id, current) => { 
          await API.patch(`/menu/${id}/availability`, { isAvailable: !current }); loadData(); 
        }} />
      ) : (
        <div className="row g-3">
          {orders.map(o => (
            <div className="col-md-4" key={o._id}>
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-0 pt-3">
                  <span className="badge bg-primary">TABLE {o.tableNumber}</span>
                </div>
                <div className="card-body">
                  <h5 className="fw-bold">{o.customerName}</h5>
                  <div className="small text-muted mb-2">{o.items.map(i => i.menuItem?.name).join(", ")}</div>
                  <div className="fw-bold text-success mb-3">₹{o.totalAmount}</div>
                  <div className="d-grid gap-2">
                    {o.status === 'pending' && <button className="btn btn-sm btn-primary" onClick={() => updateStatus(o._id, 'accepted')}>Accept</button>}
                    {o.status === 'accepted' && <button className="btn btn-sm btn-success" onClick={() => updateStatus(o._id, 'finished')}>Serve</button>}
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

const OwnerPage = () => {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    const fetch = async () => {
      const res = await API.get("/orders");
      setOrders(res.data);
    };
    fetch();
  }, []);

  const stats = useMemo(() => {
    const total = orders.reduce((s, o) => s + o.totalAmount, 0);
    const cash = orders.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.totalAmount, 0);
    const qr = orders.filter(o => o.paymentMethod === 'qr').reduce((s, o) => s + o.totalAmount, 0);
    const card = orders.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + o.totalAmount, 0);
    return { total, cash, qr, card };
  }, [orders]);

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Owner Financial Summary</h2>
      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="card p-4 shadow-sm border-0 text-white" style={{background: 'linear-gradient(45deg, #11998e, #38ef7d)'}}>
            <h6 className="small fw-bold">TOTAL REVENUE</h6>
            <h2 className="fw-bold">₹{stats.total}</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-4 shadow-sm border-0 bg-white">
            <h6 className="small fw-bold text-muted">CASH PAYMENTS</h6>
            <h2 className="fw-bold text-dark">₹{stats.cash}</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-4 shadow-sm border-0 bg-white">
            <h6 className="small fw-bold text-muted">QR PAYMENTS</h6>
            <h2 className="fw-bold text-primary">₹{stats.qr}</h2>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-4 shadow-sm border-0 bg-white">
            <h6 className="small fw-bold text-muted">CARD PAYMENTS</h6>
            <h2 className="fw-bold text-info">₹{stats.card}</h2>
          </div>
        </div>
      </div>
      <div className="card border-0 shadow-sm p-4">
        <h5 className="fw-bold mb-3">Detailed Transaction History</h5>
        <div className="table-responsive">
          <table className="table small">
            <thead>
              <tr>
                <th>Date</th><th>Customer</th><th>Method</th><th>Status</th><th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>{o.customerName}</td>
                  <td className="text-uppercase">{o.paymentMethod}</td>
                  <td>{o.paymentStatus}</td>
                  <td className="fw-bold">₹{o.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children, type }) => {
  const isChef = localStorage.getItem("isChefAuthenticated") === "true";
  const isOwner = localStorage.getItem("isOwnerAuthenticated") === "true";
  if (type === "chef" && !isChef) return <Navigate to="/login-chef" />;
  if (type === "owner" && !isOwner) return <Navigate to="/login-owner" />;
  return children;
};

const App = () => (
  <CartProvider>
    <Routes>
      <Route path="/" element={<RoleSelectionPage />} />
      <Route path="/role-select" element={<RoleSelectionPage />} />
      <Route path="/menu" element={<Layout><div className="menu-page-wrapper py-4"><div className="container"><div className="row g-4"><div className="col-lg-8"><MenuView /><UserOrderTracking /></div><div className="col-lg-4"><CartView /></div></div></div></div></Layout>} />
      
      <Route path="/chef" element={<ProtectedRoute type="chef"><Layout><ChefPage /></Layout></ProtectedRoute>} />
      <Route path="/owner" element={<ProtectedRoute type="owner"><Layout><OwnerPage /></Layout></ProtectedRoute>} />
      
      <Route path="/login-chef" element={<Layout><LoginPage type="chef" /></Layout>} />
      <Route path="/login-owner" element={<Layout><LoginPage type="owner" /></Layout>} />
      <Route path="/login" element={<Navigate to="/login-chef" />} />
    </Routes>
  </CartProvider>
);

export default App;
