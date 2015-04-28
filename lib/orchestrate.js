/*!
 * Module dependencies
 */
var util = require('util');
var async = require('async');
var Connector = require('loopback-connector').Connector;
var debug = require('debug')('loopback:connector:orchestrate');
var $Promise = require('bluebird');

/*!
 * Convert the id to be a BSON ObjectID if it is compatible
 * @param {*} id The id value
 * @returns {ObjectID}
 */
function ObjectID(id) {
  if (id instanceof mongodb.ObjectID) {
    return id;
  }
  if (typeof id !== 'string') {
    return id;
  }
  try {
    // MongoDB's ObjectID constructor accepts number, 12-byte string or 24-byte
    // hex string. For LoopBack, we only allow 24-byte hex string, but 12-byte
    // string such as 'line-by-line' should be kept as string
    if(/^[0-9a-fA-F]{24}$/.test(id)) {
      return new mongodb.ObjectID(id);
    } else {
      return id;
    }
  } catch (e) {
    return id;
  }
}

/*!
 * Generate the mongodb URL from the options
 */
function generateMongoDBURL(options) {
  options.hostname = (options.hostname || options.host || '127.0.0.1');
  options.port = (options.port || 27017);
  options.database = (options.database || options.db || 'test');
  var username = options.username || options.user;
  if (username && options.password) {
    return "mongodb://" + username + ":" + options.password + "@" + options.hostname + ":" + options.port + "/" + options.database;
  } else {
    return "mongodb://" + options.hostname + ":" + options.port + "/" + options.database;
  }
}

/**
 * Initialize the MongoDB connector for the given data source
 * @param {DataSource} dataSource The data source instance
 * @param {Function} [callback] The callback function
 */
exports.initialize = function initializeDataSource(dataSource, callback) {
  if (!mongodb) {
    return;
  }

  var s = dataSource.settings;

  s.safe = (s.safe !== false);
  s.w = s.w || 1;
  s.url = s.url || generateMongoDBURL(s);
  dataSource.connector = new OrchestrateConnector(s, dataSource);

  // connector instance methods
  dataSource.ObjectID = mongodb.ObjectID;

  if (callback) {
    dataSource.connector.connect(callback);
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

/**
 * Create a new model instance
 * @param {Function} callback - you must provide the created model's id to the callback as an argument
 */
OrchestrateConnector.prototype.create = function (model, data, callback) {
};

/**
 * Save a model instance
 */
OrchestrateConnector.prototype.save = function (model, data, callback) {
};

/**
 * Check if a model instance exists by id
 */
OrchestrateConnector.prototype.exists = function (model, id, callback) {
};

/**
 * Find a model instance by id
 * @param {Function} callback - you must provide an array of results to the callback as an argument
 */
OrchestrateConnector.prototype.find = function find(model, id, callback) {
};

/**
 * Update a model instance or create a new model instance if it doesn't exist
 */
OrchestrateConnector.prototype.updateOrCreate = function updateOrCreate(model, data, callback) {
};

/**
 * Delete a model instance by id
 */
OrchestrateConnector.prototype.destroy = function destroy(model, id, callback) {
};

/**
 * Query model instances by the filter
 */
OrchestrateConnector.prototype.all = function all(model, filter, callback) {
};

/**
 * Delete all model instances
 */
OrchestrateConnector.prototype.destroyAll = function destroyAll(model, where, callback) {
};

/**
 * Count the model instances by the where criteria
 */
OrchestrateConnector.prototype.count = function count(model, callback, where) {
};

/**
 * Update the attributes for a model instance by id
 */
OrchestrateConnector.prototype.updateAttributes = function updateAttrs(model, id, data, callback) {
};
