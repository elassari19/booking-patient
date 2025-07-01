import { apiSlice } from './apiSlice';
import {
  PatientProfile,
  PractitionerProfile,
  AdminProfile,
} from '@/types/user';

export const profileApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<
      PatientProfile | PractitionerProfile | AdminProfile,
      void
    >({
      query: () => '/profile',
      providesTags: ['Profile'],
    }),

    updateProfile: builder.mutation<
      {
        message: string;
        profile: PatientProfile | PractitionerProfile | AdminProfile;
      },
      Partial<PatientProfile | PractitionerProfile | AdminProfile>
    >({
      query: (profileData) => ({
        url: '/profile',
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['Profile'],
    }),

    uploadProfileImage: builder.mutation<
      { message: string; imageUrl: string },
      FormData
    >({
      query: (formData) => ({
        url: '/profile/upload-image',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Profile'],
    }),

    getPractitioners: builder.query<
      PractitionerProfile[],
      { specialization?: string; page?: number }
    >({
      query: ({ specialization, page = 1 }) => ({
        url: '/practitioners',
        params: { specialization, page },
      }),
      providesTags: ['PractitionerProfile'], // Fixed tag
    }),

    updateAvailability: builder.mutation<
      { message: string },
      {
        availability: Array<{
          dayOfWeek: number;
          startTime: string;
          endTime: string;
          isAvailable: boolean;
        }>;
      }
    >({
      query: (data) => ({
        url: '/practitioners/availability',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PractitionerProfile'], // Fixed tag
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadProfileImageMutation,
  useGetPractitionersQuery,
  useUpdateAvailabilityMutation,
} = profileApi;
