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

app.post('/api/hobby', async (req, res) => {
    try {
        // Create new hobby
        const hobbyId = uuidv4()

        // Create new hobby object
        const newHobby = {
            id: hobbyId,
            name: req.body.name,
        }

        const hobbyKey = `hobby${hobbyId}`
        await redis.set(hobbyKey, JSON.stringify(newHobby))

        console.log(`Hobby created with ID: ${hobbyId}`)
        
        res.status(201).json({
            success: true,
            data: newHobby,
            message: 'Hobby created successfully',
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Error creating new hobby: ', error)
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create new hobby',
            timestamp: new Date().toISOString()
        })
    }
})