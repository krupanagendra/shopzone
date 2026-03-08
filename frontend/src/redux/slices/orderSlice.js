import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import API from '../../services/api'

export const createOrder = createAsyncThunk('orders/createOrder', async (orderData, { rejectWithValue }) => {
  try {
    const res = await API.post('/api/orders', orderData)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create order')
  }
})

export const fetchMyOrders = createAsyncThunk('orders/fetchMyOrders', async (_, { rejectWithValue }) => {
  try {
    const res = await API.get('/api/orders/myorders')
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message)
  }
})

export const fetchOrderById = createAsyncThunk('orders/fetchOrderById', async (id, { rejectWithValue }) => {
  try {
    const res = await API.get(`/api/orders/${id}`)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message)
  }
})

export const fetchAllOrders = createAsyncThunk('orders/fetchAllOrders', async (params, { rejectWithValue }) => {
  try {
    const res = await API.get('/api/orders', { params })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message)
  }
})

export const updateOrderStatus = createAsyncThunk('orders/updateOrderStatus', async ({ id, status }, { rejectWithValue }) => {
  try {
    const res = await API.put(`/api/orders/${id}/status`, { status })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message)
  }
})

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    order: null,
    adminOrders: [],
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearSuccess: (state) => { state.success = false },
    clearError: (state) => { state.error = null },
    clearOrder: (state) => { state.order = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => { state.loading = true; state.error = null; state.success = false })
      .addCase(createOrder.fulfilled, (state, action) => { state.loading = false; state.order = action.payload; state.success = true })
      .addCase(createOrder.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(fetchMyOrders.pending, (state) => { state.loading = true })
      .addCase(fetchMyOrders.fulfilled, (state, action) => { state.loading = false; state.orders = action.payload })
      .addCase(fetchMyOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(fetchOrderById.pending, (state) => { state.loading = true })
      .addCase(fetchOrderById.fulfilled, (state, action) => { state.loading = false; state.order = action.payload })
      .addCase(fetchOrderById.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(fetchAllOrders.pending, (state) => { state.loading = true })
      .addCase(fetchAllOrders.fulfilled, (state, action) => { state.loading = false; state.adminOrders = action.payload.orders })
      .addCase(fetchAllOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.adminOrders.findIndex(o => o._id === action.payload._id)
        if (idx !== -1) state.adminOrders[idx] = action.payload
      })
  },
})

export const { clearSuccess, clearError, clearOrder } = orderSlice.actions
export default orderSlice.reducer
