'use strict';

require('dotenv').config()
const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const session     = require('express-session');
const passport    = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongodb     = require('mongodb');
const ObjectID    = mongodb.ObjectID;
const MongoClient = mongodb.MongoClient;

const app = express();

fccTesting(app); //For FCC testing purposes
app.set('views', './views/pug')
app.set('view engine', 'pug');

app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'dumbdumb',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: true },
}));
app.use(passport.initialize());
app.use(passport.session());

function ensureAuthenticated(req, res, next) {
  // req.isAuthenticated
  console.log(req.isAuthenticated, req.isAuthenticated(), req.account, req.user)
  if (req.account) {
    console.log('resolving GET /profile');
    return next();
  } else {
    console.log('rejecting GET /profie');
    res.redirect('/');
  }
}

const mongo = new MongoClient(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true })

mongo.connect((err) => {
  if (err) {
    console.warn(err);
  } else {
    console.log('Successfullly connected to database');
    const db = mongo.db('infoSec')
    
    passport.serializeUser((user, done) => {
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
          if (password !== doc.password) {
            return done(null, false)
          }
          return done(null, doc)
        })
      }
    ))

    app.route('/')
      .get((req, res) => {
        res.render('index', {title: 'Hello', message: 'Please login', showLogin: true, showRegistration: true});
      });
    
    app.route('/profile')
      .get(
        (req, res, next) => {
          console.log('in /profile', req.isAuthenticated(), req.user);
          if (req.isAuthenticated()) {
            next();
          } else {
            res.redirect('/');
          }
        },
        (req, res) => {
          res.render('profile', { username: req.user.username })
        }
      )

    app.route('/login')
      .post(
        passport.authenticate('local', { failureRedirect: '/' }),
        (req, res, next) => {
          console.log('in /login', req.isAuthenticated(), req.user);
          req.session.save((err) => {
            if (err) {
              return next(err)
            }
            res.redirect('/profile')
          })
        }
      )

    app.route('/logout')
      .get((req, res, next) => {
        req.logout();
        req.session.save((err) => {
          if (err) {
            return next(err)
          }
          res.redirect('/')
        })
      });
    
    app.route('/register')
      .post(
        (req, res, next) => {
          const { username, password } = req.body;
          db.collection('users').findOne({ username: req.body.username }, (err, user) => {
            if (err) {
              next(err);
            } else if (user) {
              console.log('User to register already exists')
              res.redirect('/');
            } else {
              db.collection('users').insertOne({ username, password }, (err, newUser) => {
                if (err) {
                  next(err);
                } else {
                  console.log('Inserted new user to the database', newUser.username)
                  next(null, newUser);
                }
              })
            }
          })
        },
        passport.authenticate('local', { failureRedirect: '/', successRedirect: '/profile' })
      );


    app.use((req, res, next) => {
      res.status(404)
        .type('text')
        .send('Not Found');
    });

    
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
  }
})


