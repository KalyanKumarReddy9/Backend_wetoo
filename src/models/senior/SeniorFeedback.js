const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SeniorFeedback = sequelize.define(
    'SeniorFeedback',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      requestId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // Allow null for general feedback
      seniorId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // Allow null for anonymous feedback
      studentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // Allow null for general feedback
      rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
      feedback: { type: DataTypes.TEXT, allowNull: true },
      // New fields to capture services requested and desired features
      servicesNeeded: { type: DataTypes.TEXT, allowNull: true }, // comma-separated or JSON string
      featuresNeeded: { type: DataTypes.TEXT, allowNull: true }, // comma-separated or JSON string
      serviceQuality: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 } },
      punctuality: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 } },
      communication: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 5 } },
      wouldRecommend: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      additionalComments: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { 
      tableName: 'senior_feedback',
      indexes: [
        {
          fields: ['requestId'],
          unique: true // One feedback per request
        },
        {
          fields: ['seniorId']
        },
        {
          fields: ['studentId']
        },
        {
          fields: ['rating']
        }
      ]
    }
  );

  return SeniorFeedback;
};