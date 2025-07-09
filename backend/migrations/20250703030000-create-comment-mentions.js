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
    CREATE TABLE comment_mentions (
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    mentioned_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (comment_id, mentioned_user_id)
    );
  `);
};

exports.down = function (db) {
  return db.runSql(`DROP TABLE IF EXISTS comment_mentions;`);
};

exports._meta = {
  "version": 1
};
