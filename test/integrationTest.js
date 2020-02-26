/**
 * @file userIntegrationTest.js
 * @author Ripan Halder
 * @version  1.0
 * @since 01/20/2020
 */

// To run test cases install mocha globally, add test scripts to package.json and then run npm test or mocha

const supertestChai = require("supertest-chai");
const chai = require("chai");
const expect = chai.expect;
chai.use(supertestChai.httpAsserts);
const billsController = require('../server/controllers/billsController');
const filesController = require('../server/controllers/filesController');
const usersController = require('../server/controllers/usersController');


describe("createBill function present", function () {
    it('should have a function "createBill" defined', function () {
        expect(typeof billsController.createBill).equals("function");
    })
});
describe("deleteBillByID function present", function () {
    it('should have a function "deleteBillByID" defined', function () {
        expect(typeof billsController.deleteBillByID).equals("function");
    })
});
describe("getAllBills function present", function () {
    it('should have a function "getAllBills" defined', function () {
        expect(typeof billsController.getAllBills).equals("function");
    })
});
describe("getBillByID function present", function () {
    it('should have a function "getBillByID" defined', function () {
        expect(typeof billsController.getBillByID).equals("function");
    })
});
describe("updateBillByID function present", function () {
    it('should have a function "updateBillByID" defined', function () {
        expect(typeof billsController.updateBillByID).equals("function");
    })
});
describe("createUser function present", function () {
    it('should have a function "createUser" defined', function () {
        expect(typeof usersController.createUser).equals("function");
    })
});
describe("getUser function present", function () {
    it('should have a function "getUser" defined', function () {
        expect(typeof usersController.getUser).equals("function");
    })
});
describe("listAll function present", function () {
    it('should have a function "listAll" defined', function () {
        expect(typeof usersController.listAll).equals("function");
    })
});
describe("updateUser function present", function () {
    it('should have a function "updateUser" defined', function () {
        expect(typeof usersController.updateUser).equals("function");
    })
});
describe("createFile function present", function () {
    it('should have a function "createFile" defined', function () {
        expect(typeof filesController.createFile).equals("function");
    })
});

describe("deleteFile function present", function () {
    it('should have a function "deleteFile" defined', function () {
        expect(typeof filesController.deleteFile).equals("function");
    })
});
describe("getFile function present", function () {
    it('should have a function "getFile" defined', function () {
        expect(typeof filesController.getFile).equals("function");
    })
});