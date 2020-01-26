/**
 * @file userModel.js
 * @author Ripan Halder
 * @version  1.0
 * @since 01/20/2020
 */
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    first_name: {
      type: DataTypes.STRING
    },
    last_name: {
      type: DataTypes.STRING
    },
    password: {
      type: DataTypes.STRING
    },
    email_address: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  });
  return User;
};
