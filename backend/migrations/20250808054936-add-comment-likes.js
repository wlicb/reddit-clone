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

exports.up = function(db, callback) {
  db.runSql(`CREATE TABLE comment_likes (
    user_id integer NOT NULL,
    comment_id integer NOT NULL,
    created_at timestamptz DEFAULT NOW(),
    PRIMARY KEY (user_id, comment_id),
    CONSTRAINT fk_comment_likes_user
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_comment_likes_comment
      FOREIGN KEY (comment_id)
      REFERENCES comments(id)
      ON DELETE CASCADE
  );`, function() {
    db.runSql(`CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);`, function() {
      db.runSql(`CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);`, callback);
    });
  });
};

exports.down = function(db, callback) {
  db.runSql('DROP TABLE IF EXISTS comment_likes CASCADE;', callback);
};

exports._meta = {
  "version": 1
};
