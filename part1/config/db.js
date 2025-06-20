// config/db.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Stuti14@', // Replace with your password
  database: 'DogWalkService'
};

async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

module.exports = getConnection;
