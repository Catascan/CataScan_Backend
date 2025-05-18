const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Result = sequelize.define('Result', {
  image_path: DataTypes.TEXT,
  prediction: DataTypes.STRING,
  explanation: DataTypes.TEXT
});

Result.belongsTo(User);
module.exports = Result;
