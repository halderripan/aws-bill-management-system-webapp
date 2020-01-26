/**
 * @file indexController.js
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

describe("POST /v1/user", function () {
    // it("should successfully create a new user object", function (done) {
    //     var payload = {
    //         email_address: "testDemo@abc.abc",
    //         first_name: "Lord",
    //         last_name: "Ripan",
    //         password: "ASfadf@12345"
    //     };
    //     var server = app.listen();
    //     request(server)
    //         .post("/v1/user")
    //         .send(payload)
    //         .end(function (err, res) {
    //             if (err) done(err);
    //             res.should.have.status(201);
    //             res.body.should.be.a("object");
    //             done();
    //         });
    // });

    it("should return and error if email address is not present while creating an user", function (done) {
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
            .auth('testDemo@abc.abc', 'ASfadf@12345')
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(200);
                res.body.should.be.a("object");
                done();
            });
    });

    it("should return unauthorized", function (done) {
        var server = app.listen();
        request(server)
            .get("/v1/user/self")
            .auth('testDemo@abc.abc', 'wrongPassword')
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
            email_address: "testDemo@abc.abc",
            first_name: "Lord",
            last_name: "Ripan",
            password: "ASfadf@12345"
        };
        request(server)
            .put("/v1/user/self")
            .auth('testDemo@abc.abc', 'ASfadf@12345')
            .send(payload)
            .end(function (err, res) {
                if (err) done(err);
                res.should.have.status(200);
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