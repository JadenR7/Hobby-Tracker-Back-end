const express = require('express');
const cors = require('cors');
const { Redis } = require('@upstash/redis');

// For generating user IDs
const { v4: uuidv4 } = require('uuid')

// to use environment variables
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Get all activities
app.get('/api/activities', async (req, res) => {
    try {
        // Fetch all keys matching activity:*
        const keys = await redis.keys('activity:*')
        const activities = []

        for (const key of keys) {
            const activityData = await redis.get(key)
            if (activityData) {
                activities.push(activityData)
            }
        }

        res.status(200).json({
            success: true,
            data: activities,
            message: 'Activities retrieved successfully',
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Error fetching activities: ', error)
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve activities',
            timestamp: new Date().toISOString()
        })
    }
})

app.post('/api/activities', async (req, res) => {
    try {
        // Create new hobby
        const activityId = uuidv4()

        // Create new activity object
        const newActivity = {
            id: activityId,
            name: req.body.name,
            timeSpent: req.body.timeSpent,
            // If there are no notes, set it to empty string
            notes: req.body.notes || '',
            date: new Date().toISOString(),
        }

        const activityKey = `activity:${activityId}`
        await redis.set(activityKey, JSON.stringify(newActivity))

        console.log(`Activity created with ID: ${activityId}`)
        
        res.status(201).json({
            success: true,
            data: newActivity,
            message: 'Activity created successfully',
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Error creating new activity: ', error)
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create new activity',
            timestamp: new Date().toISOString()
        })
    }
})

app.delete('/api/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const key = `activity:${id}`;
    await redis.del(key);

    res.status(200).json({ success: true, message: 'Activity deleted.' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});
