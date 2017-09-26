DROP DATABASE IF EXISTS gabbleDb;
CREATE DATABASE gabbleDb;

\c gabbleDb

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  password TEXT,
  username TEXT
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users (id),
  title TEXT,
  body TEXT,
  messageTime TIMESTAMP
);

CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  message_id INTEGER REFERENCES messages(id)
);
