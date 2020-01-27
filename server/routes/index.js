const userController = require('../controllers/indexController').users;
const billController = require('../controllers/indexController').bills;
const createUserValidator = require('../utils/validations').createUserValidator;

module.exports = (app) => {
  app.get('/v1', (req, res) => res.status(200).send({
    message: 'Welcome to Assignment 2 of - CSYE 6225 - Network Structure & Cloud Computing (Spring 2020)',
  }));

  // User Routes
  app.get('/v1/user/self', userController.getUser);
  app.put('/v1/user/self', createUserValidator, userController.updateUser);
  app.post('/v1/user', createUserValidator, userController.createUser);

  // Bill Routes
  app.get('/v1/bill/:id', billController.getBillByID);
  app.get('/v1/bills', billController.getAllBills);
  // app.put('/v1/user/self', billController.updateUser);
  app.post('/v1/bill', billController.createBill);
  app.delete('/v1/bill/:id' , billController.deleteBillByID);
};
