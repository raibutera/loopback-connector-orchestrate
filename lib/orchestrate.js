/*!
 * Module dependencies
 */
var orchestrate = require('orchestrate');
var util = require('util');
var async = require('async');
var Connector = require('loopback-connector').Connector;
var debug = require('debug')('loopback:connector:orchestrate');
var $Promise = require('bluebird');
var orchestrateConnection = require('./connection');

/**
 * Initialize the MongoDB connector for the given data source
 * @param {DataSource} dataSource The data source instance
 * @param {Function} [callback] The callback function
 */
exports.initialize = function initializeDataSource(dataSource, callback) {
    if (!mongodb) {
        return;
    }

    var s = dataSource.settings || {};

    s.safe = (s.safe !== false);
    s.w = s.w || 1;
    s.url = s.url || generateMongoDBURL(s);
    dataSource.connector = new OrchestrateConnector(s, dataSource);

    // connector instance methods
    dataSource.ObjectID = mongodb.ObjectID;

    if (callback) {
        dataSource.connector.connect(s, callback);
    }
};

/**
 * The constructor for Orchestrate connector
 * @param {Object} settings The settings object
 * @param {DataSource} dataSource The data source instance
 * @constructor
 */
function OrchestrateConnector(settings, dataSource) {
    Connector.call(this, 'orchestrate', settings);

    this.debug = settings.debug || debug.enabled;

    if (this.debug) {
        debug('Orchestrate Settings: %j', settings);
    }

    this.dataSource = dataSource;
}

util.inherits(OrchestrateConnector, Connector);
OrchestrateConnector.prototype.tools = require('./orctools');

/**
 * Connect to Orchestrate
 * @param {Function} [callback] The callback function
 *
 * @callback callback
 * @param {Error} err The error object
 * @param {Db} db The Orchestrate db object
 */
OrchestrateConnector.prototype.connect = function (settings, callback) {
    var self = this;
    if (self.db) {
        process.nextTick(function () {
            if (callback) {
                callback(null, self.db);
            }
        });
    } else {
        // TODO: inject settings as a parameter to connection
        orchestrateConnection(settings)
            .then(function (db) {
                if (self.debug) {
                    debug('Orchestrate connection is established.');
                }
                self.db = db;
                if (callback) {
                    callback(null, db);
                }
            })
            .catch(function (err) {
                if (self.debug || !callback) {
                    console.error('Orchestrate connection failed: ', err);
                }
                if (callback) {
                    callback(err, null);
                }
            });
    }
};

/**
 * Create a new model instance
 * @param {Function} callback - you must provide the created model's id to the callback as an argument
 */
OrchestrateConnector.prototype.create = function (model, data, callback) {
    // TODO: (OrchestrateConnector) implement CREATE
    var self = this;
    if (self.debug) {
        debug('create', model, data);
    }
    if (!self.db) {
        return callback(new Error('no orchestrate database'));
    }

    var idValue = self.getIdValue(model, data);
    var idName = self.idName(model);
    var create = self.db;

    if (idValue === null) { // no existing id?
        delete data[idName]; // Allow Orchestrate to generate the id
        create = create.post(model, data);
    } else {
        delete data[idName];
        create = create.put(model, idValue, data);
    }

    create.then(function (response) {
        if (self.debug) {
            debug('create.response', model, response);
        }
        return callback(null, self.tools.extractKey(response));
    }).fail(function (err) {
        if (self.debug) {
            debug('create.ERROR', model, err);
        }
        return callback(err);
    });
};

/**
 * Save a model instance
 */
OrchestrateConnector.prototype.save = function (model, data, callback) {
    // TODO: (OrchestrateConnector) implement SAVE
    var self = this;
    if (self.debug) {
        debug('save', model, data);
    }

    var idValue = self.getIdValue(model, data);
    var idName = self.idName(model);

    if (!self.db) {
        var error = new Error('no orchestrate connection');
        callback && callback(error);
        throw error;
    }

    db.put(model, idValue).then(function (putResponse) {
        if (self.debug) {
            debug('save.callback', model, putResponse);
        }

        var error;

        if (putResponse) {
            if (putResponse.statusCode && putResponse.statusCode == 201) {
                error = null;
            } else {
                error = new Error('invalid response from Orchestrate put', putResponse);
            }
        } else {
            error = new Error('no response from Orchestrate put!');
        }

        return callback && callback(error, putResponse);
    }).fail(function (putError) {
        if (self.debug) {
            debug('save.callback.ERROR', model, putError);
        }

    });
};

/**
 * Check if a model instance exists by id
 */
OrchestrateConnector.prototype.exists = function (model, id, callback) {
    // TODO: (OrchestrateConnector) implement EXISTS
    var self = this;
    if (self.debug) {
        debug('exists', model, id);
    }

    if (!self.db) {
        var error = new Error('no orchestrate connection');
        callback && callback(error);
        throw error;
    }

    self.db.get(model, id).then(function (successResponse) {
        if (self.debug) {
            debug('exists.response', 'GET', model, id, 'success');
        }

        return callback && callback(null, successResponse);
    }).fail(function (errResponse) {
        if (self.debug) {
            debug('exists.response', 'GET', model, id, 'fail ' + (errResponse && errResponse.statusCode ? errResponse.statusCode : '(unknown)'));
        }

        return callback && callback(errResponse);
    });
}

/**
 * Find a model instance by id
 * @param {Function} callback - you must provide an array of results to the callback as an argument
 */
OrchestrateConnector.prototype.find = function find(model, id, callback) {
    // TODO: (OrchestrateConnector) implement FIND
    var self = this;
    if (self.debug) {
        debug('find', model, id);
    }

    if (!self.db) {
        var error = new Error('no orchestrate connection');
        callback && callback(error);
        throw error;
    }

    self.db.get(model, id).then(function (result) {
        if (result) {
            if (self.debug) {
                debug('find.callback', model, id, (result && result.body ? result.body : result ? result : 'no data'));
            }

            if (result.body) {
                result = self.tools.convert(model, result.body);
                // TODO: check if id inclusion necessary when object found
                // result.id = id;
                return callback && callback(null, result);
            } else {
                return callback && callback(new Error('invalid response from Orchestrate (missing body)', result));
            }
        } else {
            return callback && callback(new Error('no data returned from orchestrate.get', model, id));
        }
    }).fail(function (err) {
        return callback && callback(err ? err : new Error('no data returned from orchestrate.get'));
    });
};

/**
 * Update a model instance or create a new model instance if it doesn't exist
 */
OrchestrateConnector.prototype.updateOrCreate = function updateOrCreate(model, data, callback) {
    // TODO: (OrchestrateConnector) implement UPDATEORCREATE
    var self = this;
    if (self.debug) {
        debug('updateOrCreate', model, data);
    }
    if (!self.db) {
        return callback && callback(new Error('could not updateOrCreate (not connected to Orchestrate.)'));
    }

    var idValue = self.getIdValue(model, data);
    var idName = self.idName(model);
    data[idName] && delete data[idName];

    self.db.put(model, idValue, data)
        .then(function (response) {
            if (self.debug) {
                debug('create.response', model, response && response.statusCode ? response.statusCode : response ? response : 'no response??');
            }

            //TODO: check if need to reattach ID
            var id = idValue || self.tools.extractKey(response);
            self.setIdValue(model, data, id);

            if (id) {
                return callback && callback(null, data);
            } else {
                return callback && callback(new Error('no id'), data);
            }
        })
        .fail(function (err) {
            if (self.debug) {
                debug('create.ERROR', model, err);
            }
            return callback(err);
        });
};

/**
 * Delete a model instance by id
 */
OrchestrateConnector.prototype.destroy = function destroy(model, id, callback) {
    // TODO: (OrchestrateConnector) implement DESTROY
    var self = this;
    if (self.debug) {
        debug('destroy', model, id);
    }


    /*
     // from sails-orchestrate

     var self = this;
     var finalResults = [];
     var testing = options.where ? "true" : "false";
     self.find(connection, collection, options, function (err, results){
     if(err) cb(err);
     if(Array.isArray(results) && testing === "true"){
     results.forEach(function(r){
     iterDelete(collection, r, function (err, result){
     if(err) cb(err);
     finalResults.push(result);
     if(finalResults.length === results.length){
     cb(null, finalResults);
     }
     });
     });
     } else {

     var remove = db;
     if(testing === "true"){
     remove = remove.remove(collection, results.id, true);
     }

     if(testing === "false"){
     remove = remove.deleteCollection(collection);
     }
     remove.then(function(results){
     results = results.body.results ? results.body.results : results.body.value ? results.body.value : results.body;
     cb(null, results);
     })
     .fail(function (err){
     cb(err);
     });
     }
     });
     */
};

/**
 * Query model instances by the filter
 */
OrchestrateConnector.prototype.all = function all(model, filter, callback) {
    // TODO: (OrchestrateConnector) implement ALL
    var self = this;
    if (self.debug) {
        debug('all', model, filter);
    }
};

/**
 * Delete all model instances
 */
OrchestrateConnector.prototype.destroyAll = function destroyAll(model, where, callback) {
    // TODO: (OrchestrateConnector) implement DESTROYALL
    var self = this;
    if (self.debug) {
        debug('destroyAll', model, where);
    }
};

/**
 * Count the model instances by the where criteria
 */
OrchestrateConnector.prototype.count = function count(model, callback, where) {
    // TODO: (OrchestrateConnector) implement COUNT
    var self = this;
    if (self.debug) {
        debug('count', model, where);
    }
};

/**
 * Update the attributes for a model instance by id
 */
OrchestrateConnector.prototype.updateAttributes = function updateAttrs(model, id, data, callback) {
    // TODO: (OrchestrateConnector) implement UPDATEATTRIBUTES
    var self = this;
    if (self.debug) {
        debug('updateAttributes', model, id, data);
    }
};

