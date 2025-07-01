import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAppSelector } from './redux';
import {
  selectIsAuthenticated,
  selectCurrentUser,
} from '@/store/slices/authSlice';

export function useAuthGuard() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  return { isAuthenticated, user };
}
