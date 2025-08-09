import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

// Routes
import healthRoute from './routes/health.js';
import introRoute from './routes/intro.js';
import mainRoute from './routes/main.js';
import outroRoute from './routes/outro.js';
import composeRoute from './routes/compose.js';
import clearSessionRoute from './routes/clearsession.js';
import uploadChunksRoute from './routes/uploadChunks.js';  // <-- Import it here

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/health', healthRoute);
app.use('/intro', introRoute);
app.use('/main', mainRoute);
app.use('/outro', outroRoute);
app.use('/compose', composeRoute);
app.use('/clearsession', clearSessionRoute);
app.use('/upload-chunks', uploadChunksRoute);  // <-- Mount it here

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
