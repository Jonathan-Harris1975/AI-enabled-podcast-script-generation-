import express from 'express';
import composeRouter from './routes/compose.js'; // Adjust this path if needed

const app = express();
const PORT = process.env.PORT || 3000;

// Fix: Enable JSON body parsing
app.use(express.json());

// Optional: Log requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} Body:`, req.body);
  next();
});

// Fix: Register /compose route AFTER express.json()
app.use('/compose', composeRouter);

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Podcast Script Generation API running!');
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});