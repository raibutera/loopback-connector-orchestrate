/*
 Amazon US East  Virginia       api.aws-us-east-1.orchestrate.io/
 Amazon EU West  Ireland        api.aws-eu-west-1.orchestrate.io/
 CenturyLink VA1 Virginia       api.ctl-va1-a.orchestrate.io/
 CenturyLink UC1 California     api.ctl-uc1-a.orchestrate.io/
 CenturyLink GB3 Great Britain  api.ctl-gb3-a.orchestrate.io/
 CenturyLink SG1 Singapore      api.ctl-sg1-a.orchestrate.io/
 */

var orchestrate = require('orchestrate');
var debug = require('debug')('loopback:connector:orchestrate');
var $Promise = require('bluebird');

module.exports = function (settings) {
    return new $Promise(function (resolve, reject) {
        var db;

        if (settings) {

            var masterKey, endpoint;

            if (!settings.authToken) {
                throw new Error('missing orchestrate auth token');
            } else {
                masterKey = settings.authToken;
            }

            if (!settings.endpoint) {
                endpoint = "api.aws-us-east-1.orchestrate.io";
                debug('using default endpoint (US East)');
            } else {
                endpoint = settings.endpoint;
                debug('using custom endpoint (' + settings.endpoint + ')');
            }

            orchestrate.ApiEndPoint = endpoint;
            db = orchestrate(masterKey);

            db.ping().then(function () {
                resolve(db);
            }).fail(function (err) {
                reject(err);
            });

        } else {
            reject(new Error('missing orchestrate settings object'));
        }
    });
};
