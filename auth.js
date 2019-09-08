const bcrypt        = require('bcrypt');
const passport      = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongodb       = require('mongodb');
const ObjectID      = mongodb.ObjectID;

module.exports = function (app, db) {
  passport.serializeUser((user, done) => {
    console.log('user to serialize: ', user)
    done(null, user._id.toString())
  });
  passport.deserializeUser((id, done) => {
    db.collection('users').findOne({ _id: new ObjectID(id) }, (err, doc) => done(null, doc))
  });

  passport.use(new LocalStrategy(
    function(username, password, done) {
      db.collection('users').findOne({ username }, (err, doc) => {
        if (err) {
          return done(err)
        }
        if (!doc) {
          return done(null, false)
        }
        if (!bcrypt.compareSync(password, doc.password)) {
          return done(null, false)
        }
        return done(null, doc)
      })
    }
  ))
}