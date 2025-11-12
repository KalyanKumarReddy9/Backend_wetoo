const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Request = sequelize.define(
    'Request',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      seniorEmail: { type: DataTypes.STRING(160), allowNull: false },
      type: { type: DataTypes.ENUM('hospital', 'rides', 'groceries', 'companionship'), allowNull: false },
      status: { type: DataTypes.ENUM('new', 'assigned', 'in_progress', 'completed'), allowNull: false, defaultValue: 'new' },
      assignedStudentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: 'requests' }
  );

  return Request;
};

