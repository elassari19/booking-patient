import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAppSelector } from '@/hooks/redux';
import { selectCurrentUser } from '@/store/slices/authSlice';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const user = useAppSelector(selectCurrentUser);
  const userRole = user?.role || 'patient';

  const getTabsForRole = () => {
    switch (userRole) {
      case 'patient':
        return (
          <>
            <Tabs.Screen
              name="index"
              options={{
                title: 'Dashboard',
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="house.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="bookings"
              options={{
                title: 'Bookings',
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="calendar" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="messages"
              options={{
                title: 'Messages',
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="message.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'Profile',
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="person.fill" color={color} />
                ),
              }}
            />
          </>
        );

      case 'practitioner':
        return (
          <>
            <Tabs.Screen
              name="index"
              options={{
                title: 'Dashboard',
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="house.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="appointments"
              options={{
                title: 'Appointments',
                tabBarIcon: ({ color }) => (
                  <IconSymbol
                    size={28}
                    name="calendar.badge.plus"
                    color={color}
                  />
                ),
              }}
            />
            <Tabs.Screen
              name="availability"
              options={{
                title: 'Availability',
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="clock.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="messages"
              options={{
                title: 'Messages',
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="message.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'Profile',
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="person.fill" color={color} />
                ),
              }}
            />
          </>
        );

      case 'admin':
        return (
          <>
            <Tabs.Screen
              name="index"
              options={{
                title: 'Dashboard',
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="house.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="users"
              options={{
                title: 'Users',
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="person.3.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="analytics"
              options={{
                title: 'Analytics',
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="chart.bar.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="content"
              options={{
                title: 'Content',
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={28} name="doc.text.fill" color={color} />
                ),
              }}
            />
          </>
        );

      default:
        return (
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="house.fill" color={color} />
              ),
            }}
          />
        );
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      {getTabsForRole()}
    </Tabs>
  );
}
