const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM(
        'new',
        'confirmed',
        'preparing',
        'shipping',
        'delivered',
        'cancel_requested',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'new',
    },
    payment_method: {
      type: DataTypes.ENUM('cod'),
      allowNull: false,
      defaultValue: 'cod',
    },
    payment_status: {
      type: DataTypes.ENUM('unpaid', 'paid', 'refunded'),
      allowNull: false,
      defaultValue: 'unpaid',
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    shipping_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    shipping_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    shipping_address: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'orders',
    timestamps: false,
  }
);

module.exports = Order;
