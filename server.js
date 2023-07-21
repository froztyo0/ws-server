const WebSocket = require('ws');
const fs = require('fs');

const port = 8080;

const server = new WebSocket.Server({ port });

// Load jobs data from the JSON file
let jobsData = [];
fs.readFile('data.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading data.json:', err);
  } else {
    try {
      jobsData = JSON.parse(data);
    } catch (parseErr) {
      console.error('Error parsing data.json:', parseErr);
    }
  }
});

// Convert hexadecimal color to color index (0 to 7)
function getColorIndex(hexColor) {
  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'
  ];
  return colors.indexOf(hexColor);
}

// Function to send jobs data to a specific client based on prio
function sendJobsData(client) {
  const priorityQueue = Object.entries(jobsData).sort(([, a], [, b]) => b.prio - a.prio);
  const [coords, { color }] = priorityQueue[0];
  const [x, y] = coords.split(',').map(Number);
  const colorIndex = getColorIndex(color);

  const message = {
    type: "Jobs",
    jobs: {
      [coords]: { x, y, color: colorIndex }
    }
  };

  client.send(JSON.stringify(message));
}

server.on('connection', (client) => {
  client.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === "RequestJobs" && Array.isArray(parsedMessage.tokens)) {
        for (const token of parsedMessage.tokens) {
          sendJobsData(client, token);
        }
      }
    } catch (e) {
      console.error('Error handling client message:', e);
    }
  });
});

console.log(`WebSocket server started on port ${port}`);
