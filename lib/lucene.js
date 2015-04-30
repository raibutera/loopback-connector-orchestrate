// ACKNOWLEDGEMENTS: Thanks to github/BEZEI2K for the basis of this code, which is taken from https://github.com/BEZEI2K/sails-orchestrate

var assert = require("assert");

/**
 * The purpose of this file to parse Loopback 'where''
 * objects into lucene queries. Orchestrate.js's search interface supports lucene query syntax.
 *
 * 'where' objects are expected to take one of the following forms:
 * 1. equivalence, ie.: `{where: {property: value}}`
 * 2. operator(s),
 *     a. simple operator(s) ie. `{where: {property: {op: value}}}`
 *     b. compound operator(s) ie. `{where: {<and|or>: [condition1, condition2, ...]}}`
 *         i. 'AND' compound operator
 *         ii. 'OR' compound operator
 */

function LuceneParse() {
}

function buildEquiv(key, value) {
    var output = "";

    if (key != "id") { // TODO: check if key could also be "key"
        searchString += key + ": " + value;
    } else {
        searchString += value;
    }

    return output;
}

function buildOr(conditions) {
    var orConditionCount = 0;
    var orConditionMax = conditions.length - 1;

    var output = "(";
    _.forIn(conditions, function (orCondition, orConditionKey, orConditions) {
        orConditionCount++;

        // nested AND
        if (orConditionKey == 'and') {
            output += buildAnd(orCondition);
        } else if (typeof orCondition != 'object') { // equivalence
            output += buildEquiv(orConditionKey, orCondition);
        } else if (typeof orCondition == 'object') { // operator
            output += parseOperator(orCondition);
        }

        if (orConditionCount < orConditionMax) {
            output += " OR ";
        }
    });
    output += ")";

    return output;
}

function buildAnd(conditions) {

    var andConditionCount = 0;
    var andConditionMax = conditions.length - 1;

    var output = "(";
    _.forIn(conditions, function (andCondition, andConditionKey, andConditions) {
        andConditionCount++;

        if (typeof andCondition != 'object') { // equivalence
            output += buildEquiv(andConditionKey, andCondition);
        } else { // operator
            // nested "OR"
            if (andConditionKey == 'or') {
                output += buildOr(andCondition);
            } else { // any other operator
                output += parseOperator(andCondition);
            }
        }

        if (andConditionCount < andConditionMax) {
            output += " AND ";
        }
    });
    output += ")";


    return output;
}

/**
 * builds the inital query
 *
 * @param {object} fieldObj
 * @return {string} searchString
 */

LuceneParse.prototype.parse = function (fieldObj) {
    var searchString = "";

    var howMany = Object.keys(fieldObj).length;
    var cycled = 0;

    _.forIn(fieldObj, function (value, key, collection) {

        if (value) {

            // (1) equivalence
            if (typeof value != "object") {
                searchString += buildEquiv(key, value);
            }

            // (2.b.ii) "OR" compound operators
            if (key == "or") { // TODO: abstract to be applicable to AND and AND + AND.OR (atm only OR and OR.AND)
                searchString += buildOr(value);
            }

            if (key == "and") {
                searchString += buildAnd(value);
            }

            /**
             * (2.a) simple operators and (2.b.i) 'AND' compound operators
             */
            if (key != "or" && typeof value == "object") {
                searchString += parseOperator(value, key);
            }

            cycled++;

            if (cycled < howMany) {
                searchString += " AND ";
            }

        } else {
            return null;
        }
    });

    return searchString;
};

/**
 * the finishes off the parse by look in the sub object
 * for the sails generated parameters that will then
 * be parsed into the lucene search query.
 *
 * @param {objrct} params
 * @param {string} key
 * @return {string}
 */

function parseOperator(params, key) {
    var string = "";

    for (var p in params) {
        if (p == "startsWith") string += key + ": " + params[p] + "*";
        if (p == "contains") string += key + ": " + "*" + params[p] + "*";
        if (p == "notContains") string += NOT + "'" + params[p] + "'";
        if (p == "weight") string += "^" + params[p];
        if (p == "lessThanOrEqual") string += key + ": [* TO " + params[p] + "]";
        if (p == "lessThan") string += key + ": [* TO " + ( params[p] - 1 ) + "]";
    }

    return string;
}

module.exports = new LuceneParse();
