/**
 * @file billModel.js
 * @author Ripan Halder
 * @version  3.0
 * @since 01/26/2020
 */
module.exports = (sequelize, DataTypes) => {
  const Bill = sequelize.define('Bill', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    owner_id: {
      allowNull: false,
      type: DataTypes.UUID,
      noUpdate: true
    },
    vendor: {
      type: DataTypes.STRING
    },
    bill_date: {
      type: DataTypes.DATE
    },
    due_date: {
      type: DataTypes.DATE
    },
    amount_due: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: {
        min: 0.01
      }
    }
  });
  return Bill;
};
