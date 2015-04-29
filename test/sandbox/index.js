var orchestrate = require('orchestrate');
var debug = require('debug')('loopback:connector:orchestrate:SANDBOX');
var $Promise = require('bluebird');
var characters = require('../fakedata/characters.json');

orchestrate.ApiEndPoint = "api.aws-eu-west-1.orchestrate.io";
var db = orchestrate('efbe86d4-e9fd-4801-afb6-3135446859b5');

db.ping().then(function () {
    debug('successfully connected');
}).fail(function (error) {
    debug('failed to connect: ', error);
});


db.post('testing', characters[1]).then(function (result) {
    debug('result', result.toJSON());
}).fail(function (err) {
    debug('error', err);
});

