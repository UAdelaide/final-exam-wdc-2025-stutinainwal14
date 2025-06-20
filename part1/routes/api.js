const express = require('express');
const router = express.Router();
const getConnection = require('../config/db'); // importing DB helper

//api/dogs
router.get('/dogs', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(`
      SELECT d.name AS dog_name, d.size, u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(rows);
    await connection.end();
  } catch (error) {
    console.error('Error in /api/dogs:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// Route: /api/walkrequests/open
router.get('/walkrequests/open', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(`
      SELECT wr.request_id, d.name AS dog_name, wr.requested_time, wr.duration_minutes,
             l.location_name AS location, u.username AS owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      JOIN Locations l ON wr.location_id = l.location_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
    await connection.end();
  } catch (error) {
    console.error('Error in /api/walkrequests/open:', error);
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});

// Route: /api/walkers/summary
router.get('/walkers/summary', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(`
      SELECT u.username AS walker_username,
             COUNT(r.rating_id) AS total_ratings,
             ROUND(AVG(r.rating), 2) AS average_rating,
             (
               SELECT COUNT(*)
               FROM WalkRequests wr
               JOIN WalkRatings rr ON rr.request_id = wr.request_id
               WHERE rr.walker_id = u.user_id AND wr.status = 'completed'
             ) AS completed_walks
      FROM Users u
      LEFT JOIN WalkRatings r ON u.user_id = r.walker_id
      WHERE u.role = 'walker'
      GROUP BY u.user_id
    `);
    res.json(rows);
    await connection.end();
  } catch (error) {
    console.error('Error in /api/walkers/summary:', error);
    res.status(500).json({ error: 'Failed to fetch walker summary' });
  }
});

module.exports = router;
