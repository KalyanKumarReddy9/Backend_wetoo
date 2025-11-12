const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OtpToken = sequelize.define(
    'OtpToken',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      email: { type: DataTypes.STRING(160), allowNull: false },
      code: { type: DataTypes.STRING(8), allowNull: false },
      purpose: { type: DataTypes.STRING(32), allowNull: false }, // 'reset'
      used: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'otp_tokens' }
  );

  return OtpToken;
};

