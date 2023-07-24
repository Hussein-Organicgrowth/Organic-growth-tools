// Load Express module
const express = require('express');

// Create an instance of Express app
const app = express();
const PORT = 3000;

// Respond with 'Hello World!' on the homepage:
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/title-tag-tool', (req, res) => {
  res.render('title-tag-tool', { title: 'Title tag værktøj' });
});


// Start the server and listen on the defined port
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
