import { useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socketService';
import { useAuth } from './useAuth';

export const useSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<number>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, user]);

  const connectSocket = async () => {
    try {
      setConnectionError(null);
      await socketService.connect();
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect socket:', error);
      setConnectionError(
        error instanceof Error ? error.message : 'Connection failed'
      );
      setIsConnected(false);
    }
  };

  const disconnectSocket = () => {
    socketService.disconnect();
    setIsConnected(false);
  };

  // Set up event listeners
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      console.log('Socket disconnected:', reason);
    };

    const handleConnectError = (error: Error) => {
      setIsConnected(false);
      setConnectionError(error.message);

      // Retry connection after delay
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isAuthenticated) {
          connectSocket();
        }
      }, 5000);
    };

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('connect_error', handleConnectError);

    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('connect_error', handleConnectError);
    };
  }, [isAuthenticated]);

  return {
    isConnected,
    connectionError,
    socketService,
    connect: connectSocket,
    disconnect: disconnectSocket,
  };
};
