// ACKNOWLEDGEMENTS: Thanks to github/BEZEI2K for the basis of this code, which is taken from https://github.com/BEZEI2K/sails-orchestrate

var assert = require("assert");

/**
 * The purpose of this file to parse Loopback 'where' filter objects into lucene queries.
 * Orchestrate.js's search interface supports lucene query syntax.
 *
 * Official Strongloop 'Where' Filter Documentation: http://docs.strongloop.com/display/public/LB/Where+filter
 *
 * 'where' objects are expected to take one of the following forms (not official strongloop terminology):
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
            output += parseOperator(orConditionKey, orCondition);
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
                output += parseOperator(andConditionKey, andCondition);
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
            if (key != "or" && key != "and" && typeof value == "object") {
                searchString += parseOperator(value, key);
            }

            cycled++;

            if (cycled < howMany) {
                searchString += " AND ";
            }

        } else {
            cycled++;
            return null;
        }
    });

    return searchString;
};


/**
 * converts an operator property + value into its lucene equivalent.
 * @param field        the property name, e.g: e.g: 4, 'foo', new Date() - (30 * 24 * 60 * 60 * 1000)  // Month in milliseconds;
 * @param operator     the operator name, ie: gt,gte,lt,lte,between,inq,nin,near,neq,like,nlike NB: NOT 'and' or 'or'.
 * @param value        the operator parameters, e.g: 9, 'bar', new Date()
 */
function op(field, operator, value) {
    var output = "";

    switch (operator) {
        case 'startsWith':
            output += field + ": " + value + "*";
            break;
        case 'endsWith':
            output += field + ": " + "*" + value;
            break;
        case 'contains':
            output += field + ": " + "*" + value + "*";
            break;
        case 'notContains':
            break;
        case 'gt':
            output += field + ": " + value;
            break;
        case 'gte':
            output += field + ": " + value;
            break;
        case 'lt':
            output += field + ": " + value;
            break;
        case 'lte':
            output += field + ": " + value;
            break;
        case 'between':
            output += field + ": " + value;
            break;
        case 'inq':
            output += field + ": " + value;
            break;
        case 'nin':
            output += field + ": " + value;
            break;
        case 'near':
            output += field + ": " + value;
            break;
        case 'neq':
            output += field + ": " + value;
            break;
        case 'like':
            output += field + ": " + value;
            break;
        case 'nlike':
            output += field + ": " + value;
            break;
        case 'and':
            output += field + ": " + value;
            break;
        case 'or':
            output += field + ": " + value;
            break;
        default:
            throw new Error('lucene.op: unsupported operator', operator);
            break;
    }

    return output;
}

/**
 * the finishes off the parse by look in the sub object
 * for the sails generated parameters that will then
 * be parsed into the lucene search query.
 *
 * @param {object} field
 * @param {string} condition
 * @return {string} output
 */

function parseOperator(field, condition) {
    var output = "";

    _.forIn(condition, function (value, operator, all) {
        if (!operator || operator == "or" || operator == "and") {
            throw new Error('lucene.parseOperator: missing/invalid operator', operator);
        } else {
            output += op(field, operator, value);
        }
    });

    return output;
}

module.exports = new LuceneParse();
