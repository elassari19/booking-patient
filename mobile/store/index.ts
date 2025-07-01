import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import slices
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import appSlice from './slices/appSlice';

// Import API
import { apiSlice } from './api/apiSlice';

const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'user'], // Only persist auth and user data
  blacklist: ['api'], // Don't persist API cache
};

const rootReducer = combineReducers({
  auth: authSlice,
  user: userSlice,
  app: appSlice,
  api: apiSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(apiSlice.middleware),
  devTools: __DEV__,
});

export const persistor = persistStore(store);

// Setup listeners for RTK Query
setupListeners(store.dispatch);

// Export types with proper handling of persisted state
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Type for the persisted state (used in selectors)
export type PersistedRootState = ReturnType<typeof persistedReducer>;
