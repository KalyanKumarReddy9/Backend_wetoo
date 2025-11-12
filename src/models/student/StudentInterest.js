const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StudentInterest = sequelize.define(
    'StudentInterest',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      studentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      type: { type: DataTypes.STRING(64), allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { 
      tableName: 'student_interests',
      // Add unique constraint to ensure each student can only have one interest of each type
      indexes: [
        {
          unique: true,
          fields: ['studentId', 'type']
        }
      ]
    }
  );
  return StudentInterest;
};