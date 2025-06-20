// config/db.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'DogWalkService'
};

function getConnection() {
  return mysql.createConnection(dbConfig); // no need for await
}

module.exports = getConnection;
