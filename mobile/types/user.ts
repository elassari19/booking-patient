export type UserRole = 'patient' | 'practitioner' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileImage?: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  
  // Personal Information
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phoneNumber?: string;
  profileImage?: string;
  
  // Address
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Emergency Contact
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  
  // Medical Information
  medicalHistory?: string[];
  allergies?: string[];
  medications?: string[];
  
  // Insurance Information
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface PractitionerProfile {
  id: string;
  userId: string;
  
  // Professional Information
  licenseNumber: string;
  specializations: string[];
  bio?: string;
  experience: number;
  profileImage?: string;
  phoneNumber?: string;
  
  // Financial Information
  consultationFee: number;
  
  // Languages
  languages: string[];
  
  // Verification Status
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDocuments?: string[];
  
  // Education
  education: {
    degree: string;
    institution: string;
    year: number;
  }[];
  
  // Certifications
  certifications: {
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
  }[];
  
  // Availability
  availability: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
  
  createdAt: string;
  updatedAt: string;
}

export interface AdminProfile {
  id: string;
  userId: string;
  department?: string;
  permissions: string[];
  profileImage?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserState {
  profile: PatientProfile | PractitionerProfile | AdminProfile | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
