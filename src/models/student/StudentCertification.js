const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StudentCertification = sequelize.define(
    'StudentCertification',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      studentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      title: { type: DataTypes.STRING(160), allowNull: false },
      // New: store file binary directly in DB
      fileBlob: { type: DataTypes.BLOB('long'), allowNull: true },
      mimeType: { type: DataTypes.STRING(100), allowNull: true },
      fileName: { type: DataTypes.STRING(255), allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'student_certifications' }
  );
  return StudentCertification;
};
