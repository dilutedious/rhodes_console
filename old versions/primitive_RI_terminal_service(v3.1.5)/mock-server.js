const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static(__dirname));

// Mock API endpoint for news
app.get('/news/withhighlights', (req, res) => {
  const mockDataPath = path.join(__dirname, 'static', 'mock-api', 'news-data.json');
  const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
  res.json(mockData);
});

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Mock server running at http://localhost:${port}`);
}); 