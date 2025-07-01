import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppState } from '@/types/app';

const initialState: AppState = {
  isInitialized: false,
  theme: 'system',
  language: 'en',
  notifications: {
    enabled: true,
    appointments: true,
    messages: true,
    marketing: false,
  },
  networkStatus: 'online',
  version: '1.0.0',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    updateNotificationSettings: (
      state,
      action: PayloadAction<Partial<AppState['notifications']>>
    ) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    setNetworkStatus: (state, action: PayloadAction<'online' | 'offline'>) => {
      state.networkStatus = action.payload;
    },
    setVersion: (state, action: PayloadAction<string>) => {
      state.version = action.payload;
    },
  },
});

export const {
  setInitialized,
  setTheme,
  setLanguage,
  updateNotificationSettings,
  setNetworkStatus,
  setVersion,
} = appSlice.actions;

export default appSlice.reducer;

// Selectors
export const selectIsInitialized = (state: { app: AppState }) =>
  state.app.isInitialized;
export const selectTheme = (state: { app: AppState }) => state.app.theme;
export const selectLanguage = (state: { app: AppState }) => state.app.language;
export const selectNotificationSettings = (state: { app: AppState }) =>
  state.app.notifications;
export const selectNetworkStatus = (state: { app: AppState }) =>
  state.app.networkStatus;
