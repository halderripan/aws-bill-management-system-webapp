/**
 * @file indexController.js
 * @author Ripan Halder
 * @version  1.0
 * @since 01/20/2020
 */

const users = require('./usersController');
const bills = require('./billsController');
const files = require('./filesController');

module.exports = {
  users,
  bills,
  files
};
