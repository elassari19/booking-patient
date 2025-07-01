import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { DrawerScreenProps } from '@react-navigation/drawer';

// User roles
export type UserRole = 'patient' | 'practitioner' | 'admin';

// Auth Stack Navigation
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OTPVerification: { email: string; type: 'registration' | 'password_reset' };
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;

// Patient Tab Navigation
export type PatientTabParamList = {
  Dashboard: undefined;
  Bookings: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type PatientTabScreenProps<T extends keyof PatientTabParamList> =
  BottomTabScreenProps<PatientTabParamList, T>;

// Practitioner Tab Navigation
export type PractitionerTabParamList = {
  Dashboard: undefined;
  Appointments: undefined;
  Availability: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type PractitionerTabScreenProps<
  T extends keyof PractitionerTabParamList
> = BottomTabScreenProps<PractitionerTabParamList, T>;

// Admin Drawer Navigation
export type AdminDrawerParamList = {
  Dashboard: undefined;
  UserManagement: undefined;
  Analytics: undefined;
  ContentManagement: undefined;
  Settings: undefined;
};

export type AdminDrawerScreenProps<T extends keyof AdminDrawerParamList> =
  DrawerScreenProps<AdminDrawerParamList, T>;

// Root Stack Navigation
export type RootStackParamList = {
  Auth: undefined;
  PatientApp: undefined;
  PractitionerApp: undefined;
  AdminApp: undefined;
  BookingDetails: { bookingId: string };
  VideoCall: { roomId: string; token: string };
  Chat: { conversationId: string };
  ProfileEdit: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Expo Router specific types
export type SearchParams = Record<string, string | string[]>;

// Auth Stack Params (for Expo Router)
export type AuthParams = {
  login: undefined;
  register: undefined;
  'forgot-password': undefined;
  'otp-verification': {
    email: string;
    type: 'registration' | 'password_reset';
  };
};

// Patient Tab Params
export type PatientTabParams = {
  index: undefined; // Dashboard
  bookings: undefined;
  messages: undefined;
  profile: undefined;
};

// Practitioner Tab Params
export type PractitionerTabParams = {
  index: undefined; // Dashboard
  appointments: undefined;
  availability: undefined;
  messages: undefined;
  profile: undefined;
};

// Admin Tab Params
export type AdminTabParams = {
  index: undefined; // Dashboard
  users: undefined;
  analytics: undefined;
  content: undefined;
  settings: undefined;
};

// Global navigation params
export type GlobalParams = {
  'booking-details': { bookingId: string };
  'video-call': { roomId: string; token: string };
  chat: { conversationId: string };
  'profile-edit': undefined;
};
