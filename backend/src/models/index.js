const User = require('./User');
const Profile = require('./Profile');
const OTP = require('./OTP');
const Product = require('./Product');
const Shop = require('./Shop');
const ShippingRequest = require('./ShippingRequest');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

// Define Associations
User.hasOne(Profile, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE'
});

Profile.belongsTo(User, {
  foreignKey: 'user_id'
});

User.hasMany(OTP, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE'
});

OTP.belongsTo(User, {
  foreignKey: 'user_id'
});

User.hasOne(Shop, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE'
});

Shop.belongsTo(User, {
  foreignKey: 'user_id'
});

User.hasOne(ShippingRequest, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE'
});

ShippingRequest.belongsTo(User, {
  foreignKey: 'user_id'
});

Shop.hasMany(Product, {
  foreignKey: 'shop_id'
});

Product.belongsTo(Shop, {
  foreignKey: 'shop_id'
});

User.hasMany(CartItem, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE'
});

CartItem.belongsTo(User, {
  foreignKey: 'user_id'
});

Product.hasMany(CartItem, {
  foreignKey: 'product_id',
  onDelete: 'CASCADE'
});

CartItem.belongsTo(Product, {
  foreignKey: 'product_id'
});

User.hasMany(Order, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE'
});

Order.belongsTo(User, {
  foreignKey: 'user_id'
});

Order.hasMany(OrderItem, {
  foreignKey: 'order_id',
  onDelete: 'CASCADE'
});

OrderItem.belongsTo(Order, {
  foreignKey: 'order_id'
});

Product.hasMany(OrderItem, {
  foreignKey: 'product_id',
  onDelete: 'SET NULL'
});

OrderItem.belongsTo(Product, {
  foreignKey: 'product_id'
});

module.exports = {
  User,
  Profile,
  OTP,
  Product,
  Shop,
  ShippingRequest,
  CartItem,
  Order,
  OrderItem
};
