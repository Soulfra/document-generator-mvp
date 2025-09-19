#!/usr/bin/env node

const express = require('express');
const fs = require('fs');
const app = express();
const port = 3008;

app.use(express.json());

// Store stories
let stories = [];

app.get('/', (req, res) => {
  res.json({ status: 'WORKING', stories: stories.length, port });
});

app.post('/story', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
  
  const story = {
    id: Date.now(),
    text: text.substring(0, 200),
    framework: ['Take responsibility', 'Build habits', 'Help others'],
    created: new Date()
  };
  
  stories.push(story);
  console.log(`Story ${story.id} processed`);
  
  res.json({ success: true, id: story.id, framework: story.framework });
});

app.get('/story/:id', (req, res) => {
  const story = stories.find(s => s.id == req.params.id);
  if (!story) return res.status(404).json({ error: 'Not found' });
  res.json(story);
});

app.listen(port, () => {
  console.log(`Story processor running on port ${port}`);
});