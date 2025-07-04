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

exports.up = function(db) {
  return db.runSql(`
    ALTER TABLE users
      ADD COLUMN isAdmin VARCHAR(10),
      ADD COLUMN isBot VARCHAR(10),
      ADD COLUMN selectedSubreddit VARCHAR(25);
  `);
};

exports.down = function(db) {
  return db.runSql(`
    ALTER TABLE users
      DROP COLUMN isAdmin,
      DROP COLUMN isBot,
      DROP COLUMN selectedSubreddit;
  `);
};

exports._meta = {
  "version": 1
};
