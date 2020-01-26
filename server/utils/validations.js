/**
 * @file indexController.js
 * @author Ripan Halder
 * @version  1.0
 * @since 01/20/2020
 */

const {check} = require('express-validator');
const REQUEST_PARAM = require('../constants/constants').REQUEST_PARAM;

/**
 * Contains the validations for the registeration POST & PUT API: /v1/user
 * @memberof validations
 * @constant createUserValidator
 */
const createUserValidator = [
    check(REQUEST_PARAM.CREATE_USER.EMAIL_ADDRESS)
    .exists()
    .isEmail(),

    check(REQUEST_PARAM.CREATE_USER.PASSWORD)
    .exists(),
    check(REQUEST_PARAM.CREATE_USER.FIRSTNAME)
    .exists()
    .isLength({
        min: 1,
        max: 100
    }),

    check(REQUEST_PARAM.CREATE_USER.LASTNAME)
    .exists()
    .isLength({
        min: 1,
        max: 100
    })
]

module.exports = {
    createUserValidator
};