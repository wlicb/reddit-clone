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
    CREATE TABLE post_views (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, post_id)
    );
  `);
};

exports.down = function (db) {
  return db.runSql(`DROP TABLE IF EXISTS post_views;`);
};

exports._meta = {
  "version": 1
}; 