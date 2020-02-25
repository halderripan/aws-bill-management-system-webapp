/**
 * @file indexController.js
 * @author Ripan Halder
 * @version  1.0
 * @since 01/20/2020
 */

const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const path = require("path");
const props = require("./server/modules/applicationPropertiesSingleton.js");
var Promise = require('promise');

const app = express();
app.use(logger('dev'));

props.init(function (req, res) {

  const userModel = require(path.resolve(".") + "/server/models/userModel").User;
  const billsModel = require(path.resolve(".") + "/server/models/billModel").Bill;
  const fileModel = require(path.resolve(".") + "/server/models/fileModel").Files;

  userModel.hasMany(billsModel, { as: 'bills', foreignKey: 'owner_id' })
  billsModel.hasOne(fileModel, { foreignKey: 'bill', onDelete: 'CASCADE' });
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  require('./server/routes')(app);
  app.get('*', (req, res) => res.status(200).send({
    message: 'Invalid Route! Welcome to Assignments of - CSYE 6225 - Network Structure & Cloud Computing (Spring 2020)',
  }));
})


module.exports = app;

