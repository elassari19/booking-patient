import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { useGetProfileQuery } from '@/store/api/profileApi';
import {
  PatientProfile,
  PractitionerProfile,
  AdminProfile,
} from '@/types/user';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { user, logout } = useAuth();
  const { data: profile, isLoading, refetch } = useGetProfileQuery();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    router.push('./profile-edit');
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/(auth)/login');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  const renderPatientProfile = (profile: PatientProfile) => (
    <>
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Personal Information
        </ThemedText>
        <View style={styles.infoItem}>
          <IconSymbol name="calendar" size={20} color="#666" />
          <Text style={styles.infoText}>
            {profile.dateOfBirth
              ? new Date(profile.dateOfBirth).toLocaleDateString()
              : 'Not provided'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <IconSymbol name="person" size={20} color="#666" />
          <Text style={styles.infoText}>
            {profile.gender
              ? profile.gender.charAt(0).toUpperCase() +
                profile.gender.slice(1).replace('_', ' ')
              : 'Not specified'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <IconSymbol name="phone" size={20} color="#666" />
          <Text style={styles.infoText}>
            {profile.phoneNumber || 'Not provided'}
          </Text>
        </View>
      </View>

      {profile.address && (
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Address
          </ThemedText>
          <View style={styles.infoItem}>
            <IconSymbol name="location" size={20} color="#666" />
            <Text style={styles.infoText}>
              {`${profile.address.street}, ${profile.address.city}, ${profile.address.state} ${profile.address.zipCode}`}
            </Text>
          </View>
        </View>
      )}

      {profile.emergencyContact && (
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Emergency Contact
          </ThemedText>
          <View style={styles.infoItem}>
            <IconSymbol name="person.fill" size={20} color="#666" />
            <Text style={styles.infoText}>
              {profile.emergencyContact.name} (
              {profile.emergencyContact.relationship})
            </Text>
          </View>
          <View style={styles.infoItem}>
            <IconSymbol name="phone" size={20} color="#666" />
            <Text style={styles.infoText}>
              {profile.emergencyContact.phoneNumber}
            </Text>
          </View>
        </View>
      )}

      {(profile.medicalHistory?.length ||
        profile.allergies?.length ||
        profile.medications?.length) && (
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Medical Information
          </ThemedText>
          {profile.medicalHistory?.length && (
            <View style={styles.infoItem}>
              <IconSymbol name="heart.text.square" size={20} color="#666" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Medical History:</Text>
                <Text style={styles.infoText}>
                  {profile.medicalHistory.join(', ')}
                </Text>
              </View>
            </View>
          )}
          {profile.allergies?.length && (
            <View style={styles.infoItem}>
              <IconSymbol
                name="exclamationmark.triangle"
                size={20}
                color="#ff6b6b"
              />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Allergies:</Text>
                <Text style={styles.infoText}>
                  {profile.allergies.join(', ')}
                </Text>
              </View>
            </View>
          )}
          {profile.medications?.length && (
            <View style={styles.infoItem}>
              <IconSymbol name="pills" size={20} color="#666" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Current Medications:</Text>
                <Text style={styles.infoText}>
                  {profile.medications.join(', ')}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </>
  );

  const renderPractitionerProfile = (profile: PractitionerProfile) => (
    <>
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Professional Information
        </ThemedText>
        <View style={styles.infoItem}>
          <IconSymbol name="doc.text" size={20} color="#666" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>License Number:</Text>
            <Text style={styles.infoText}>{profile.licenseNumber}</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <IconSymbol name="stethoscope" size={20} color="#666" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Specializations:</Text>
            <Text style={styles.infoText}>
              {profile.specializations.join(', ')}
            </Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <IconSymbol name="calendar" size={20} color="#666" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Experience:</Text>
            <Text style={styles.infoText}>{profile.experience} years</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <IconSymbol name="dollarsign.circle" size={20} color="#666" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Consultation Fee:</Text>
            <Text style={styles.infoText}>${profile.consultationFee}</Text>
          </View>
        </View>
        {profile.languages?.length > 0 && (
          <View style={styles.infoItem}>
            <IconSymbol name="globe" size={20} color="#666" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Languages:</Text>
              <Text style={styles.infoText}>
                {profile.languages.join(', ')}
              </Text>
            </View>
          </View>
        )}
      </View>

      {profile.bio && (
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Bio
          </ThemedText>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>
      )}

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Verification Status
        </ThemedText>
        <View style={styles.verificationContainer}>
          <IconSymbol
            name={
              profile.verificationStatus === 'verified'
                ? 'checkmark.circle.fill'
                : profile.verificationStatus === 'rejected'
                ? 'xmark.circle.fill'
                : 'clock.fill'
            }
            size={20}
            color={
              profile.verificationStatus === 'verified'
                ? '#28a745'
                : profile.verificationStatus === 'rejected'
                ? '#dc3545'
                : '#ffc107'
            }
          />
          <Text
            style={[
              styles.verificationText,
              {
                color:
                  profile.verificationStatus === 'verified'
                    ? '#28a745'
                    : profile.verificationStatus === 'rejected'
                    ? '#dc3545'
                    : '#ffc107',
              },
            ]}
          >
            {profile.verificationStatus.charAt(0).toUpperCase() +
              profile.verificationStatus.slice(1)}
          </Text>
        </View>
      </View>

      {profile.education?.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Education
          </ThemedText>
          {profile.education.map((edu, index) => (
            <View key={index} style={styles.infoItem}>
              <IconSymbol name="graduationcap" size={20} color="#666" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoText}>
                  {edu.degree} - {edu.institution} ({edu.year})
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {profile.certifications?.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Certifications
          </ThemedText>
          {profile.certifications.map((cert, index) => (
            <View key={index} style={styles.infoItem}>
              <IconSymbol name="rosette" size={20} color="#666" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoText}>
                  {cert.name} - {cert.issuer}
                </Text>
                <Text style={styles.infoSubtext}>
                  Issued: {new Date(cert.issueDate).toLocaleDateString()}
                  {cert.expiryDate &&
                    ` | Expires: ${new Date(
                      cert.expiryDate
                    ).toLocaleDateString()}`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </>
  );

  const renderAdminProfile = (profile: AdminProfile) => (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Admin Information
      </ThemedText>
      {profile.department && (
        <View style={styles.infoItem}>
          <IconSymbol name="building.2" size={20} color="#666" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Department:</Text>
            <Text style={styles.infoText}>{profile.department}</Text>
          </View>
        </View>
      )}
      {profile.phoneNumber && (
        <View style={styles.infoItem}>
          <IconSymbol name="phone" size={20} color="#666" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoText}>{profile.phoneNumber}</Text>
          </View>
        </View>
      )}
      {profile.permissions?.length > 0 && (
        <View style={styles.infoItem}>
          <IconSymbol name="key" size={20} color="#666" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Permissions:</Text>
            <Text style={styles.infoText}>
              {profile.permissions.join(', ')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading profile...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            {user?.profileImage || profile?.profileImage ? (
              <Image
                source={{
                  uri:
                    user?.profileImage?.toString() ||
                    profile?.profileImage?.toString() ||
                    undefined,
                }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <IconSymbol name="person.fill" size={40} color="#666" />
              </View>
            )}
          </View>
          <ThemedText type="title" style={styles.name}>
            {user?.firstName} {user?.lastName}
          </ThemedText>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleContainer}>
            <Text style={styles.roleText}>
              {user?.role.charAt(0).toUpperCase()! + user?.role.slice(1)}
            </Text>
          </View>

          {/* Email Verification Badge */}
          <View style={styles.verificationBadge}>
            <IconSymbol
              name={
                user?.isEmailVerified
                  ? 'checkmark.seal.fill'
                  : 'exclamationmark.triangle.fill'
              }
              size={16}
              color={user?.isEmailVerified ? '#28a745' : '#ffc107'}
            />
            <Text
              style={[
                styles.verificationBadgeText,
                { color: user?.isEmailVerified ? '#28a745' : '#ffc107' },
              ]}
            >
              {user?.isEmailVerified ? 'Verified' : 'Unverified'}
            </Text>
          </View>
        </View>

        {/* Profile Content */}
        {profile &&
          user?.role === 'patient' &&
          renderPatientProfile(profile as PatientProfile)}
        {profile &&
          user?.role === 'practitioner' &&
          renderPractitionerProfile(profile as PractitionerProfile)}
        {profile &&
          user?.role === 'admin' &&
          renderAdminProfile(profile as AdminProfile)}

        {/* No Profile Message */}
        {!profile && (
          <View style={styles.section}>
            <ThemedText style={styles.noProfileText}>
              Complete your profile to get started
            </ThemedText>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <IconSymbol name="pencil" size={20} color="white" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <IconSymbol name="arrow.right.square" size={20} color="#dc3545" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  roleContainer: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verificationBadgeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  bioText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  noProfileText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  actionButtons: {
    marginTop: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  logoutButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
