/**
 * @file usersController.js
 * @author Ripan Halder
 * @version  1.0
 * @since 01/20/2020
 */

const Bill = require("../models/billModel").Bill;
const File = require("../models/fileModel").Files;
const User = require('../models/userModel').User;
const moment = require('moment');
moment.suppressDeprecationWarnings = true;
const fs = require('fs');
Bill.hasOne(File, { foreignKey: 'bill', onDelete: 'CASCADE' });

// BCcypt
const bcrypt = require(`bcrypt`);
const Promise = require('promise');

const uuidv4 = require('uuid/v4');
const { validationResult } = require('express-validator');
const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const bucket = process.env.S3_BUCKET;
//Logger
const LOGGER = require("../logger/logger.js");
const SDC = require('statsd-client');
const sdc = new SDC({host: 'localhost', port: 8125});

module.exports = {

    createBill(req, res) {
        sdc.increment('createBill');
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            LOGGER.error({ errors: errors.array() });
            return res.status(400).json({ errors: errors.array() })
        }

        if (!req.headers.authorization) {
            authenticationStatus(res);
            return;
        }
        authorizeAnUser(req, res).then(function (user) {
            billData = req.body;
            billData.id = uuidv4();
            billData.owner_id = user.id;
            return Bill
                .create(billData)
                .then((bill) => {
                    console.log("Test 1---------------------");
                    bill.dataValues.created_ts = bill.dataValues.createdAt;
                    bill.dataValues.updated_ts = bill.dataValues.updatedAt;
                    delete bill.dataValues.createdAt;
                    delete bill.dataValues.updatedAt;
                    res.status(201).send(bill)
                })
                .catch((error1) => {
                    if (error1.errors[0].value == "Invalid date") {
                        res.status(400).send({
                            message: "Invalid Date!"
                        });
                    }
                    res.status(400).send(error1);
                });
        })
            .catch((error) => {
                res.status(400).send(error);
            });
    },

    getBillByID(req, res) {
        // client.increment('getBillByID');
        sdc.increment('getBillByID');
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
                    limit: 1,
                    include: File
                })
                .then((bills) => {
                    if (bills.length == 0) {
                        return res.status(404).send({
                            message: "Bill Not Found!"
                        })
                    }
                    else if (bills[0].dataValues.owner_id != user.dataValues.id) {
                        return res.status(401).send({
                            message: "User not authorized to view this Bill!"
                        })
                    }
                    bills[0].dataValues.created_ts = bills[0].dataValues.createdAt;
                    bills[0].dataValues.updated_ts = bills[0].dataValues.updatedAt;
                    if (bills[0].dataValues.attachment != null) {
                        delete bills[0].dataValues.attachment.dataValues.bill;
                        delete bills[0].dataValues.attachment.dataValues.md5;
                        delete bills[0].dataValues.attachment.dataValues.size;
                    } else {
                        bills[0].dataValues.attachment = null;
                    }
                    delete bills[0].dataValues.createdAt;
                    delete bills[0].dataValues.updatedAt;

                    return res.status(200).send(bills[0])
                })
                .catch((error) => {
                    if (error.parent.file == "uuid.c") {
                        res.status(400).send({
                            message: "Invalid Bill Id type: UUID/V4 Passed!"
                        })
                    }
                    res.status(400).send({
                        message: "Bill Not Found!"
                    })
                });
        })
            .catch((error) => {
                res.status(400).send(error);
            });
    },

    getAllBills(req, res) {
        // client.increment('getAllBills');
        sdc.increment('getAllBills');
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
                    },
                    include: File
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
                        if (bill.dataValues.attachment != null) {
                            delete bill.dataValues.attachment.dataValues.bill;
                            delete bill.dataValues.attachment.dataValues.md5;
                            delete bill.dataValues.attachment.dataValues.size;
                        } else {

                        }
                        delete bill.dataValues.createdAt;
                        delete bill.dataValues.updatedAt;
                    });
                    return res.status(200).send(bills);
                })
                .catch((error) => res.status(400).send({
                    message: "Bill not found!"
                }));
        })
            .catch((error) => {
                res.status(400).send(error);
            });
    },

    deleteBillByID(req, res) {
        // client.increment('deleteBillByID');
        sdc.increment('deleteBillByID');
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
                            message: "User not authorized to delete this Bill!"
                        })
                    }
                    if (bills[0].dataValues.attachment != null) {
                        File
                            .findAll({
                                where: {
                                    id: bills[0].dataValues.attachment
                                }
                            })
                            .then((files) => {
                                // fs.unlink(files[0].dataValues.url, function (err) {
                                //     File
                                //         .destroy({
                                //             where: {
                                //                 id: bills[0].dataValues.attachment
                                //             }
                                //         })
                                // })
                                LOGGER.debug("-------Files-----Datavalues------------------------ ");
                                LOGGER.debug(files[0].dataValues.key);
                                LOGGER.debug("-------Files------Key----------------------- ");
                                LOGGER.debug(files[0].key);
                                s3.deleteObject({
                                    Bucket: bucket,
                                    Key: files[0].key
                                }, function (err09) {
                                    if (err09) {
                                        return res.status(400).send({
                                            message: "Error while deleting from S3!"
                                        })
                                    } else {
                                        return File
                                            .destroy({
                                                where: {
                                                    id: bills[0].dataValues.attachment
                                                }
                                            })
                                            .then((rowDeleted) => {
                                                if (rowDeleted === 1) {
                                                    res.status(204).send('Deleted successfully');
                                                }
                                            })
                                            .catch((error2) => {
                                                res.status(400).send(error2);
                                            });
                                    }
                                })
                            })
                            .catch((error10) => {
                                res.status(400).send(error10);
                            });
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
                .catch((error) => {
                    if (error.parent.file == "uuid.c") {
                        res.status(400).send({
                            message: "Invalid Bill Id type: UUID/V4 Passed!"
                        })
                    }
                    res.status(400).send({
                        message: "Bill Not Found!"
                    })
                });
        })
            .catch((error) => {
                res.status(400).send(error);
            });
    },

    updateBillByID(req, res) {
        // client.increment('updateBillByID');
        sdc.increment('updateBillByID');
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
                    limit: 1,
                    include: File
                })
                .then((bills) => {
                    if (bills.length == 0) {
                        return res.status(404).send({
                            message: "Bill Not Found!"
                        })
                    }
                    else if (bills[0].dataValues.owner_id != user.dataValues.id) {
                        return res.status(401).send({
                            message: "User not authorized to update this Bill!"
                        })
                    }

                    return Bill
                        .update({
                            vendor: req.body.vendor,
                            bill_date: req.body.bill_date,
                            due_date: req.body.due_date,
                            amount_due: req.body.amount_due,
                            categories: req.body.categories,
                            paymentStatus: req.body.paymentStatus
                        }, {

                            where: {
                                id: req.params.id
                            }
                        })
                        .then((resp) => {
                            return Bill
                                .findAll({
                                    where: {
                                        id: req.params.id
                                    }
                                })
                                .then((bills) => {
                                    bills.forEach(bill => {
                                        bill.dataValues.created_ts = bill.dataValues.createdAt;
                                        bill.dataValues.updated_ts = bill.dataValues.updatedAt;
                                        delete bill.dataValues.createdAt;
                                        delete bill.dataValues.updatedAt;
                                    });
                                    return res.status(200).send(bills[0]);
                                })
                                .catch((error) => res.status(400).send({
                                    message: "Bill not found!"
                                }));
                        })
                        .catch((error) => {
                            if (error.errors[0].value == "Invalid date") {
                                res.status(400).send({
                                    message: "Invalid Date!"
                                });
                            }
                            res.status(400).send("Something Unexpected Happened while updating!")
                        });
                })
                .catch((error) => {
                    if (error.parent.file == "uuid.c") {
                        res.status(400).send({
                            message: "Invalid Bill Id type: UUID/V4 Passed!"
                        })
                    }
                    res.status(400).send({
                        message: "Bill Not Found!"
                    })
                });
        })
            .catch((error) => {
                res.status(400).send(error);
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