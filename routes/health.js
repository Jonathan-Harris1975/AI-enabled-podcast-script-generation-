import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Health check passed' });
});

export default router;
