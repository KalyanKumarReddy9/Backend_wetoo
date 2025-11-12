const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Student = sequelize.define(
    'Student',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      fullName: { type: DataTypes.STRING(120), allowNull: false },
      phoneNumber: { type: DataTypes.STRING(20), allowNull: false },
      email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  // store binary image data as BLOB (long)
  idProofUrl: { type: DataTypes.BLOB('long'), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      // Legacy URL for avatar (kept); new blob-based avatar fields below
      avatarUrl: { type: DataTypes.STRING(255), allowNull: true },
      avatarBlob: { type: DataTypes.BLOB('long'), allowNull: true },
      avatarMimeType: { type: DataTypes.STRING(100), allowNull: true },
      avatarFileName: { type: DataTypes.STRING(255), allowNull: true },
      termsAccepted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      // Student performance tracking fields
      completedTasks: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      hoursServed: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
      score: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      pushToken: { type: DataTypes.STRING(255), allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'students' }
  );

  return Student;
};

