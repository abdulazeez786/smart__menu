import React, { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [items, setItems] = useState([]);

  const addItem = (menuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem._id === menuItem._id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem._id === menuItem._id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i.menuItem._id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.menuItem._id === id ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setPaymentMethod("cash");
  };

  const totalAmount = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + i.menuItem.price * i.quantity,
        0
      ),
    [items]
  );

  const value = {
    customerName,
    setCustomerName,
    tableNumber,
    setTableNumber,
    paymentMethod,
    setPaymentMethod,
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalAmount,
  };

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
