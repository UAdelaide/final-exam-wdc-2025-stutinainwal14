const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all walk requests (for walkers to view)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        wr.request_id,
        wr.requested_time,
        wr.duration_minutes,
        wr.status,
        d.name AS dog_name,
        d.size,
        u.username AS owner_name,
        CONCAT(l.location_name, ', ', l.city, ', ', l.state, ', ', l.country) AS location
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      JOIN Locations l ON wr.location_id = l.location_id
      WHERE wr.status = 'open'
      ORDER BY wr.request_id DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to fetch walk requests' });
  }
});

// POST a new walk request (from owner)
router.post('/', async (req, res) => {
  const { dog_id, requested_time, duration_minutes, area, city, state, country } = req.body;

  try {
    const [locationRows] = await db.query(`
      SELECT location_id FROM Locations
      WHERE location_name = ? AND city = ? AND state = ? AND country = ?
    `, [area, city, state, country]);

    let locationId;

    if (locationRows.length > 0) {
      locationId = locationRows[0].location_id;
    } else {
      // insert the location
      const [locationResult] = await db.query(`
        INSERT INTO Locations (location_name, city, state, country)
        VALUES (?, ?, ?, ?)
      `, [area, city, state, country]);
      locationId = locationResult.insertId;
    }

    const [walkResult] = await db.query(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location_id)
      VALUES (?, ?, ?, ?)
    `, [dog_id, requested_time, duration_minutes, locationId]);

    res.status(201).json({ message: 'Walk request created', request_id: walkResult.insertId });

  } catch (error) {
    console.error('Error inserting walk request:', error);
    res.status(500).json({ error: 'Failed to create walk request' });
  }
});

// POST an application to walk a dog (from walker)
router.post('/:id/apply', async (req, res) => {
  const requestId = req.params.id;
  const { walker_id } = req.body;

  try {
    await db.query(`
      INSERT INTO WalkApplications (request_id, walker_id)
      VALUES (?, ?)
    `, [requestId, walker_id]);

    await db.query(`
      UPDATE WalkRequests
      SET status = 'accepted'
      WHERE request_id = ?
    `, [requestId]);

    res.status(201).json({ message: 'Application submitted' });
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to apply for walk' });
  }
});

// GET walk requests for the logged-in owner
router.get('/my-walks', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'owner') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const ownerId = req.session.user.id;

  try {
    const [rows] = await db.query(`
      SELECT
        wr.request_id,
        wr.requested_time,
        wr.duration_minutes,
        wr.status,
        d.name AS dog_name,
        d.size,
        CONCAT(l.location_name, ', ', l.city, ', ', l.state, ', ', l.country) AS location
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Locations l ON wr.location_id = l.location_id
      WHERE wr.status = 'open'
      WHERE d.owner_id = ?
      ORDER BY wr.request_id DESC
    `, [ownerId]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching owner walk requests:', error);
    res.status(500).json({ error: 'Failed to fetch walk requests' });
  }
});


module.exports = router;