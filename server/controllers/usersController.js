/**
 * @file usersController.js
 * @author Ripan Halder
 * @version  1.0
 * @since 01/20/2020
 */

const User = require('../models/userModel').User;

// BCcypt
const bcrypt = require(`bcrypt`);

const uuidv4 = require('uuid/v4');

const { validationResult } = require('express-validator');
//Logger
const LOGGER = require("../logger/logger.js");
const StatsD = require('node-statsd'), client = new StatsD();

module.exports = {

  //Creating a new User
  createUser(req, res) {
    var startDate = new Date();
    client.increment('createUser', 1);
    LOGGER.info("Creating a  User!");
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    return User
      .findAll({
        limit: 1,
        where: {
          email_address: req.body.email_address
        },
      })
      .then(user => {
        if (user.length > 0) {
          LOGGER.error("User already exists! Provide a different email_address / username!");
          return res.status(400).send({
            message: `User already exists! Provide a different email_address / username!`,
          });
        }

        const pwd = req.body.password;
        bcrypt.hash(pwd, 5).then(function (hash) {
          let flag = passwordCheck(res, pwd);

          if (!flag) {
            return User
              .create({
                id: uuidv4(),
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                email_address: req.body.email_address,
                password: hash
              })
              .then((user) => {
                delete user.dataValues.password;
                user.dataValues.account_created = user.dataValues.createdAt;
                user.dataValues.account_updated = user.dataValues.updatedAt;
                delete user.dataValues.createdAt;
                delete user.dataValues.updatedAt;
                var endDate = new Date();
                var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                client.timing('successfulUserCreation_APICallTime', seconds);
                res.status(201).send(user)
              })
              .catch((error) => res.status(400).send(error));
          }
        })
      })
      .catch((error) => res.status(400).send(error));
  },

  // Fetching all users. No authentication
  listAll(req, res) {
    return User
      .findAll({
        order: [
          ['createdAt', 'DESC']
        ],
        attributes: { exclude: ['password'] }
      })
      .then((users) => res.status(200).send(users))
      .catch((error) => res.status(400).send(error));
  },

  updateUser(req, res) {
    var startDate = new Date();
    client.increment('updateUser', 1);
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    if (!req.headers.authorization) {
      authenticationStatus(res);
      return;
    }

    let authentication = req.headers.authorization.replace(/^Basic/, '');
    authentication = (new Buffer(authentication, 'base64')).toString('utf8');
    const loginInfo = authentication.split(':');
    const userName = loginInfo[0];
    const passwordFromToken = loginInfo[1];

    return User
      .findAll({
        limit: 1,
        where: {
          email_address: userName
        },
      })
      .then((user) => {
        if (user.length == 0) {
          return res.status(404).send({
            message: 'User Not Found! Invalid Username!',
          });
        }
        bcrypt.compare(passwordFromToken, user[0].dataValues.password, function (err, res2) {
          if (err) {
            return res.status(400).send({
              message: 'Error occured while comparing passwords.'
            })
          }
          if (res2) {
            if (req.body.email_address != user[0].dataValues.email_address) {
              return res.status(400).send({
                message: `Invalid Request! Can't change username / email_address.`
              })
            }
            bcrypt.hash(req.body.password, 5).then(function (hash) {
              let flag = passwordCheck(res, req.body.password);
              if (!flag) {
                return User
                  .update({
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    password: hash
                  },
                    {
                      where: { email_address: userName }
                    })
                  .then((user) => {

                    var endDate = new Date();
                    var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                    client.timing('successfulUserUpdation_APICallTime', seconds);
                    res.status(204).send("Updated Successfully!")
                  })
                  .catch((error) => res.status(400).send(error));
              }
            })

          } else {
            return res.status(401).json({ success: false, message: 'Unauthorized! Wrong Password!' });
          }
        });
      })
      .catch((error) => res.status(400).send(error));
  },

  getUser(req, res) {
    var startDate = new Date();
    client.increment('getUser', 1);

    if (!req.headers.authorization) {
      authenticationStatus(res);
      return;
    }

    let authentication = req.headers.authorization.replace(/^Basic/, '');
    authentication = (new Buffer(authentication, 'base64')).toString('utf8');
    const loginInfo = authentication.split(':');
    const userName = loginInfo[0];
    const passwordFromToken = loginInfo[1];

    return User
      .findAll({
        limit: 1,
        where: {
          email_address: userName
        },
      })
      .then((user) => {
        if (user.length == 0) {
          return res.status(404).send({
            message: 'User Not Found! Invalid Username!',
          });
        }
        bcrypt.compare(passwordFromToken, user[0].dataValues.password, function (err, res2) {
          if (err) {
            return res.status(400).send({
              message: 'Error occured while comparing passwords.'
            })
          }
          if (res2) {
            delete user[0].dataValues.password;
            user[0].dataValues.account_created = user[0].dataValues.createdAt;
            user[0].dataValues.account_updated = user[0].dataValues.updatedAt;
            delete user[0].dataValues.createdAt;
            delete user[0].dataValues.updatedAt;

            var endDate   = new Date();
            var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
            client.timing('successfulUserFetch_APICallTime', seconds);
            res.status(200).send(user[0]);

          } else {
            return res.status(401).json({ success: false, message: 'Unauthorized! Wrong Password!' });
          }
        });
      })
      .catch((error) => res.status(400).send(error));
  }
};

const realm = 'Basic Authentication';

function authenticationStatus(resp) {
  resp.writeHead(401, { 'WWW-Authenticate': 'Basic realm="' + realm + '"' });
  resp.end('Basic Authorization is needed! Please provide Username and Password!');
};

function passwordCheck(res, pwd) {
  const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
  let flag = false;
  if (pwd.length <= 8) {
    res.status(403).send({
      message: 'Weak Password : Length should be more than 8 characters',
    });
    flag = true;
  }
  else if (/^[a-zA-Z]+$/.test(pwd)) {
    res.status(403).send({
      message: 'Weak Password : Only Characters used. Must Contain at least 1 -> lowercase char, uppercase char, 1 numeric char and 1 special char & length grater than 8',
    });
    flag = true;
  } else if (!strongRegex.test(pwd)) {
    res.status(403).send({
      message: 'Weak Password : Must Contain at least 1 -> lowercase char, uppercase char, 1 numeric char and 1 special char & length grater than 8',
    });
    flag = true;
  }
  return flag;
}