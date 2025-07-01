import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserState, PatientProfile, PractitionerProfile } from '@/types/user';

const initialState: UserState = {
  profile: null,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setProfile: (
      state,
      action: PayloadAction<PatientProfile | PractitionerProfile>
    ) => {
      state.profile = action.payload;
      state.error = null;
    },
    updateProfile: (
      state,
      action: PayloadAction<Partial<PatientProfile | PractitionerProfile>>
    ) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    clearProfile: (state) => {
      state.profile = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setProfile,
  updateProfile,
  clearProfile,
  clearError,
} = userSlice.actions;

export default userSlice.reducer;

// Selectors
export const selectUserProfile = (state: { user: UserState }) =>
  state.user.profile;
export const selectUserLoading = (state: { user: UserState }) =>
  state.user.isLoading;
export const selectUserError = (state: { user: UserState }) => state.user.error;
