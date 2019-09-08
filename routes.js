const bcrypt      = require('bcrypt')
const passport    = require('passport');

function ensureAuthenticated(req, res, next) {
  // req.isAuthenticated
  if (req.isAuthenticated()) {
    console.log('resolving GET /profile');
    return next();
  } else {
    console.log('rejecting GET /profie');
    res.redirect('/');
  }
}

module.exports = function (app, db) {
  app.route('/')
    .get((req, res) => {
      res.render('index', {title: 'Hello', message: 'Please login', showLogin: true, showRegistration: true});
    });

  app.route('/profile')
    .get(
      ensureAuthenticated,
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
        const hash = bcrypt.hashSync(req.body.password, 12);
        db.collection('users').findOne({ username: req.body.username }, (err, user) => {
          if (err) {
            next(err);
          } else if (user) {
            console.log('User to register already exists')
            res.redirect('/');
          } else {
            db.collection('users').insertOne({ username, password: hash }, (err, newUser) => {
              if (err) {
                next(err);
              } else {
                console.log('Inserted new user to the database')
                next(null, newUser);
              }
            })
          }
        })
      },
      passport.authenticate('local', { failureRedirect: '/', successRedirect: '/profile' })
    );
}