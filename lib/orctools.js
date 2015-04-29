var _ = require('lodash');
var debug = require('debug')('orchestrator:tools');

var extractKey = function extractKeyFromResponse(response) {
    if (response && response.headers && response.headers.location) {
        return response.headers.location.split("/")[3];
    } else {
        throw new Error('could not extract key from Orchestrator response: missing response');
    }
};

module.exports = {
    extractKey: extractKey
};