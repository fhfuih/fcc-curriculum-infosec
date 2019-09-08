'use strict';

require('dotenv').config()
const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const session     = require('express-session');
const passport    = require('passport');
const mongodb     = require('mongodb');
const MongoClient = mongodb.MongoClient;

const GitHubStrategy = require('passport-github').Strategy;

const auth = require('./auth.js');
const routes = require('./routes.js');

const app = express();

fccTesting(app); //For FCC testing purposes
app.set('views', './views/pug')
app.set('view engine', 'pug');
app.enable('trust proxy');

app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: true },
}));
app.use(passport.initialize());
app.use(passport.session());


const mongo = new MongoClient(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true })

mongo.connect((err) => {
  if (err) {
    console.warn(err);
  } else {
    console.log('Successfullly connected to database');
    const db = mongo.db('infoSec')
    
    auth(app, db);

    routes(app, db);
    


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


