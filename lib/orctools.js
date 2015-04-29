var _ = require('lodash');
var debug = require('debug')('orchestrator:tools');

var extractKey = function extractKeyFromResponse(response) {
    if (response && response.headers && response.headers.location) {
        return response.headers.location.split("/")[3];
    } else {
        throw new Error('could not extract key from Orchestrator response: missing response');
    }
};

var parseData = function parseData(obj) {
    for (var p in obj.path) {
        if (p === "key") {
            obj.value.id = obj.path[p];
        } else if (p !== "collection") {
            obj.value[p] = obj.path[p];
        }
    }

    obj.value.createdAt = new Date(obj.value.createdAt);
    obj.value.updatedAt = new Date(obj.value.updatedAt);

    return obj.value;
};

var makeArray = function makeArray(input) {
    return _.map(input, function (value, key, collection) {
        return parseData(value);
    });
};

var normalize = function normalizeResponseData(model) {
    if (!_.isArray(model)) {
        model = parseData(model);
    } else if (_.isArray(model)) {
        model = makeArray(model);
    }

    return model;
};

var convertData = function convertData(model, data) {
    if (!model) {
        throw new Error('could not convert data (missing model)');
    }
    if (!data) {
        return null;
    }

    //var props = this._models[model].properties;
    //for(var p in props){
    //    var prop = props[p];
    //}
    return data;
};

module.exports = {
    extractKey: extractKey,
    normalize: normalize,
    convert: convertData
};