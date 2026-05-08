import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [], coupon: null },
  reducers: {
    addToCart(state, action) {
      const item = state.items.find(
        (i) => i.productId === action.payload.productId,
      );
      if (item) {
        item.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    removeFromCart(state, action) {
      state.items = state.items.filter((i) => i.productId !== action.payload);
    },
    updateQuantity(state, action) {
      const item = state.items.find(
        (i) => i.productId === action.payload.productId,
      );
      if (item) item.quantity = action.payload.quantity;
    },
    applyCoupon(state, action) {
      state.coupon = action.payload;
    },
    removeCoupon(state) {
      state.coupon = null;
    },
    clearCart(state) {
      state.items = [];
      state.coupon = null;
    },
    removePurchasedFromCart(state, action) {
      const ids = action.payload;
      state.items = state.items.filter((i) => !ids.includes(i.productId));
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  applyCoupon,
  removeCoupon,
  clearCart,
  removePurchasedFromCart,
} = cartSlice.actions;
export default cartSlice.reducer;
