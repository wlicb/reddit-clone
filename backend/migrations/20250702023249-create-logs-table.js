'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.runSql(`
    CREATE TABLE logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(50) NOT NULL,
      target_id INTEGER,
      target_type VARCHAR(50),
      metadata JSONB,
      timestamp TIMESTAMPTZ DEFAULT now()
    );
  `);
};

exports.down = function (db) {
  return db.runSql(`DROP TABLE IF EXISTS logs;`);
};

exports._meta = {
  "version": 1
};
