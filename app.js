const express = require('express');
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const session = require('express-session');
const expressValidator = require('express-validator');
const passport = require('./authentication');
const app = express();
const client = require('./client');

app.use(express.static('public'));

app.engine('mustache', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', __dirname + '/views');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: 'Wham!MakeItBig',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(request, response) {
  request.session.last_visit = new Date();
  console.log('session is ', request.session);
  response.render('index');
});

app.get('/signup', function(request, response) {
  response.render('signup');
});

app.post('/signup', function(request, response, next) {
  const {
    username,
    password
  } = request.body;
  const insert = 'INSERT INTO users(username, password) VALUES($1, $2)';
  client.query(insert, [username, password], function(err, dbResponse) {
    passport.authenticate('local', function(error, user) {
      if (error) {
        next(error);
      } else if (!user) {
        response.redirect('/login');
      } else {
        request.login(user, function(err) {
          if (err) {
            next(err);
          } else {
            response.redirect('/');
          }
        })
      }
    })(request, response, next);
  });
});

app.get('/login', function(request, response) {
  response.render('login');
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/newGabble',
  failureRedirect: '/login'
}))

app.post('/logout', function(request, response) {
  request.session.destroy()
  response.redirect('/')
});

app.get('/newGabble', function(request, response) {
  response.render('newGabble', {
    currentUser: request.user
  });
});

app.post('/newGabble', function(request, response) {
  let current_date = new Date();
  client.query('INSERT INTO messages (title, body, user_id, messageTime) VALUES($1, $2, $3, $4)', [request.body.title, request.body.message, request.session.passport.user, current_date], (err, results) => {
    if (err) {
      response.redirect('/');
      return next(err);
    } else {
      response.redirect('/gabble');
    }
  });
});

app.get('/:id/messageLikes', function(request, response) {
  client.query('SELECT DISTINCT username FROM users LEFT JOIN likes ON likes.user_id = users.id WHERE message_id =$1', [request.params.id], (err, dbResults) => {
    if (err) {
      return (err);
    } else {
      console.log(dbResults.rows);
      response.render('messageLikes', {
        likes: dbResults.rows
      });
    }
  });
});

app.post('/:id/delete', function(request, response) {
  client.query('DELETE FROM likes WHERE message_id=$1', [request.params.id], (err, dbResponse) => {
    client.query('DELETE FROM messages WHERE id=$1', [request.params.id], (err, dbResponse) => {
      response.redirect('/gabble')
    })
  })
})

app.get('/gabble', function(request, response) {
  client.query('SELECT * FROM users LEFT JOIN messages ON messages.user_id = users.id WHERE body !=$1', [" "], function(err, dbResponse) {
    if (err) {
      console.log(err);
      response.redirect('/');
    } else {
        dbResponse.rows.forEach(message => {
          if (message.user_id === request.session.passport.user) {
            message.author = true;
          } else {
            message.author = false;
          }
        })

        response.render('gabble', {
          posts: dbResponse.rows,
          currentUser: request.user,
        });
      }
  });
})

app.post('/:id/messageLikes', function(request, response) {

  client.query('INSERT INTO likes (user_id, message_id) VALUES ($1, $2)', [request.user.id, request.params.id], (err, dbResults) => {
    if (err) {
      return (err);
    } else {
      response.redirect('/gabble');
      console.log(request.user.id, "is the User");
    }
  });
});

app.listen(3000, function() {
  console.log('server started on port 3000');
});
