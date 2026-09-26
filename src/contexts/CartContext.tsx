import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types/products';
import { supabase } from '../lib/supabaseClient';

export interface PlayerAttributes {
  username?: string;
  phone?: string;
  id?: string;
  social?: string;
  [key: string]: any;
}

export interface CartItem extends Product {
  quantity: number;
  customerData?: {
    player_id?: string;
    player_username?: string;
    player_social?: string;
    player_phone?: string;
  };
  attributes?: PlayerAttributes;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (
    product: Product, 
    quantity?: number, 
    customerData?: CartItem['customerData'],
    attributes?: PlayerAttributes
  ) => void;
  removeItem: (productId: string, attributes?: PlayerAttributes) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  appliedCoupon: Coupon | null;
  totalItems: number;
  totalPrice: number;
  discountAmount: number;
  shippingFee: number;
  finalPrice: number;
  isCartDrawerOpen?: boolean;
  openCartDrawer?: () => void;
  closeCartDrawer?: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    const saved = localStorage.getItem('coupon');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [shippingSettings, setShippingSettings] = useState({
    shipping_fee: 0,
    is_shipping_free: false,
    free_shipping_threshold: 0
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const openCartDrawer = () => setIsCartDrawerOpen(true);
  const closeCartDrawer = () => setIsCartDrawerOpen(false);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);
  
  useEffect(() => {
    fetchShippingSettings();
  }, []);

  const fetchShippingSettings = async () => {
    try {
      const { data, error } = await supabase.from('settings').select('shipping_fee, is_shipping_free, free_shipping_threshold').single();
      if (data) {
        setShippingSettings({
          shipping_fee: data.shipping_fee || 0,
          is_shipping_free: data.is_shipping_free || false,
          free_shipping_threshold: data.free_shipping_threshold || 0
        });
      }
    } catch (error) {
      console.error('Error fetching shipping settings:', error);
    }
  };

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('coupon');
    }
  }, [appliedCoupon]);

  const addItem = (
    product: Product, 
    quantity = 1, 
    customerData?: CartItem['customerData'],
    attributes?: PlayerAttributes
  ) => {
    const finalAttributes: PlayerAttributes = attributes || {
      username: customerData?.player_username,
      phone: customerData?.player_phone,
      id: customerData?.player_id,
      social: customerData?.player_social,
    };

    const finalCustomerData: CartItem['customerData'] = customerData || {
      player_username: finalAttributes.username,
      player_phone: finalAttributes.phone,
      player_id: finalAttributes.id,
      player_social: finalAttributes.social,
    };

    setItems(currentItems => {
      const itemIndex = currentItems.findIndex(item => 
        item.id === product.id && 
        JSON.stringify(item.attributes || item.customerData) === JSON.stringify(finalAttributes || finalCustomerData)
      );

      if (itemIndex > -1) {
        const newItems = [...currentItems];
        newItems[itemIndex].quantity += quantity;
        return newItems;
      }

      return [...currentItems, { 
        ...product, 
        quantity, 
        customerData: finalCustomerData,
        attributes: finalAttributes 
      }];
    });
  };

  const removeItem = (productId: string, attributes?: PlayerAttributes) => {
    setItems(currentItems => {
      if (attributes) {
        return currentItems.filter(item => 
          !(item.id === productId && JSON.stringify(item.attributes || item.customerData) === JSON.stringify(attributes))
        );
      }
      return currentItems.filter(item => item.id !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems(currentItems => 
      currentItems.map(item => 
        item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (coupon: Coupon) => setAppliedCoupon(coupon);
  const removeCoupon = () => setAppliedCoupon(null);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let shippingFee = 0;
  if (!shippingSettings.is_shipping_free) {
    if (shippingSettings.free_shipping_threshold > 0 && totalPrice >= shippingSettings.free_shipping_threshold) {
      shippingFee = 0;
    } else {
      shippingFee = shippingSettings.shipping_fee;
    }
  }

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = totalPrice * (appliedCoupon.discount_value / 100);
    } else {
      discountAmount = appliedCoupon.discount_value;
    }
  }

  const finalPrice = Math.max(0, totalPrice - discountAmount + shippingFee);

  return (
    <CartContext.Provider value={{ 
      items, 
      addItem, 
      removeItem, 
      updateQuantity, 
      clearCart, 
      applyCoupon,
      removeCoupon,
      appliedCoupon,
      totalItems, 
      totalPrice,
      discountAmount,
      shippingFee,
      finalPrice,
      isCartDrawerOpen,
      openCartDrawer,
      closeCartDrawer
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
