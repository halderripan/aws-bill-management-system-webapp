/**
 * @file filesController.js
 * @author Ripan Halder
 * @version  1.0
 * @since 02/10/2020
 */

const Bill = require('../models/indexModel').Bill;
const User = require('../models/indexModel').User;
const File = require('../models/indexModel').File;
const moment = require('moment');
const md5File = require('md5-file');
const fs = require('fs');

moment.suppressDeprecationWarnings = true;

const path = require('path');

const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.pdf' && ext !== '.jpeg') {
            return callback({ "Error": "Only pdfs & images are allowed" }, false);
        }
        callback(null, true)
    },
    limits: {
        fileSize: 1024 * 1024
    }
}).single('billAttachment');

// BCcypt
const bcrypt = require(`bcrypt`);
const Promise = require('promise');

const { validationResult } = require('express-validator');

module.exports = {

    createFile(req, res) {
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
                            message: "User not authorized to add attachment to this Bill!"
                        })
                    }
                    else if (bills[0].dataValues.attachment != null) {
                        return res.status(400).send({
                            message: "First delete the attachment to the bill before adding a new one!"
                        })
                    }
                    else {

                        upload(req, res, function (err) {
                            if (err) {
                                return res.status(400).send(err);
                            } else {
                                md5File(`public/uploads/${req.file.filename}`, (err10, hash) => {
                                    if (err10) {
                                        res.status(400).send(error);
                                    }
                                    else {
                                        return File
                                            .create({
                                                file_name: req.file.filename,
                                                url: `public/uploads/${req.file.filename}`,
                                                upload_date: new Date(),
                                                size: req.file.size,
                                                fileOwner: user.dataValues.email_address,
                                                bill: bills[0].dataValues.id,
                                                md5: hash
                                            })
                                            .then((file) => {
                                                delete file.dataValues.createdAt;
                                                delete file.dataValues.updatedAt;
                                                delete file.dataValues.fileOwner;
                                                delete file.dataValues.size;
                                                delete file.dataValues.bill;
                                                delete file.dataValues.md5;
                                                Bill
                                                    .update(
                                                        { attachment: file.dataValues.id },
                                                        {
                                                            where: {
                                                                id: req.params.id
                                                            }
                                                        }
                                                    )
                                                res.status(201).send(file);
                                            })
                                            .catch((error) => {
                                                res.status(400).send(error);
                                            });
                                    }
                                })
                            }
                        });
                    }
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
                res.status(400).send({
                    error: error
                })
            });

    },

    getFile(req, res) {
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
                        id: req.params.billId
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
                            message: "User not authorized to add attachment to this Bill!"
                        })
                    }
                    else {
                        return File
                            .findAll({
                                where: {
                                    id: req.params.fileId
                                }
                            })
                            .then((file) => {
                                if (file.length == 0) {
                                    return res.status(404).send({
                                        message: "File Not Found!"
                                    })
                                }
                                if (file[0].bill != req.params.billId) {
                                    return res.status(404).send({
                                        message: "File for this Bill Not Found!"
                                    })
                                }
                                delete file[0].dataValues.createdAt;
                                delete file[0].dataValues.updatedAt;
                                delete file[0].dataValues.fileOwner;
                                delete file[0].dataValues.size;
                                delete file[0].dataValues.bill;
                                delete file[0].dataValues.md5;
                                res.status(200).send(file[0]);
                            })
                            .catch((error) => {
                                if (error.parent.file == "uuid.c") {
                                    res.status(400).send({
                                        message: "Invalid File Id type: UUID/V4 Passed!"
                                    })
                                }
                                res.status(400).send(error);
                            });
                    }
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
                res.status(400).send({
                    error: error
                })
            });

    },

    deleteFile(req, res) {
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
                        id: req.params.billId
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
                            message: "User not authorized to add attachment to this Bill!"
                        })
                    }
                    else {
                        return Bill
                            .update({
                                attachment: null
                            }, {
                                where: {
                                    id: req.params.billId
                                }
                            })
                            .then((resp) => {
                                return File
                                    .findAll({
                                        where: {
                                            id: req.params.fileId
                                        }
                                    })
                                    .then((file) => {
                                        if (file.length == 0) {
                                            return res.status(404).send({
                                                message: "File Not Found!"
                                            })
                                        }
                                        if (file[0].bill != req.params.billId) {
                                            return res.status(404).send({
                                                message: "File for this Bill Not Found!"
                                            })
                                        }

                                        fs.unlink(file[0].dataValues.url, function (err) {

                                            return File
                                                .destroy({
                                                    where: {
                                                        id: req.params.fileId
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
                                        });
                                    })
                                    .catch((error) => {
                                        if (error.parent.file == "uuid.c") {
                                            res.status(400).send({
                                                message: "Invalid File Id type: UUID/V4 Passed!"
                                            })
                                        }
                                        res.status(400).send(error);
                                    });
                            })
                            .catch((error1) => {
                                res.status(400).send(error1);
                            })
                    }
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
                res.status(400).send({
                    error: error
                })
            });

    }


}

const realm = 'Basic Authentication';

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