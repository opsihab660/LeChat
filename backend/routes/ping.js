import express from 'express';

const router = express.Router();

// 🏓 Simple ping endpoint for connectivity testing
router.head('/ping', (req, res) => {
  res.status(200).end();
});

router.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'chat-app-backend'
  });
});

// 🔄 Health check endpoint with more details
router.get('/health', (req, res) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development'
  };

  res.status(200).json(healthCheck);
});

export default router;
