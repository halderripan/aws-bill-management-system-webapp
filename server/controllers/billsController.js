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
const FileName = "billsController.js";

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
const sdc = new SDC({ host: 'localhost', port: 8125 });

module.exports = {

    createBill(req, res) {
        let startDate = new Date();
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
            LOGGER.info("User Authorized! :: " + FileName);
            billData = req.body;
            billData.id = uuidv4();
            billData.owner_id = user.id;
            let startDate2 = new Date();

            LOGGER.info("startDate2 = " + startDate2 + " :: " + FileName);
            return Bill
                .create(billData)
                .then((bill) => {
                    LOGGER.info("Bill Created!");
                    let endDate2 = new Date();
                    let seconds2 = (endDate2.getTime() - startDate2.getTime()) / 1000;
                    sdc.timing('createBill_DBQueryTime', seconds2);
                    bill.dataValues.created_ts = bill.dataValues.createdAt;
                    bill.dataValues.updated_ts = bill.dataValues.updatedAt;
                    delete bill.dataValues.createdAt;
                    delete bill.dataValues.updatedAt;
                    let endDate = new Date();
                    let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                    sdc.timing('successfulCreateBill_APICallTime', seconds);
                    res.status(201).send(bill)
                })
                .catch((error1) => {
                    if (error1.errors[0].value == "Invalid date") {
                        res.status(400).send({
                            message: "Invalid Date!"
                        });
                    }
                    LOGGER.error("Error Occured in createBill :: " + FileName + " :: error1 : " + error1);
                    res.status(400).send(error1);
                });
        })
            .catch((error) => {
                LOGGER.error("Error Occured in createBill :: " + FileName + " :: error : " + error);
                res.status(400).send(error);
            });
    },

    getBillByID(req, res) {
        let startDate = new Date();
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
            let startDate2 = new Date();
            return Bill
                .findAll({
                    where: {
                        id: req.params.id
                    },
                    limit: 1,
                    include: File
                })
                .then((bills) => {
                    let endDate2 = new Date();
                    let seconds2 = (endDate2.getTime() - startDate2.getTime()) / 1000;
                    sdc.timing('getBillByID_DBQueryTime', seconds2);
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
                    let endDate = new Date();
                    let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                    sdc.timing('successfulGetBillByID_APICallTime', seconds);

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
        let startDate = new Date();
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
            let startDate2 = new Date();
            return Bill
                .findAll({
                    where: {
                        owner_id: user.dataValues.id
                    },
                    include: File
                })
                .then((bills) => {
                    let endDate2 = new Date();
                    let seconds2 = (endDate2.getTime() - startDate2.getTime()) / 1000;
                    sdc.timing('getAllBills_DBQueryTime', seconds2);
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
                    let endDate = new Date();
                    let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                    sdc.timing('successfulGetAllBills_APICallTime', seconds);
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
        LOGGER.info("Entering Delete Bill By ID");
        let startDate = new Date();
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
                            message: "User not authorized to delete this Bill!"
                        })
                    }
                    LOGGER.info("-----------bills[0].dataValues-------------");
                    LOGGER.info(bills[0].dataValues);
                    LOGGER.info("-----------bills[0]-------------");
                    LOGGER.info(bills[0]);
                    LOGGER.info("-----------bills[0].dataValues.attachment.dataValues.id-------------");
                    LOGGER.info(bills[0].dataValues.attachment.dataValues.id);
                    LOGGER.info("-----------bills[0].dataValues.attachment-------------");
                    LOGGER.info(bills[0].dataValues.attachment);
                    if (bills[0].dataValues.attachment != null) {

                        LOGGER.info("Bill Has Some Attachments");
                        File
                            .findAll({
                                where: {
                                    id: bills[0].dataValues.attachment.dataValues.id
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
                                LOGGER.debug("-------Files-----Datavalues---------debug--------------- ");
                                LOGGER.debug(files[0].dataValues);
                                let startDate3 = new Date();
                                s3.deleteObject({
                                    Bucket: bucket,
                                    Key: files[0].key
                                }, function (err09) {
                                    let endDate3 = new Date();
                                    let seconds3 = (endDate3.getTime() - startDate3.getTime()) / 1000;
                                    sdc.timing('deleteFile_S3Time', seconds3);
                                    if (err09) {
                                        LOGGER.error("--------------S3 Delete Error:-------- :: err09 : "+ err09);
                                        return res.status(400).send({
                                            message: "Error while deleting from S3!"
                                        })
                                    } else {
                                        LOGGER.debug("--------------Deleting File-------- ");
                                        LOGGER.debug(files[0].dataValues.key);
                                        return File
                                            .destroy({
                                                where: {
                                                    id: bills[0].dataValues.attachment
                                                }
                                            })
                                            .then((rowDeleted) => {
                                                LOGGER.debug("--------------File Deleted Successfully-------- ");
                                            })
                                            .catch((error2) => {
                                                LOGGER.error("--------------File Deleted Error:-------- :: error2 : "+ error2);
                                                res.status(400).send(error2);
                                            });
                                    }
                                })
                            })
                            .catch((error10) => {
                                LOGGER.error("--------------File Find Error:-------- :: error10 : "+ error10);
                                res.status(400).send(error10);
                            });
                    }
                    let startDate2 = new Date();
                    return Bill
                        .destroy({
                            where: {
                                id: req.params.id
                            }
                        })
                        .then((rowDeleted) => {
                            let endDate2 = new Date();
                            let seconds2 = (endDate2.getTime() - startDate2.getTime()) / 1000;
                            sdc.timing('deleteBillByID_DBQueryTime', seconds2);
                            if (rowDeleted === 1) {
                                let endDate = new Date();
                                let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                                sdc.timing('successfulDeleteBillByID_APICallTime', seconds);
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
        let startDate = new Date();
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
                    let startDate2 = new Date();
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
                            let endDate2 = new Date();
                            let seconds2 = (endDate2.getTime() - startDate2.getTime()) / 1000;
                            sdc.timing('updateBillByID_DBQueryTime', seconds2);
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
                                    let endDate = new Date();
                                    let seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                                    sdc.timing('successfulUpdateBillByID_APICallTime', seconds);
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