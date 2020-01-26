const userController = require('../controllers/indexController').users;
const createUserValidator = require('../utils/validations').createUserValidator;

module.exports = (app) => {
  app.get('/v1', (req, res) => res.status(200).send({
    message: 'Welcome to Assignment 2 of - CSYE 6225 - Network Structure & Cloud Computing (Spring 2020)',
  }));

  app.get('/v1/user/self', userController.getUser);
  app.put('/v1/user/self', createUserValidator, userController.updateUser);
  app.post('/v1/user', createUserValidator, userController.createUser);
};