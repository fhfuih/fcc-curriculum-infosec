**FreeCodeCamp**

## `.env` entries

```
SESSION_SECRET=
DATABASE=
```

## Issues

The following four test cases are not fulfiled even though they should be. 
This may be because the FCC tests are sometiems strict text match of `server.js`, and some styling inconsistency with the provided snippet corrupts the tests.
* Create New Middleware
* How to Put a Profile Together
* Logging a User Out
* Registration of New Users

## Things not mentioned: `req.isAuthenticated()`

If one follows the FCC instructions, the `req.isAuthenticated()` does not survive redirects. 
In other words, if one immediately tests `req.isAuthenticated()` in `/login`, it works. But in `/profile`, it *always* returns `false`.
Unfortunately this function is not documented in PassportJS website. One must note the following in order to get it work:

1. Set the middlewares in correct order because they have dependency relationships. It should be `session -> passport.initialize -> passport.session`.
2. This may be concerning some security settings of the cookie. After browsing some stackoverflow threads I have made it work by adding two lines.

```js
fccTesting(app); //For FCC testing purposes
app.set('views', './views/pug')
app.set('view engine', 'pug');
app.enable('trust proxy'); /* Add this */

app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: true }, /* Add this */
}));
app.use(passport.initialize());
app.use(passport.session());
```

The second point rely on the fact that **we have HTTPS for glitch projects**. 
If only HTTP, a presumable solution (not tested) is **removing `app.enable('trust proxy')` and setting `cokkie: {secure: false}`**.

## Things not mentioned: updating packages

The MongoDB in the boilerplate is quite outdated. After updating to `^3.0`, the connection codes should be 

```js
mongo.connect(process.env.DATABASE, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    if(err) {
        console.log('Database error: ' + err);
    } else {
        const db = client.db('infoSec');
        console.log('Successful database connection');
        // use this db below
```

## Things not mentioned: `.env`
Add `dotenv` package to import `.env` variables. See its docs for mor info.
