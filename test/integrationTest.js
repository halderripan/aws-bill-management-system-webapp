/**
 * @file userIntegrationTest.js
 * @author Ripan Halder
 * @version  1.0
 * @since 01/20/2020
 */

// To run test cases install mocha globally, add test scripts to package.json and then run npm test or mocha

const assert = require("assert");
const supertestChai = require("supertest-chai");
const chai = require("chai");
const app = require("../server.js");
const request = supertestChai.request;
const expect = chai.expect;
const should = chai.should();
chai.use(supertestChai.httpAsserts);

let newUserId = "";
let newBillId = "";


describe("PUT /v1/user/self", function () {
    it("should return a user not found", function (done) {
        var server = app.listen();
        var payload = {
            email_address: "invaliduser@abc.abc",
            first_name: "Lord",
            last_name: "Ripan",
            password: "ASfadf@12345"
        };
        request(server)
            .put("/v1/user/self")
            .auth('invaliduser@abc.abc', 'ASfadf@12345')
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(404);
                res.body.should.be.a("object");
                done();
            });
    });

});

describe("POST /v1/bill", function () {
    

    it("should return error if amount_due is not a number while creating a bill", function (done) {
        var payload = {
            "vendor": "Test Bill",
            "bill_date": "2019-07-15",
            "due_date": "2020-01-31",
            "amount_due": "abc",
            "categories": [
              "college",
              "tuition",
              "spring2020"
            ],
            "paymentStatus": "no_payment_required"
        };
        var server = app.listen();
        request(server)
            .post("/v1/bill")
            .auth('unitTest@husky.neu.edu', 'ASfadf@12345')
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(400);
                res.body.should.be.a("object");
                done();
            });
    });

    it("should return error if categories is not an array while creating a bill", function (done) {
        var payload = {
            "vendor": "Test Bill",
            "bill_date": "2020-01-3",
            "due_date": "2020-01-31",
            "amount_due": "abc",
            "categories": "college",
            "paymentStatus": "no_payment_required"
        };
        var server = app.listen();
        request(server)
            .post("/v1/bill")
            .auth('unitTest@husky.neu.edu', 'ASfadf@12345')
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(400);
                res.body.should.be.a("object");
                done();
            });
    });

    it("should return error if an invalid paymentStatus is entered while creating a bill", function (done) {
        var payload = {
            "vendor": "Test Bill",
            "bill_date": "2019-07-15",
            "due_date": "2020-01-31",
            "amount_due": 10,
            "categories": [
              "college",
              "tuition",
              "spring2020"
            ],
            "paymentStatus": "invalid"
        };
        var server = app.listen();
        request(server)
            .post("/v1/bill")
            .auth('unitTest@husky.neu.edu', 'ASfadf@12345')
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(400);
                res.body.should.be.a("object");
                done();
            });
    });

});

describe("GET /v1/bill/{id}", function () {

    it("should return bill not found when a particular bill is fetched by a valid UUIDV4 not present ID by an authorized user", function (done) {
        var server = app.listen();
        request(server)
            .get(`/v1/bill/314240d8-0aa6-4d02-9e9f-186a55173335`)
            .auth('unitTest@husky.neu.edu', 'ASfadf@12345')
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(404);
                res.body.should.be.a("object");
                done();
            });
    });

});

//Update Bill
describe("Update /v1/bill/{id}", function () {

    it("should return bill not found when a particular bill is updated by a valid UUIDV4 not present ID by an authorized user", function (done) {
        var server = app.listen();
        var payload = {
            "vendor": "Updated Bill",
            "bill_date": "2020-01-28",
            "due_date": "2020-01-31",
            "amount_due": 100.22,
            "categories": [
              "college",
              "tuition",
              "spring2020"
            ],
            "paymentStatus": "paid"
          };
        request(server)
            .get(`/v1/bill/314240d8-0aa6-4d02-9e9f-186a55173335`)
            .auth('unitTest@husky.neu.edu', 'ASfadf@12345')
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(404);
                res.body.should.be.a("object");
                done();
            });
    });

});


describe("DELETE /v1/bill/{id}", function () {

    it("should return bill not found when a particular bill is being deleted by a valid UUIDV4 not present ID by an authorized user", function (done) {
        var server = app.listen();
        request(server)
            .del(`/v1/bill/314240d8-0aa6-4d02-9e9f-186a55173335`)
            .auth('unitTest@husky.neu.edu', 'ASfadf@12345')
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(404);
                res.body.should.be.a("object");
                done();
            });
    });
});