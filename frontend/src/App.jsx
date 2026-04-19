import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import React, { Suspense } from "react";
import ProtectedRoute from "./components/common/ProtectedRoute";

const ZoneBot = React.lazy(() => import("./components/chatbot/ZoneBot"));
import PrimePage from "./pages/PrimePage";
import ScratchCardPage from "./pages/Scratchcardpage";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import WishlistPage from "./pages/WishlistPage";
import ProfilePage from "./pages/ProfilePage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAIAgents from "./pages/admin/AdminAIAgents";
import MusicPage from "./pages/MusicPage";
import SuggestProductPage from "./pages/SuggestProductPage";
import AdminSuggestions from "./pages/admin/AdminSuggestions";

import RouteTracker from "./components/common/RouteTracker";

const AppContent = () => {
  const { theme } = useTheme();
  return (
    <>
      <div className="min-h-screen flex flex-col transition-colors duration-300">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/suggest-product" element={<SuggestProductPage />} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/order/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/prime" element={<ProtectedRoute><PrimePage /></ProtectedRoute>} />
            <Route path="/music" element={<ProtectedRoute><MusicPage /></ProtectedRoute>} />
            <Route path="/rewards" element={<ProtectedRoute><ScratchCardPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="ai-agents" element={<AdminAIAgents />} />
              <Route path="suggestions" element={<AdminSuggestions />} />
            </Route>
          </Routes>
        </main>
        <Footer />
        <Suspense fallback={null}>
          <ZoneBot />
        </Suspense>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} theme={theme} />
    </>
  );
};

const App = () => (
  <ThemeProvider>
    <BrowserRouter>
      <RouteTracker />
      <AppContent />
    </BrowserRouter>
  </ThemeProvider>
);

export default App;
