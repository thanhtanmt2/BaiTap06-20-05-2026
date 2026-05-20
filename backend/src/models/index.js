const User = require('./User');
const Profile = require('./Profile');
const OTP = require('./OTP');
const Product = require('./Product');
const Shop = require('./Shop');
const ShippingRequest = require('./ShippingRequest');

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

module.exports = {
  User,
  Profile,
  OTP,
  Product,
  Shop,
  ShippingRequest
};
