const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Donation = sequelize.define('Donation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('gpay', 'phonepe', 'paytm'),
      allowNull: false,
      field: 'payment_method' // Maps to payment_method column in database
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    upiTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'upi_transaction_id' // Maps to upi_transaction_id column
    }
  }, {
    tableName: 'donations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Donation;
};