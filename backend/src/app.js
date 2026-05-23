require('dotenv').config();
const path = require('path');
const express = require('express');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// CORS support
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Routes
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const passwordRoutes = require('./routes/password.routes');
const devRoutes = require('./routes/dev.routes');
const productRoutes = require('./routes/product.routes');
const shopRoutes = require('./routes/shop.routes');
const shippingRoutes = require('./routes/shipping.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');

app.use('/api/auth', authRoutes);
app.use('/api/auth', passwordRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dev', devRoutes);
app.use('/api/products', productRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

module.exports = app;
