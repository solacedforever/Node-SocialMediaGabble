const {Strategy} = require('passport-local');
const passport = require('passport');
const client = require('./client');

passport.use(new Strategy(
    function(username, password, done) {
      client.query('SELECT * FROM users WHERE username=$1', [username], function (err, dbResponse) {
        if (err) {
          done(err)
        }else{
          const user = dbResponse.rows[0];
          if (user.password === password) {
            return done(null,user)
          }else{
            return done(null, false, {
              message: "there is no user with that username and password."
            })
          }
        }
      })
    })
);

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  client.query('SELECT * FROM users WHERE id=$1', [id], function (err, dbResponse){
    const user = dbResponse.rows[0];
    done(err, user);
  });
});
module.exports = passport;
