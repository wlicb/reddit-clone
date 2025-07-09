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
        CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL, -- 'mention' or 'reply'
        comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        read BOOLEAN DEFAULT FALSE
        );
  `);
};

exports.down = function (db) {
  return db.runSql(`DROP TABLE IF EXISTS notifications;`);
};

exports._meta = {
  "version": 1
};
