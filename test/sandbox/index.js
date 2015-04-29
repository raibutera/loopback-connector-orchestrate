var orchestrate = require('orchestrate');
var debug = require('debug')('loopback:connector:orchestrate:SANDBOX');
var $Promise = require('bluebird');

orchestrate.ApiEndPoint = "api.aws-eu-west-1.orchestrate.io";
var db = orchestrate('efbe86d4-e9fd-4801-afb6-3135446859b5');

db.ping().then(function () {
    debug('successfully connected');
}).fail(function (error) {
    debug('failed to connect: ', error);
});