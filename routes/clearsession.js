import express from 'express';

const router = express.Router();

router.post('/', (req, res) => {
  req.session = null;
  res.status(200).json({ message: 'Session cleared' });
});

export default router;
