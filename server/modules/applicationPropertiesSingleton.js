var Sequelize = require('sequelize');
const pg = require('pg');
var sequelize = new Sequelize('cloudassignment', 'postgres', 'Qwe1Asd2Zxc3',
    {
        host: 'localhost',
        dialect: 'postgres'
    }

);
const username = 'postgres';
const password = 'Qwe1Asd2Zxc3';
const host = 'localhost';
const dbName = 'cloudassignment';
const conStringPri = 'postgres://' + username + ':' + password + '@' + host + '/postgres';
const conStringPost = 'postgres://' + username + ':' + password + '@' + host + '/' + dbName;

const init = function(callback){
// connect to postgres db
pg.connect(conStringPri, function(err, client, done) { 
    // create the db and ignore any errors, for example if it already exists.
    client.query('CREATE DATABASE ' + dbName, function(err) {
        //db should exist now, initialize Sequelize
        var sequelize = new Sequelize(conStringPost);
        callback(sequelize);
        client.end(); // close the connection
    });
  });
}

module.exports = {
    sequelize, init
}