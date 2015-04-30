


var _ = require('lodash');

/**
 * builds a
 * @param model
 * @param where
 * @returns {{}}
 */
function buildWhere(model, where) {
    var self = this;
    var query = {};
    if (where === null || (typeof where !== 'object')) {
        return query;
    }
    var idName = self.idName(model);
    Object.keys(where).forEach(function (k) {
        var cond = where[k];
        if (k === idName) { //
            k = '_id';
            cond = ObjectID(cond);
        }
        if (k === 'and' || k === 'or' || k === 'nor') {
            if (Array.isArray(cond)) {
                cond = cond.map(function (c) {
                    return self.buildWhere(model, c);
                });
            }
            query['$' + k] = cond;
            delete query[k];
            return;
        }
        var spec = false;
        var options = null;
        if (cond && cond.constructor.name === 'Object') {
            options = cond.options;
            spec = Object.keys(cond)[0];
            cond = cond[spec];
        }
        if (spec) {
            if (spec === 'between') {
                query[k] = {$gte: cond[0], $lte: cond[1]};
            } else if (spec === 'inq') {
                query[k] = {
                    $in: cond.map(function (x) {
                        if ('string' !== typeof x) return x;
                        return ObjectID(x);
                    })
                };
            } else if (spec === 'like') {
                query[k] = {$regex: new RegExp(cond, options)};
            } else if (spec === 'nlike') {
                query[k] = {$not: new RegExp(cond, options)};
            } else if (spec === 'neq') {
                query[k] = {$ne: cond};
            }
            else {
                query[k] = {};
                query[k]['$' + spec] = cond;
            }
        } else {
            if (cond === null) {
                // http://docs.mongodb.org/manual/reference/operator/query/type/
                // Null: 10
                query[k] = {$type: 10};
            } else {
                query[k] = cond;
            }
        }
    });
    return query;
};

module.exports = buildWhere;