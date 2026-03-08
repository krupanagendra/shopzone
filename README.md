# ShopZone - Full-Stack MERN E-Commerce Application

A complete Amazon-style e-commerce platform built with the MERN stack, featuring Stripe payments, admin dashboard, and full product management.

---

## 🚀 Features

### Authentication & Users
- Register / Login / Logout
- JWT-based authentication with 30-day tokens
- Role-based access control (Admin/User)
- Protected routes for both frontend and backend
- Profile management

### Products
- Product listing with grid layout
- Category, price range, and rating filters
- Search functionality (full-text search)
- Sort by price / rating / newest
- Pagination (12 products/page)
- Wishlist (toggle like system)
- Product reviews & star ratings

### Shopping Cart
- Add/Remove/Update cart items
- Persistent cart saved to database
- Real-time price calculation
- Free shipping on orders >$100

### Orders
- Stripe TEST MODE checkout
- Order history with status tracking
- Visual order progress steps
- Admin order management with status updates

### Admin Panel
- Dashboard with revenue, orders, products, users stats
- Full CRUD for products
- Order status management
- User role management

---

## 📁 Project Structure

```
ecommerce/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── cloudinary.js      # Cloudinary config
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   ├── wishlistController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT protect + admin middleware
│   │   ├── error.js           # Global error handler
│   │   └── upload.js          # Multer config
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   ├── payment.js
│   │   ├── wishlist.js
│   │   └── admin.js
│   ├── data/                  # Place CSV files here
│   ├── seed.js                # Database seeder
│   ├── server.js              # Express entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Navbar.jsx
    │   │   │   └── Footer.jsx
    │   │   ├── common/
    │   │   │   ├── Spinner.jsx
    │   │   │   ├── Rating.jsx
    │   │   │   ├── Pagination.jsx
    │   │   │   └── ProtectedRoute.jsx
    │   │   ├── product/
    │   │   │   ├── ProductCard.jsx
    │   │   │   └── FilterSidebar.jsx
    │   │   └── payment/
    │   │       └── CheckoutForm.jsx
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── ProductsPage.jsx
    │   │   ├── ProductDetailPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── CartPage.jsx
    │   │   ├── CheckoutPage.jsx
    │   │   ├── OrdersPage.jsx
    │   │   ├── OrderDetailPage.jsx
    │   │   ├── WishlistPage.jsx
    │   │   ├── ProfilePage.jsx
    │   │   └── admin/
    │   │       ├── AdminLayout.jsx
    │   │       ├── AdminDashboard.jsx
    │   │       ├── AdminProducts.jsx
    │   │       ├── AdminOrders.jsx
    │   │       └── AdminUsers.jsx
    │   ├── redux/
    │   │   ├── store.js
    │   │   └── slices/
    │   │       ├── authSlice.js
    │   │       ├── cartSlice.js
    │   │       ├── productSlice.js
    │   │       └── wishlistSlice.js
    │   ├── services/
    │   │   └── api.js          # Axios instance + all API calls
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)
- Stripe account (free, test mode)
- (Optional) Cloudinary account for image uploads

### 1. Clone / Download the project

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/shopzone
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long
STRIPE_SECRET_KEY=sk_test_51...your_key...
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

```bash
# Seed the database with 20 sample products + admin user
npm run seed

# Start backend dev server
npm run dev
```

Backend runs on: http://localhost:5000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_51...your_public_key...
VITE_API_URL=http://localhost:5000
```

```bash
# Start frontend dev server
npm run dev
```

Frontend runs on: http://localhost:5173

---

## 💳 Stripe Payment Testing

Use these test card details:
| Field | Value |
|-------|-------|
| Card Number | 4242 4242 4242 4242 |
| Expiry | Any future date (e.g., 12/28) |
| CVC | Any 3 digits (e.g., 123) |

### Payment Flow:
1. Add items to cart
2. Click "Proceed to Checkout"
3. Fill shipping address → Continue
4. Enter test card details
5. Click "Pay Now"
6. On success → order saved, cart cleared, redirect to order page

---

## 👤 Default Admin Credentials

After running `npm run seed`:
- **Email:** admin@ecommerce.com
- **Password:** admin123456

---

## 📊 Dataset Integration (CSV)

To import a Kaggle product dataset:

1. Place your CSV file at `backend/data/products.csv`

2. The seeder auto-maps these common column names:
   - `name` / `product_name` / `title`
   - `brand` / `manufacturer`
   - `category` / `main_category`
   - `description` / `about_product`
   - `price` / `actual_price`
   - `rating`
   - `no_of_ratings` / `numReviews`
   - `image` / `img_link`

3. Run: `npm run seed`

4. Up to 100 products are imported from CSV

---

## 🌐 API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/profile` — Get profile (protected)
- `PUT /api/auth/profile` — Update profile (protected)

### Products
- `GET /api/products` — List products (with query filters)
- `GET /api/products/:id` — Product detail
- `GET /api/products/categories` — All categories
- `GET /api/products/featured` — Featured products
- `POST /api/products` — Create product (admin)
- `PUT /api/products/:id` — Update product (admin)
- `DELETE /api/products/:id` — Delete product (admin)
- `POST /api/products/:id/reviews` — Add review (protected)

### Cart
- `GET /api/cart` — Get cart (protected)
- `POST /api/cart` — Add to cart (protected)
- `PUT /api/cart/:itemId` — Update quantity (protected)
- `DELETE /api/cart/:itemId` — Remove item (protected)
- `DELETE /api/cart/clear` — Clear cart (protected)

### Orders
- `POST /api/orders` — Create order (protected)
- `GET /api/orders/mine` — My orders (protected)
- `GET /api/orders/:id` — Order details (protected)
- `GET /api/orders` — All orders (admin)
- `PUT /api/orders/:id/status` — Update status (admin)

### Payment
- `POST /api/payment/create-payment-intent` — Create Stripe payment intent (protected)

### Wishlist
- `GET /api/wishlist` — Get wishlist (protected)
- `POST /api/wishlist/:productId` — Toggle wishlist (protected)

### Admin
- `GET /api/admin/stats` — Dashboard stats (admin)
- `GET /api/admin/users` — All users (admin)
- `DELETE /api/admin/users/:id` — Delete user (admin)
- `PUT /api/admin/users/:id/role` — Update role (admin)

---

## 🚀 Deployment Guide

### Backend (Railway / Render / Heroku)

1. Push backend code to GitHub
2. Connect to Railway/Render
3. Set environment variables (same as .env)
4. Set build command: `npm install`
5. Set start command: `npm start`

### Frontend (Vercel / Netlify)

1. Push frontend code to GitHub
2. Connect to Vercel
3. Set environment variables:
   - `VITE_STRIPE_PUBLIC_KEY`
   - `VITE_API_URL` = your backend URL
4. Build command: `npm run build`
5. Output directory: `dist`

### MongoDB Atlas
1. Create free cluster at mongodb.com
2. Add `0.0.0.0/0` to IP whitelist (or your deployment IP)
3. Copy connection string to MONGO_URI

---

## 🔮 Future Improvements

- Email notifications for orders (NodeMailer/SendGrid)
- Social OAuth (Google, Facebook)
- Product image gallery (multiple images)
- Advanced admin analytics with charts
- Inventory alerts (low stock notifications)
- Coupon/discount code system
- Real-time order tracking with WebSockets
- Product recommendation engine
- Multi-currency support
- Mobile app with React Native

---

## 🛠️ Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| State Management | Redux Toolkit |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Payments | Stripe (Test Mode) |
| Image Upload | Multer + Cloudinary |
| Notifications | React Toastify |
