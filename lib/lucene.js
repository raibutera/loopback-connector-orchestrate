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
                if (key != "id") { // TODO: check if key could also be "key"
                    searchString += key + ": " + value;
                } else {
                    searchString += value;
                }
            }

            // (2.b.ii) "OR" compound operators
            if (key == "or") { // TODO: abstract to be applicable to AND and AND + AND.OR (atm only OR and OR.AND)
                searchString += "(";

                var orConditionCount = 0;
                var orConditionMax = value.length - 1;
                _.forIn(value, function(orCondition, orConditionKey, orConditions){
                    orConditionCount++;

                    // nested AND
                    if(orConditionKey == 'and'){
                        searchString += "(";

                        var nestedAndConditionCount = 0;
                        var nestedAndConditionMax = orCondition.length - 1;

                        _.forIn(orCondition, function(nestedAndCondition, nestedAndConditionKey, nestedAndConditions){
                            nestedAndConditionCount++;

                            if (typeof nestedAndCondition != 'object'){ // equivalence
                                searchString += nestedAndConditionKey + ": " + nestedAndCondition;
                            } else { // operator
                                searchString += parseOperator(nestedAndCondition);
                            }

                            if(nestedAndConditionCount < nestedAndConditionMax){
                                searchString += " AND ";
                            }
                        });

                        searchString += ")";

                    } else if (typeof orCondition != 'object'){ // equivalence
                        searchString += orConditionKey + ": " + orConditionValue;
                    } else if (typeof orCondition == 'object'){ // operator
                        searchString += parseOperator(orCondition);
                    }

                    if(orConditionCount < orConditionMax){
                        searchString += " OR ";
                    }
                });
            }

            /**
             * (2.a) simple operators and (2.b.i) 'AND' compound operators
             */
            if (key != "or" && typeof value == "object") {
                searchString += parseOperator(value, key);
            }

            cycled++;

            if(cycled < howMany){
                searchString += " AND ";
            }

        } else {
            return null;
        }
    });

    return searchString;
};

/**
 * parses the sub objects of waterline generated
 * queries
 *
 * @param {object} object
 * @return {string}
 */

function subLucene(object) {
    string = "";
    var howmany = Object.keys(object).length;

    var done = 0;
    for (var key in object) {
        done++;
        var params = object[key];
        if (typeof params == "object") {
            string += parseOperator(params, key);
        }
        else {
            string += key + ": '" + object[key] + "'";
        }

    }
    return string;
}

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
