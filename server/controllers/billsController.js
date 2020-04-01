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

const { Op } = require('sequelize');

// BCcypt
const bcrypt = require(`bcrypt`);
const Promise = require('promise');

const uuidv4 = require('uuid/v4');
const { validationResult } = require('express-validator');
const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const awsRegion = process.env.AWS_DEFAULT_REGION;
aws.config.update({ region: awsRegion });

//Simple Queue Service - SQS
var sqs = new aws.SQS();

const bucket = process.env.S3_BUCKET;
const queueURL = process.env.SQS_QUEUE_URL;

//Logger
const LOGGER = require("../logger/logger.js");

//Statsd for metrics
const SDC = require('statsd-client');
const sdc = new SDC({ host: 'localhost', port: 8125 });

//async function that handles the SQS message processing.
const { Consumer } = require('sqs-consumer');
const consumer = Consumer.create({
    queueUrl: queueURL,
    handleMessage: async (message) => {
        LOGGER.debug("Queue Polled Message -> " + message);
        LOGGER.debug("Queue Polled Message Body -> " + message.Body);
        LOGGER.debug("Queue Polled Message Attributes -> "+ message.MessageAttributes);
        // LOGGER.debug("Queue Polled Message Attribute - Author -> "+ message.MessageAttributes.Author);

        publishMessage(message);

    }
    // sqs: new aws.SQS()
});

function publishMessage(message) {
    // Create publish parameters
    let snsParams = {
        Message: message.Body,
        TopicArn: process.env.TOPIC_ARN
    };

    // Create promise and SNS service object
    let publishTextPromise = new aws.SNS({ apiVersion: '2010-03-31' }).publish(snsParams).promise();

    // Handle promise's fulfilled/rejected states
    publishTextPromise.then(
        function(data) {
          LOGGER.debug(`Message ${snsParams.Message} send sent to the topic ${snsParams.TopicArn}`);
          LOGGER.debug("MessageID is " + data.MessageId);
        }).catch(
          function(err) {
          LOGGER.error("Publishing Error : ",err, err.stack);
        });
}

consumer.on('error', (err) => {
    LOGGER.error("Queue Polling error -> " + err.message);
});

consumer.on('processing_error', (err) => {
    LOGGER.error("Queue Polling processing_error -> " + err.message);
});

consumer.on('timeout_error', (err) => {
    LOGGER.error("Queue Polling timeout_error -> " + err.message);
});

consumer.start();

module.exports = {

    createBill(req, res) {
        LOGGER.info("Entering into Create Bill");
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

            LOGGER.debug("startDate2 = " + startDate2 + " :: " + FileName);
            return Bill
                .create(billData)
                .then((bill) => {
                    LOGGER.info("Bill Created!");
                    let endDate2 = new Date();
                    let seconds2 = (endDate2.getTime() - startDate2.getTime());
                    sdc.timing('createBill_DBQueryTime', seconds2);
                    bill.dataValues.created_ts = bill.dataValues.createdAt;
                    bill.dataValues.updated_ts = bill.dataValues.updatedAt;
                    delete bill.dataValues.createdAt;
                    delete bill.dataValues.updatedAt;
                    let endDate = new Date();
                    let seconds = (endDate.getTime() - startDate.getTime());
                    sdc.timing('successfulCreateBill_APICallTime', seconds);
                    LOGGER.debug("Bill Created Successfully");
                    res.status(201).send(bill)
                })
                .catch((error1) => {
                    // if (error1.errors[0].value == "Invalid date") {
                    //     res.status(400).send({
                    //         message: "Invalid Date!"
                    //     });
                    // }
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
        LOGGER.info("Entering into GET Bill By ID");
        let startDate = new Date();
        sdc.increment('getBillByID');
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
                    let seconds2 = (endDate2.getTime() - startDate2.getTime());
                    sdc.timing('getBillByID_DBQueryTime', seconds2);
                    if (bills.length == 0) {
                        LOGGER.error("Bill Not Found");
                        return res.status(404).send({
                            message: "Bill Not Found!"
                        })
                    }
                    else if (bills[0].dataValues.owner_id != user.dataValues.id) {
                        LOGGER.error("User not authorized to view this Bill!");
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
                    let seconds = (endDate.getTime() - startDate.getTime());
                    sdc.timing('successfulGetBillByID_APICallTime', seconds);
                    LOGGER.debug("Bill found by ID");
                    return res.status(200).send(bills[0])
                })
                .catch((error) => {
                    if (error.parent.file == "uuid.c") {
                        LOGGER.error("Invalid Bill Id type: UUID/V4 Passed!");
                        res.status(400).send({
                            message: "Invalid Bill Id type: UUID/V4 Passed!"
                        })
                    }
                    LOGGER.error("Bill Not Found!");
                    res.status(400).send({
                        message: "Bill Not Found!"
                    })
                });
        })
            .catch((error) => {
                LOGGER.error("Bill Not Found!");
                res.status(400).send(error);
            });
    },

    getAllBills(req, res) {
        LOGGER.debug("Entering into getAllBills!")
        let startDate = new Date();
        sdc.increment('getAllBills');
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            LOGGER.err(errors);
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
                    let seconds2 = (endDate2.getTime() - startDate2.getTime());
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
                    let seconds = (endDate.getTime() - startDate.getTime());
                    sdc.timing('successfulGetAllBills_APICallTime', seconds);
                    LOGGER.info("All Bills Fetched!");
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

    getDueBills(req, res) {
        LOGGER.debug("Entering into getDueBills!")
        let startDate = new Date();
        sdc.increment('getDueBills');
        let noOfDays = req.params.x;
        LOGGER.debug("No of Days  - " + noOfDays);
        LOGGER.debug("Start Date  - " + startDate);
        LOGGER.debug("moment().format() : " + moment().format());
        addDays(startDate, noOfDays);
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            LOGGER.err(errors);
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
                        owner_id: user.dataValues.id,
                        due_date: {
                            [Op.lte]: moment().add(noOfDays, 'days').toDate(),
                            [Op.gte]: moment().format()
                        }
                    },
                    include: File
                })
                .then((bills) => {
                    LOGGER.debug("No of Bills Fetched  - " + bills.length);
                    LOGGER.debug("SQS_QUEUE_URL - " + queueURL);
                    LOGGER.debug("awsRegion : " + awsRegion);
                    LOGGER.debug("Bucket - " + bucket);
                    let endDate2 = new Date();
                    let seconds2 = (endDate2.getTime() - startDate2.getTime());
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

                    //  SQS  Params
                    let sqsParams = {
                        DelaySeconds: 10,
                        MessageAttributes: {
                            "Title": {
                                DataType: "String",
                                StringValue: "Fetch Due Bills"
                            },
                            "Author": {
                                DataType: "String",
                                StringValue: user.dataValues.email_address
                            }
                        },
                        MessageBody: JSON.stringify(bills),
                        QueueUrl: queueURL
                    };

                    //Send Message to SQS
                    sqs.sendMessage(sqsParams, function (err, data) {
                        if (err) {
                            LOGGER.error("SQS Message Sent Error : ", err);
                        } else {
                            LOGGER.debug("SQS Message Sent Success : ", data.MessageId);
                        }
                    });

                    let endDate = new Date();
                    let seconds = (endDate.getTime() - startDate.getTime());
                    sdc.timing('successfulGetAllBills_APICallTime', seconds);
                    LOGGER.info("All Due Bills Fetched!");
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
            LOGGER.error({ errors: errors.array() });
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
                    if (bills[0].dataValues.attachment != null) {

                        LOGGER.info("Bill Has Some Attachments");
                        File
                            .findAll({
                                where: {
                                    id: bills[0].dataValues.attachment.dataValues.id
                                }
                            })
                            .then((files) => {
                                LOGGER.debug("-------Files-----Datavalues---------debug--------------- ");
                                LOGGER.debug(files[0].dataValues);
                                let startDate3 = new Date();
                                s3.deleteObject({
                                    Bucket: bucket,
                                    Key: files[0].key
                                }, function (err09) {
                                    let endDate3 = new Date();
                                    let seconds3 = (endDate3.getTime() - startDate3.getTime());
                                    sdc.timing('deleteFile_S3Time', seconds3);
                                    if (err09) {
                                        LOGGER.error("--------------S3 Delete Error:-------- :: err09 : " + err09);
                                        return res.status(400).send({
                                            message: "Error while deleting from S3!"
                                        })
                                    } else {
                                        LOGGER.debug("--------------Deleting File-------- ");
                                        return File
                                            .destroy({
                                                where: {
                                                    id: bills[0].dataValues.attachment.dataValues.id
                                                }
                                            })
                                            .then((rowDeleted) => {
                                                LOGGER.debug("--------------File Deleted Successfully-------- ");
                                                let startDate2 = new Date();
                                                return Bill
                                                    .destroy({
                                                        where: {
                                                            id: req.params.id
                                                        }
                                                    })
                                                    .then((rowDeleted) => {
                                                        let endDate2 = new Date();
                                                        let seconds2 = (endDate2.getTime() - startDate2.getTime());
                                                        sdc.timing('deleteBillByID_DBQueryTime', seconds2);
                                                        if (rowDeleted === 1) {
                                                            let endDate = new Date();
                                                            let seconds = (endDate.getTime() - startDate.getTime());
                                                            sdc.timing('successfulDeleteBillByID_APICallTime', seconds);
                                                            LOGGER.info("Bill Deleted Successfuuly");
                                                            res.status(204).send('Deleted successfully');
                                                        }
                                                    })
                                                    .catch((e) => {
                                                        LOGGER.error({ "Error": e })
                                                        res.status(400).send({
                                                            message: "Some Error Occured While Deleting!",
                                                            error: e
                                                        })
                                                    })
                                            })
                                            .catch((error2) => {
                                                LOGGER.error("--------------File Deleted Error:-------- :: error2 : " + error2);
                                                res.status(400).send(error2);
                                            });
                                    }
                                })
                            })
                            .catch((error10) => {
                                LOGGER.error("--------------File Find Error:-------- :: error10 : " + error10);
                                res.status(400).send(error10);
                            });
                    } else {
                        let startDate2 = new Date();
                        return Bill
                            .destroy({
                                where: {
                                    id: req.params.id
                                }
                            })
                            .then((rowDeleted) => {
                                let endDate2 = new Date();
                                let seconds2 = (endDate2.getTime() - startDate2.getTime());
                                sdc.timing('deleteBillByID_DBQueryTime', seconds2);
                                if (rowDeleted === 1) {
                                    let endDate = new Date();
                                    let seconds = (endDate.getTime() - startDate.getTime());
                                    sdc.timing('successfulDeleteBillByID_APICallTime', seconds);
                                    LOGGER.info("Bill Deleted Successfuuly");
                                    res.status(204).send('Deleted successfully');
                                }
                            })
                            .catch((e) => res.status(400).send({
                                message: "Some Error Occured While Deleting!",
                                error: e
                            }))
                    }
                })
                .catch((error) => {
                    LOGGER.error({ "Error": error });
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
            .catch((error100) => {
                LOGGER.error({ "Error": error100 });
                res.status(400).send(error100);
            });
    },

    updateBillByID(req, res) {
        LOGGER.info("Entering into Update Bill By ID");
        let startDate = new Date();
        sdc.increment('updateBillByID');
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
                        LOGGER.error({ message: "Bill Not Found!" });
                        return res.status(404).send({
                            message: "Bill Not Found!"
                        })
                    }
                    else if (bills[0].dataValues.owner_id != user.dataValues.id) {
                        LOGGER.error({ message: "User not authorized to update this Bill!" });
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
                            let seconds2 = (endDate2.getTime() - startDate2.getTime());
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
                                    let seconds = (endDate.getTime() - startDate.getTime());
                                    sdc.timing('successfulUpdateBillByID_APICallTime', seconds);
                                    LOGGER.info("Successfully Updated a Bill By ID");
                                    return res.status(200).send(bills[0]);
                                })
                                .catch((error7) => {
                                    LOGGER.error({ message: "Bill not found!", error: error7 });
                                    res.status(400).send({
                                        message: "Bill not found!", error: error7
                                    })
                                });
                        })
                        .catch((error101) => {
                            // if (error.errors[0].value == "Invalid date") {
                            //     res.status(400).send({
                            //         message: "Invalid Date!"
                            //     });
                            // }

                            LOGGER.error({ message: "Something Unexpected Happened while updating Bill!", error: error101 });
                            res.status(400).send({ message: "Something Unexpected Happened while updating Bill!", error: error101 })
                        });
                })
                .catch((error) => {
                    if (error.parent.file == "uuid.c") {
                        LOGGER.error({ message: "Invalid Bill Id type: UUID/V4 Passed!" });
                        res.status(400).send({
                            message: "Invalid Bill Id type: UUID/V4 Passed!"
                        })
                    }
                    LOGGER.error({ message: "Bill Not Found!" });
                    res.status(400).send({
                        message: "Bill Not Found!"
                    })
                });
        })
            .catch((error12) => {
                LOGGER.error({ error: error12 });
                res.status(400).send(error12);
            });
    }
}

function authenticationStatus(resp) {
    LOGGER.error("Basic Authorization is needed! Please provide Username and Password!");
    resp.writeHead(401, { 'WWW-Authenticate': 'Basic realm="' + realm + '"' });
    resp.end('Basic Authorization is needed! Please provide Username and Password!');
};

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

const authorizeAnUser = function (req, res) {
    return new Promise(function (resolve, reject) {
        let authentication = req.headers.authorization.replace(/^Basic/, '');
        authentication = (new Buffer(authentication, 'base64')).toString('utf8');
        const loginInfo = authentication.split(':');
        const userName = loginInfo[0];
        const passwordFromToken = loginInfo[1];
        LOGGER.info("Authorizing the user : " + userName);

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
                    LOGGER.error({
                        message: 'User Not Found! Invalid Username!'
                    });
                    return res.status(404).send({
                        message: 'User Not Found! Invalid Username!',
                    });
                }
                bcrypt.compare(passwordFromToken, user[0].dataValues.password, function (err, res2) {
                    if (err) {
                        reject(Error("Passwords Error!"));
                        LOGGER.error({
                            message: 'Error occured while comparing passwords.'
                        });
                        return res.status(400).send({
                            message: 'Error occured while comparing passwords.'
                        })
                    }
                    if (res2) {
                        resolve(user[0]);
                    } else {
                        reject(Error(`Wrong Passwords!`));
                        LOGGER.error({ success: false, message: 'Unauthorized! Wrong Password!' });
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