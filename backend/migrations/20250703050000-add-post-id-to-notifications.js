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
    ALTER TABLE notifications 
    ADD COLUMN post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE;
  `);
};

exports.down = function (db) {
  return db.runSql(`
    ALTER TABLE notifications 
    DROP COLUMN post_id;
  `);
};

exports._meta = {
  "version": 1
}; 