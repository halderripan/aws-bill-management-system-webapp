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

describe("POST /v1/user", function () {
    it("should successfully create a new user object", function (done) {
        var payload = {
            email_address: "unitTest@husky.neu.edu",
            first_name: "Lord",
            last_name: "Ripan",
            password: "ASfadf@12345"
        };
        var server = app.listen();
        request(server)
            .post("/v1/user")
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                newUserId = res.body.id;
                res.should.have.status(201);
                res.body.should.be.a("object");
                res.body.should.have.property('id');
                res.body.should.have.property('first_name');
                res.body.should.have.property('last_name');
                res.body.should.have.property('email_address');
                res.body.should.have.property('account_created');
                res.body.should.have.property('account_updated');
                res.body.should.not.have.property('password');
                done();
            });
    });

    it("should successfully create one more new user object", function (done) {
        var payload = {
            email_address: "unitTest2@husky.neu.edu",
            first_name: "Lord",
            last_name: "Ripan",
            password: "ASfadf@12345"
        };
        var server = app.listen();
        request(server)
            .post("/v1/user")
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(201);
                res.body.should.be.a("object");
                done();
            });
    });

    it("should return error if email address is not present while creating an user", function (done) {
        var payload = {
            first_name: "Lord",
            last_name: "Ripan",
            password: "ASfadf@12345"
        };
        var server = app.listen();
        request(server)
            .post("/v1/user")
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(400);
                res.body.should.be.a("object");
                done();
            });
    });

});


describe("GET /v1/user/self", function () {
    it("should successfully return an user object", function (done) {
        var server = app.listen();
        request(server)
            .get("/v1/user/self")
            .auth('unitTest@husky.neu.edu', 'ASfadf@12345')
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.should.have.property('id');
                res.body.should.have.property('first_name');
                res.body.should.have.property('last_name');
                res.body.should.have.property('email_address');
                res.body.should.have.property('account_created');
                res.body.should.have.property('account_updated');
                res.body.should.not.have.property('password');
                done();
            });
    });

    it("should return unauthorized", function (done) {
        var server = app.listen();
        request(server)
            .get("/v1/user/self")
            .auth('unitTest@husky.neu.edu', 'wrongPassword')
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(401);
                res.body.should.be.a("object");
                done();
            });
    });

});

describe("PUT /v1/user/self", function () {
    it("should successfully update an user object", function (done) {
        var server = app.listen();
        var payload = {
            email_address: "unitTest@husky.neu.edu",
            first_name: "Ripan",
            last_name: "Halder",
            password: "ASfadf@12345"
        };
        request(server)
            .put("/v1/user/self")
            .auth('unitTest@husky.neu.edu', 'ASfadf@12345')
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(204);
                res.body.should.be.a("object");
                done();
            });
    });

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
    it("should successfully create a new bill object", function (done) {
        var payload = {
            "vendor": "Test Bill",
            "bill_date": "2020-01-28",
            "due_date": "2020-01-31",
            "amount_due": 10.22,
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
                newBillId = res.body.id;
                res.should.have.status(201);
                res.body.should.be.a("object");
                res.body.should.have.property('id');
                res.body.should.have.property('owner_id');
                res.body.should.have.property('vendor');
                res.body.should.have.property('bill_date');
                res.body.should.have.property('due_date');
                res.body.should.have.property('amount_due');
                res.body.should.have.property('categories');
                res.body.should.have.property('paymentStatus');
                res.body.should.have.property('created_ts');
                res.body.should.have.property('updated_ts');
                done();
            });
    });

    it("should return error if vendor is not present while creating a bill", function (done) {
        var payload = {
            "bill_date": "2020-01-28",
            "due_date": "2020-01-31",
            "amount_due": 10.22,
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

    it("should return error if bill_date is not a date while creating a bill", function (done) {
        var payload = {
            "vendor": "Test Bill",
            "bill_date": "abc",
            "due_date": "2020-01-31",
            "amount_due": 10.22,
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

describe("GET /v1/bills", function () {
    it("should successfully return all bills of the authorized user", function (done) {
        var server = app.listen();
        request(server)
            .get("/v1/bills")
            .auth('unitTest@husky.neu.edu', 'ASfadf@12345')
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(200);
                res.body.should.be.a("array");
                done();
            });
    });

    it("should return unauthorized while fetching all bills", function (done) {
        var server = app.listen();
        request(server)
            .get("/v1/bills")
            .auth('unitTest@husky.neu.edu', 'wrongPassword')
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(401);
                res.body.should.be.a("object");
                done();
            });
    });

});

describe("GET /v1/bill/{id}", function () {

    it("should return bill of the given id when user is authorized ", function (done) {
        var server = app.listen();
        request(server)
            .get(`/v1/bill/${newBillId}`)
            .auth('unitTest@husky.neu.edu', 'ASfadf@12345')
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.should.have.property('id');
                res.body.should.have.property('owner_id');
                res.body.should.have.property('vendor');
                res.body.should.have.property('bill_date');
                res.body.should.have.property('due_date');
                res.body.should.have.property('amount_due');
                res.body.should.have.property('categories');
                res.body.should.have.property('paymentStatus');
                res.body.should.have.property('created_ts');
                res.body.should.have.property('updated_ts');
                done();
            });
    });

    it("should return bad request when a particular bill is fetched by an invalid ID ", function (done) {
        var server = app.listen();
        request(server)
            .get("/v1/bill/invalidID")
            .auth('unitTest@husky.neu.edu', 'ASfadf@12345')
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(400);
                res.body.should.be.a("object");
                done();
            });
    });

    it("should return unauthorized request when a particular bill is fetched by ID by an valid anauthorized user", function (done) {
        var server = app.listen();
        request(server)
            .get(`/v1/bill/${newBillId}`)
            .auth('unitTest2@husky.neu.edu', 'ASfadf@12345')
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(401);
                res.body.should.be.a("object");
                done();
            });
    });

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

    it("should update a bill of the given id when user is authorized ", function (done) {
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
            .put(`/v1/bill/${newBillId}`)
            .auth('unitTest@husky.neu.edu', 'ASfadf@12345')
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(200);
                res.body.should.be.a("object");
                res.body.should.have.property('id');
                res.body.should.have.property('owner_id');
                res.body.should.have.property('vendor');
                res.body.should.have.property('bill_date');
                res.body.should.have.property('due_date');
                res.body.should.have.property('amount_due');
                res.body.should.have.property('categories');
                res.body.should.have.property('paymentStatus');
                res.body.should.have.property('created_ts');
                res.body.should.have.property('updated_ts');
                done();
            });
    });

    it("should return bad request when a particular bill is updated by an invalid ID ", function (done) {
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
            .get("/v1/bill/invalidID")
            .auth('unitTest@husky.neu.edu', 'ASfadf@12345')
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(400);
                res.body.should.be.a("object");
                done();
            });
    });

    it("should return unauthorized request when a particular bill is updated by ID by an valid anauthorized user", function (done) {
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
            .get(`/v1/bill/${newBillId}`)
            .auth('unitTest2@husky.neu.edu', 'ASfadf@12345')
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(401);
                res.body.should.be.a("object");
                done();
            });
    });

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

    it("should return bad request when a particular bill is being deleted by an invalid ID ", function (done) {
        var server = app.listen();
        request(server)
            .del("/v1/bill/invalidID")
            .auth('unitTest@husky.neu.edu', 'ASfadf@12345')
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(400);
                res.body.should.be.a("object");
                done();
            });
    });

    it("should return unauthorized request when a particular bill is being deleted by ID by an valid anauthorized user", function (done) {
        var server = app.listen();
        request(server)
            .del(`/v1/bill/${newBillId}`)
            .auth('unitTest2@husky.neu.edu', 'ASfadf@12345')
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(401);
                res.body.should.be.a("object");
                done();
            });
    });

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

    it("should delete bill of the given id when user is authorized ", function (done) {
        var server = app.listen();
        request(server)
            .del(`/v1/bill/${newBillId}`)
            .auth('unitTest@husky.neu.edu', 'ASfadf@12345')
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(204);
                res.body.should.be.a("object");
                done();
            });
    });
});