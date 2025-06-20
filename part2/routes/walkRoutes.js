const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all walk requests (for walkers to view)
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
      WHERE area_name = ? AND city = ? AND state = ? AND country = ?
    `, [area, city, state, country]);

    let locationId;

    if (locationRows.length > 0) {
      locationId = locationRows[0].location_id;
    } else {
      // insert the location
      const [locationResult] = await db.query(`
        INSERT INTO Locations (area_name, city, state, country)
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

module.exports = router;