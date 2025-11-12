const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SeniorRequest = sequelize.define(
    'SeniorRequest',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      seniorId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      type: { type: DataTypes.ENUM('hospital', 'rides', 'groceries', 'companionship', 'technology_help', 'household_tasks', 'government_services', 'medicines', 'reading_writing', 'other'), allowNull: false },
      priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), allowNull: false, defaultValue: 'medium' },
      location: { type: DataTypes.STRING(255), allowNull: true },
      preferredTime: { type: DataTypes.STRING(100), allowNull: true },
      status: { type: DataTypes.ENUM('open', 'assigned', 'in_progress', 'completed', 'cancelled'), allowNull: false, defaultValue: 'open' },
      assignedStudentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      assignedAt: { type: DataTypes.DATE, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      estimatedDuration: { type: DataTypes.INTEGER, allowNull: true, comment: 'Duration in minutes' },
      // Additional fields for contact information
      requesterName: { type: DataTypes.STRING(255), allowNull: true },
      requesterPhone: { type: DataTypes.STRING(20), allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { 
      tableName: 'senior_requests',
      indexes: [
        {
          fields: ['seniorId']
        },
        {
          fields: ['assignedStudentId']
        },
        {
          fields: ['status']
        },
        {
          fields: ['type']
        }
      ]
    }
  );

  return SeniorRequest;
};