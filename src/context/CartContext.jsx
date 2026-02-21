import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const carrinhoSalvo = localStorage.getItem('floressia_cart');
    return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
  });
  
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    localStorage.setItem('floressia_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems(currItems => {
      const found = currItems.find(item => item.id === product.id);
      if (found) {
        return currItems.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...currItems, { ...product, quantity: 1 }];
    });
    setShowCart(true);
  };

  const decreaseQuantity = (id) => {
    setCartItems(currItems => {
      return currItems.map(item => {
        if (item.id === id) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (id) => {
    setCartItems(currItems => currItems.filter(item => item.id !== id));
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.preco * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, decreaseQuantity, removeFromCart, showCart, setShowCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}