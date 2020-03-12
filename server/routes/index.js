const userController = require('../controllers/indexController').users;
const billController = require('../controllers/indexController').bills;
const fileController = require('../controllers/indexController').files;
const { createUserValidator, createBillValidator, paymentStatusValidator } = require('../utils/validations');

module.exports = (app) => {
  app.get('/v1', (req, res) => res.status(200).send({
    message: 'Invalid Route! Welcome to Assignments of - CSYE 6225 - Network Structure & Cloud Computing (Spring 2020)',
  }));

  // User Routes
  app.get('/v1/user/self', userController.getUser);
  app.put('/v1/user/self', createUserValidator, userController.updateUser);
  app.post('/v1/user', createUserValidator, userController.createUser);
  app.post('/v2/user', createUserValidator, userController.createUser);

  // Bill Routes
  app.get('/v1/bill/:id', billController.getBillByID);
  app.get('/v1/bills', billController.getAllBills);
  app.put('/v1/bill/:id', createBillValidator, paymentStatusValidator, billController.updateBillByID);
  app.post('/v1/bill', createBillValidator, paymentStatusValidator, billController.createBill);
  app.delete('/v1/bill/:id', billController.deleteBillByID);

  app.post('/v1/bill/:id/file', fileController.createFile);
  app.get('/v1/bill/:billId/file/:fileId', fileController.getFile);
  app.delete('/v1/bill/:billId/file/:fileId', fileController.deleteFile);
};
