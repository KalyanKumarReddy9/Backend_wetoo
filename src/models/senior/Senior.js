const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Senior = sequelize.define(
    'Senior',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      fullName: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      age: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      // store binary image data as BLOB (long)
      govtIdProofUrl: { type: DataTypes.BLOB('long'), allowNull: false },
      faceEmbedding: { type: DataTypes.TEXT, allowNull: true },
      // Emergency contact fields
      policeContact: { type: DataTypes.STRING(20), allowNull: true },
      ambulanceContact: { type: DataTypes.STRING(20), allowNull: true },
      phone1: { type: DataTypes.STRING(20), allowNull: true },
      phone2: { type: DataTypes.STRING(20), allowNull: true },
      phone3: { type: DataTypes.STRING(20), allowNull: true },
      pushToken: { type: DataTypes.STRING(255), allowNull: true },
      termsAccepted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'seniors' }
  );

  return Senior;
};