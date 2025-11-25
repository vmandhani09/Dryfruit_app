"use client";

import { useState, useEffect, useCallback } from "react";
import { CartItem, Product } from "@/types";

interface LocalCartItem {
  productId: string;
  weight: string;
  quantity: number;
}

/* ----------------------------------------------
 🟢 Deduplicate items (same productId + weight)
---------------------------------------------- */
function dedupeCart(items: LocalCartItem[]) {
  const map: Record<string, LocalCartItem> = {};

  for (const item of items) {
    const key = `${item.productId}-${item.weight}`;
    if (!map[key]) {
      map[key] = { ...item };
    } else {
      map[key].quantity += item.quantity;
    }
  }
  return Object.values(map);
}

export function useCart() {
  const [cart, setCart] = useState<(CartItem & { product: Product | null })[]>([]);
  const [loading, setLoading] = useState(true);

  /* ----------------------------------------------
   Helpers
  ---------------------------------------------- */
  const getLocalCart = (): LocalCartItem[] => {
    try {
      return JSON.parse(localStorage.getItem("guestCart") || "[]");
    } catch {
      return [];
    }
  };

  const setLocalCart = (items: LocalCartItem[]) => {
    localStorage.setItem("guestCart", JSON.stringify(items));
  };

  /* ----------------------------------------------
   Fetch product details for cart items
  ---------------------------------------------- */
  const fetchProductDetails = async (items: any[]) => {
    if (!items.length) return [];

    const ids = [...new Set(items.map((item) => item.productId))];

    try {
      const res = await fetch("/api/products/by-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });

      const data = await res.json();
      const products = Array.isArray(data.products) ? data.products : [];

      return items.map((item) => ({
        ...item,
        product: products.find((p: Product) => p._id === item.productId) || null,
      }));
    } catch (err) {
      console.error("Product fetch error:", err);
      return items.map((item) => ({ ...item, product: null }));
    }
  };

  /* ----------------------------------------------
   SYNC ONLY ONCE after login/register
  ---------------------------------------------- */
  const syncLocalCartToDB = async (token: string) => {
    const alreadySynced = localStorage.getItem("cartSynced");

    if (alreadySynced === "true") return; // <-- Prevent double sync

    const localCart = getLocalCart();
    if (!localCart.length) {
      localStorage.setItem("cartSynced", "true");
      return;
    }

    try {
      for (const item of localCart) {
        await fetch("/api/user/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: item.productId,
            weight: item.weight,
            quantity: item.quantity,
          }),
        });
      }

      // Clear guest cart & mark as synced
      setLocalCart([]);
      localStorage.setItem("cartSynced", "true");

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Sync failed:", err);
    }
  };

  /* ----------------------------------------------
   MAIN FETCH CART FUNCTION
   IMPORTANT: Does NOT sync inside fetchCart.
  ---------------------------------------------- */
  const fetchCart = useCallback(async () => {
    setLoading(true);

    const token = localStorage.getItem("userToken");

    if (token) {
      // First, deduplicate cart items in DB
      try {
        await fetch("/api/user/cart/dedupe", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Dedupe error:", err);
      }

      const res = await fetch("/api/user/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { cart: dbCart } = await res.json();

      const items = Array.isArray(dbCart)
        ? dbCart.map((item: any) => ({
            productId: item.productId,
            weight: item.weight,
            quantity: item.quantity,
          }))
        : [];

      // Deduplicate DB cart items (same productId + weight) - extra safety
      const dedupedItems = dedupeCart(items);
      const merged = await fetchProductDetails(dedupedItems);
      setCart(merged);
    } else {
      let localCart = dedupeCart(getLocalCart());
      const merged = await fetchProductDetails(localCart);
      setCart(merged);
    }

    setLoading(false);
  }, []);

  /* ----------------------------------------------
   INIT
  ---------------------------------------------- */
  useEffect(() => {
    fetchCart();
    window.addEventListener("cartUpdated", fetchCart);
    return () => window.removeEventListener("cartUpdated", fetchCart);
  }, [fetchCart]);

  /* ----------------------------------------------
   ADD TO CART (Guest + Logged-in)
  ---------------------------------------------- */
  const addToCart = async (productId: string, weight: string, quantity = 1) => {
    const token = localStorage.getItem("userToken");

    if (token) {
      // DB cart update
      await fetch("/api/user/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, weight, quantity }),
      });
    } else {
      // Guest cart update
      let localCart = getLocalCart();
      const index = localCart.findIndex(
        (item) => item.productId === productId && item.weight === weight
      );

      if (index !== -1) {
        localCart[index].quantity += quantity;
      } else {
        localCart.push({ productId, weight, quantity });
      }

      localCart = dedupeCart(localCart);
      setLocalCart(localCart);
    }

    window.dispatchEvent(new Event("cartUpdated"));
  };

  /* ----------------------------------------------
   REMOVE ITEM
  ---------------------------------------------- */
  const removeFromCart = async (productId: string, weight: string) => {
    const token = localStorage.getItem("userToken");

    if (token) {
      await fetch("/api/user/cart", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, weight }),
      });
    } else {
      let localCart = getLocalCart().filter(
        (item) => !(item.productId === productId && item.weight === weight)
      );
      setLocalCart(localCart);
    }

    window.dispatchEvent(new Event("cartUpdated"));
  };

  /* ----------------------------------------------
   UPDATE QUANTITY
   ---------------------------------------------- */
  const updateQuantity = async (productId: string, weight: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId && item.weight === weight
          ? { ...item, quantity }
          : item
      )
    );

    const token = localStorage.getItem("userToken");

    if (token) {
      await fetch("/api/user/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, weight, quantity }),
      });
    } else {
      let localCart = getLocalCart().map((item) =>
        item.productId === productId && item.weight === weight
          ? { ...item, quantity }
          : item
      );

      localCart = dedupeCart(localCart);
      setLocalCart(localCart);
    }
  };

  /* ----------------------------------------------
   CLEAR CART
  ---------------------------------------------- */
  const clearCart = async () => {
    const token = localStorage.getItem("userToken");

    if (token) {
      await fetch("/api/user/cart", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      setLocalCart([]);
    }

    window.dispatchEvent(new Event("cartUpdated"));
  };

  /* ----------------------------------------------
   GETTERS
  ---------------------------------------------- */
  const getCartItemsCount = () =>
    cart.reduce((n, item) => n + item.quantity, 0);

  const getCartTotal = () =>
    cart.reduce((total, item) => {
      const price =
        item.product?.weights?.find((w) => w.label === item.weight)?.price || 0;
      return total + price * item.quantity;
    }, 0);

  return {
    cart,
    loading,
    getCartItemsCount,
    syncLocalCartToDB,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
  };
}
