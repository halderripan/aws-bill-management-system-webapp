/**
 * @file usersController.js
 * @author Ripan Halder
 * @version  1.0
 * @since 01/20/2020
 */

const Bill = require('../models/indexModel').Bill;
const User = require('../models/indexModel').User;

// BCcypt
const bcrypt = require(`bcrypt`);
const Promise = require('promise');

const { validationResult } = require('express-validator');

module.exports = {

    createBill(req, res) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        if (!req.headers.authorization) {
            authenticationStatus(res);
            return;
        }
        authorizeAnUser(req, res).then(function (user) {
            return Bill
                .create({
                    owner_id: user.id,
                    vendor: req.body.vendor,
                    bill_date: req.body.bill_date,
                    due_date: req.body.due_date,
                    amount_due: req.body.amount_due,
                    categories: req.body.categories,
                    paymentStatus: req.body.paymentStatus
                })
                .then((bill) => {
                    bill.dataValues.created_ts = bill.dataValues.createdAt;
                    bill.dataValues.updated_ts = bill.dataValues.updatedAt;
                    delete bill.dataValues.createdAt;
                    delete bill.dataValues.updatedAt;
                    res.status(201).send(bill)
                })
                .catch((error) => res.status(400).send({
                    message: "New Bill Not Created!"
                }));
        });
    },

    getBillByID(req, res) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        if (!req.headers.authorization) {
            authenticationStatus(res);
            return;
        }
        authorizeAnUser(req, res).then(function (user) {
            return Bill
                .findAll({
                    where: {
                        id: req.params.id
                    },
                    limit: 1
                })
                .then((bills) => {
                    if (bills.length == 0) {
                        return res.status(404).send({
                            message: "Bill Not Found!"
                        })
                    }
                    else if (bills[0].dataValues.owner_id != user.dataValues.id) {
                        return res.status(401).send({
                            message: "User Unauthorized to view this Bill!"
                        })
                    }
                    bills[0].dataValues.created_ts = bills[0].dataValues.createdAt;
                    bills[0].dataValues.updated_ts = bills[0].dataValues.updatedAt;
                    delete bills[0].dataValues.createdAt;
                    delete bills[0].dataValues.updatedAt;
                    return res.status(200).send(bills[0])
                })
                .catch((error) => res.status(400).send({
                    message: "Bill Not Found!"
                }));
        });
    },

    getAllBills(req, res) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        if (!req.headers.authorization) {
            authenticationStatus(res);
            return;
        }
        authorizeAnUser(req, res).then(function (user) {
            return Bill
                .findAll({
                    where: {
                        owner_id: user.dataValues.id
                    }
                })
                .then((bills) => {
                    if (bills.length == 0) {
                        return res.status(404).send({
                            message: "No Bills Found!"
                        })
                    }
                    bills.forEach(bill => {
                        bill.dataValues.created_ts = bill.dataValues.createdAt;
                        bill.dataValues.updated_ts = bill.dataValues.updatedAt;
                        delete bill.dataValues.createdAt;
                        delete bill.dataValues.updatedAt;
                    });
                    return res.status(200).send(bills);
                })
                .catch((error) => res.status(400).send({
                    message: "No Bills Found!"
                }));
        });
    },

    deleteBillByID(req, res) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        if (!req.headers.authorization) {
            authenticationStatus(res);
            return;
        }
        authorizeAnUser(req, res).then(function (user) {
            return Bill
                .findAll({
                    where: {
                        id: req.params.id
                    },
                    limit: 1
                })
                .then((bills) => {
                    if (bills.length == 0) {
                        return res.status(404).send({
                            message: "Bill Not Found!"
                        })
                    }
                    else if (bills[0].dataValues.owner_id != user.dataValues.id) {
                        return res.status(401).send({
                            message: "User Unauthorized to delete this Bill!"
                        })
                    }
                    return Bill
                        .destroy({
                            where: {
                                id: req.params.id
                            }
                        })
                        .then((rowDeleted) => { 
                            if (rowDeleted === 1) {
                                res.status(204).send('Deleted successfully');
                            }
                        })
                        .catch((e) => res.status(400).send({
                            message: "Some Error Occured While Deleting!",
                            error: e
                        }))
                })
                .catch((error) => res.status(400).send({
                    message: "Bill Not Found!"
                }));
        });
    }
}

function authenticationStatus(resp) {
    resp.writeHead(401, { 'WWW-Authenticate': 'Basic realm="' + realm + '"' });
    resp.end('Basic Authorization is needed! Please provide Username and Password!');
};

const authorizeAnUser = function (req, res) {
    return new Promise(function (resolve, reject) {
        let authentication = req.headers.authorization.replace(/^Basic/, '');
        authentication = (new Buffer(authentication, 'base64')).toString('utf8');
        const loginInfo = authentication.split(':');
        const userName = loginInfo[0];
        const passwordFromToken = loginInfo[1];

        User
            .findAll({
                limit: 1,
                where: {
                    email_address: userName
                },
            })
            .then((user) => {
                if (user.length == 0) {
                    reject(Error("Invalid Username!"));
                    return res.status(404).send({
                        message: 'User Not Found! Invalid Username!',
                    });
                }
                bcrypt.compare(passwordFromToken, user[0].dataValues.password, function (err, res2) {
                    if (err) {
                        reject(Error("Passwords Error!"));
                        return res.status(400).send({
                            message: 'Error occured while comparing passwords.'
                        })
                    }
                    if (res2) {
                        resolve(user[0]);
                    } else {
                        reject(Error(`Wrong Passwords!`));
                        return res.status(401).json({ success: false, message: 'Unauthorized! Wrong Password!' });
                    }
                });
            })
            .catch((error) => {
                reject(error);
                return res.status(400).send({
                    message: 'Error occured while finding an user!'
                });
            });
    });
}