exports.up = function(db, callback) {
  db.runSql('DROP TABLE IF EXISTS post_votes CASCADE;', function() {
    db.runSql('DROP TABLE IF EXISTS comment_votes CASCADE;', callback);
  });
};

exports.down = function(db, callback) {
  db.runSql(`CREATE TABLE post_votes (
    user_id integer NOT NULL,
    post_id integer NOT NULL,
    vote_value integer NOT NULL,
    PRIMARY KEY (user_id, post_id)
  );`, function() {
    db.runSql(`CREATE TABLE comment_votes (
      user_id integer NOT NULL,
      comment_id integer NOT NULL,
      vote_value integer NOT NULL,
      PRIMARY KEY (user_id, comment_id)
    );`, callback);
  });
}; 