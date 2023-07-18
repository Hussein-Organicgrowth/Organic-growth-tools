// Load Express module
const express = require('express');

// Create an instance of Express app
const app = express();
const PORT = 3000;

// Respond with 'Hello World!' on the homepage:
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server and listen on the defined port
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
