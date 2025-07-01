import dotenv from 'dotenv';
import { createApp } from './src/core/index';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    const { app, httpServer, socketServer } = await createApp();

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔄 Socket.IO ready for real-time messaging`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
