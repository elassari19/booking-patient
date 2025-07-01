import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch } from './redux';
import { setNetworkStatus } from '@/store/slices/appSlice';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected;
      setIsConnected(connected);
      setConnectionType(state.type);

      // Update app slice
      dispatch(setNetworkStatus(connected ? 'online' : 'offline'));
    });

    return () => unsubscribe();
  }, [dispatch]);

  return {
    isConnected,
    connectionType,
    isOnline: isConnected === true,
    isOffline: isConnected === false,
  };
};
