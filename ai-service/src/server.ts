import app from './app.js';

const port = Number(process.env.AI_SERVICE_PORT) || 5002;

app.listen(port, () => {
  console.log(`AI service is running on port ${port}`);
});
