import { useEffect, ReactNode } from 'react';
import { router, useSegments } from 'expo-router';
import { useAppSelector } from '@/hooks/redux';
import {
  selectIsAuthenticated,
  selectAuthLoading,
} from '@/store/slices/authSlice';
import { View, ActivityIndicator } from 'react-native';

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const segments = useSegments();

  // useEffect(() => {
  //   if (isLoading) return; // Don't redirect while loading

  //   const inAuthGroup = segments[0] === '(auth)';

  //   if (!isAuthenticated && !inAuthGroup) {
  //     // User is not authenticated and not in auth group, redirect to login
  //     router.replace('/(auth)/login');
  //   } else if (isAuthenticated && inAuthGroup) {
  //     // User is authenticated but in auth group, redirect to main app
  //     router.replace('/(tabs)');
  //   }
  // }, [isAuthenticated, isLoading, segments]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}
