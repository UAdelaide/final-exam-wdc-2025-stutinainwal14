const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

// POST login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT * FROM Users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];
    const isMatch = password === user.password_hash;


    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    req.session.user = {
      id: user.user_id,
      username: user.username,
      role: user.role
    };

    res.json({ message: 'Login successful', role: user.role });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }

    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
});

// GET /api/users/my-dogs
router.get('/my-dogs', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'owner') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const ownerId = req.session.user.id;

  try {
    const [dogs] = await db.query(
      'SELECT dog_id, name FROM Dogs WHERE owner_id = ?',
      [ownerId]
    );
    res.json(dogs);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// GET /api/users/all-dogs
router.get('/all-dogs', async (req, res) => {
  try {
    const [dogs] = await db.query(`
      SELECT d.dog_id, d.name, d.size, d.owner_id
      FROM Dogs d
    `);
    res.json(dogs);
  } catch (error) {
    console.error('Error fetching all dogs:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

module.exports = router;