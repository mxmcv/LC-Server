// server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

app.use(
  cors({
    origin: '*',
    methods: ['POST', 'GET'],
    allowedHeaders: ['Content-Type'],
  })
);

// Root GET route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// POST route to handle hint requests
app.post('/getHint', async (req, res) => {
  console.log('test!');
  const { questionTitle, questionDescription, userCode } = req.body;

  // Validate incoming data
  if (!questionTitle || !questionDescription || !userCode) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  console.log(req);

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

  // Construct the prompt for GPT-4
  const prompt = `
LeetCode Problem: ${questionTitle}
Description: ${questionDescription}
User Submission:
${userCode}

Output solely a one-line hint to help the user identify their error. This hint should be no more than 30 words.
  `;

  try {
    // Make the API request to OpenAI using the built-in fetch
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an assistant that provides concise hints to help users debug their code.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 150,
        n: 1,
        stop: null,
      }),
    });

    // Check if the response is successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API response not ok:', response.status, errorText);
      return res
        .status(500)
        .json({ error: 'Unable to fetch hint from OpenAI.' });
    }

    const data = await response.json();
    const hint = data.choices[0].message.content.trim();

    // Send the hint back to the client
    res.json({ hint });
  } catch (error) {
    console.error('Error fetching hint from OpenAI API:', error);
    res.status(500).json({ error: 'Error fetching hint from OpenAI.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
