/**
 * @file fileModel.js
 * @author Ripan Halder
 * @version  3.0
 * @since 02/10/2020
 */
const Sequelize = require('sequelize');
const sequelize = require("../modules/applicationPropertiesSingleton.js").sequelize;
var Files = sequelize.define('attachments', {
  id: {
    allowNull: false,
    type: Sequelize.UUID,
    primaryKey: true
  },
  bill: {
    type: Sequelize.UUID
  },
  file_name: {
    type: Sequelize.STRING
  },
  url: {
    type: Sequelize.STRING
  },
  md5: {
    type: Sequelize.STRING
  },
  size: {
    type: Sequelize.INTEGER
  },
  key: {
    type: Sequelize.STRING
  }
},
  {
    timestamps: true,
    updatedAt: false,
    createdAt: 'upload_date'
  });
sequelize.sync();
module.exports = {
  Files
}