import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import ReduxProvider from '@/providers/ReduxProvider';
import AuthGuard from '@/components/AuthGuard';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Global Modal Screens */}
        <Stack.Screen
          name="booking-details"
          options={{
            presentation: 'modal',
            title: 'Booking Details',
          }}
        />
        <Stack.Screen
          name="video-call"
          options={{
            presentation: 'fullScreenModal',
            title: 'Video Call',
          }}
        />
        <Stack.Screen
          name="chat"
          options={{
            title: 'Chat',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="profile-edit"
          options={{
            presentation: 'modal',
            title: 'Edit Profile',
          }}
        />

        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <ReduxProvider>
      <AuthGuard>
        <RootLayoutNav />
      </AuthGuard>
    </ReduxProvider>
  );
}
