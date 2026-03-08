import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../../services/api';
import { toast } from 'react-toastify';

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const res = await cartAPI.getCart();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const addToCart = createAsyncThunk('cart/addToCart', async (data, { rejectWithValue }) => {
  try {
    const res = await cartAPI.addToCart(data);
    toast.success('Added to cart!');
    return res.data;
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to add');
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateCartItem = createAsyncThunk('cart/updateCartItem', async ({ itemId, quantity }, { rejectWithValue }) => {
  try {
    const res = await cartAPI.updateCartItem(itemId, { quantity });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (itemId, { rejectWithValue }) => {
  try {
    const res = await cartAPI.removeFromCart(itemId);
    toast.success('Removed from cart');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const clearCart = createAsyncThunk('cart/clearCart', async (_, { rejectWithValue }) => {
  try {
    await cartAPI.clearCart();
    return { items: [] };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: { cart: null, loading: false, error: null },
  reducers: {
    clearCartLocal: (state) => { state.cart = null; },
  },
  extraReducers: (builder) => {
    [fetchCart, addToCart, updateCartItem, removeFromCart, clearCart].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => { state.loading = true; })
        .addCase(thunk.fulfilled, (state, action) => { state.loading = false; state.cart = action.payload; })
        .addCase(thunk.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
    });
  },
});

export const { clearCartLocal } = cartSlice.actions;
export default cartSlice.reducer;
