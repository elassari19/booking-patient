import { configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import { bookingApi } from './api/bookingApi';

export const store = configureStore({
  reducer: {
    // ...existing reducers...
    [bookingApi.reducerPath]: bookingApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      // ...existing middleware...
      bookingApi.middleware
    ),
  // ...rest of configuration...
});
