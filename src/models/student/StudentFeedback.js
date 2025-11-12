const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StudentFeedback = sequelize.define(
    'StudentFeedback',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      studentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      seniorEmail: { type: DataTypes.STRING(160), allowNull: false },
      rating: { type: DataTypes.INTEGER, allowNull: false },
      comments: { type: DataTypes.STRING(500), allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'student_feedback' }
  );
  return StudentFeedback;
};
