import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadProfileImageMutation,
} from '@/store/api/profileApi';
import {
  PatientProfile,
  PractitionerProfile,
  AdminProfile,
} from '@/types/user';

export default function ProfileEditScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: updateLoading }] =
    useUpdateProfileMutation();
  const [uploadImage, { isLoading: uploadLoading }] =
    useUploadProfileImageMutation();

  const [formData, setFormData] = useState<any>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
      if (profile.profileImage) {
        setSelectedImage(profile.profileImage);
      }
    }
  }, [profile]);

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'We need camera roll permissions to select an image.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      await handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (imageUri: string) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response = await uploadImage(formData).unwrap();
      setFormData((prev: any) => ({
        ...prev,
        profileImage: response.imageUrl,
      }));
      Alert.alert('Success', 'Profile image updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData).unwrap();
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const renderPatientForm = () => (
    <>
      {/* Personal Information */}
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Personal Information
        </ThemedText>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.phoneNumber || ''}
            onChangeText={(value) => updateFormData('phoneNumber', value)}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            value={formData.dateOfBirth || ''}
            onChangeText={(value) => updateFormData('dateOfBirth', value)}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderContainer}>
            {['male', 'female', 'other', 'prefer_not_to_say'].map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderButton,
                  formData.gender === gender && styles.genderButtonActive,
                ]}
                onPress={() => updateFormData('gender', gender)}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    formData.gender === gender && styles.genderButtonTextActive,
                  ]}
                >
                  {gender
                    .replace('_', ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Address */}
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Address
        </ThemedText>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Street</Text>
          <TextInput
            style={styles.input}
            value={formData.address?.street || ''}
            onChangeText={(value) =>
              updateFormData('address', { ...formData.address, street: value })
            }
            placeholder="Enter street address"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={formData.address?.city || ''}
              onChangeText={(value) =>
                updateFormData('address', { ...formData.address, city: value })
              }
              placeholder="City"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              value={formData.address?.state || ''}
              onChangeText={(value) =>
                updateFormData('address', { ...formData.address, state: value })
              }
              placeholder="State"
            />
          </View>
        </View>
      </View>

      {/* Emergency Contact */}
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Emergency Contact
        </ThemedText>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={formData.emergencyContact?.name || ''}
            onChangeText={(value) =>
              updateFormData('emergencyContact', {
                ...formData.emergencyContact,
                name: value,
              })
            }
            placeholder="Emergency contact name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Relationship</Text>
          <TextInput
            style={styles.input}
            value={formData.emergencyContact?.relationship || ''}
            onChangeText={(value) =>
              updateFormData('emergencyContact', {
                ...formData.emergencyContact,
                relationship: value,
              })
            }
            placeholder="Relationship"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.emergencyContact?.phoneNumber || ''}
            onChangeText={(value) =>
              updateFormData('emergencyContact', {
                ...formData.emergencyContact,
                phoneNumber: value,
              })
            }
            placeholder="Emergency contact phone"
            keyboardType="phone-pad"
          />
        </View>
      </View>
    </>
  );

  const renderPractitionerForm = () => (
    <>
      {/* Professional Information */}
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Professional Information
        </ThemedText>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>License Number</Text>
          <TextInput
            style={styles.input}
            value={formData.licenseNumber || ''}
            onChangeText={(value) => updateFormData('licenseNumber', value)}
            placeholder="Enter license number"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Specializations (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.specializations?.join(', ') || ''}
            onChangeText={(value) =>
              updateFormData(
                'specializations',
                value.split(',').map((s: string) => s.trim())
              )
            }
            placeholder="e.g., Cardiology, Internal Medicine"
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.bio || ''}
            onChangeText={(value) => updateFormData('bio', value)}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Years of Experience</Text>
          <TextInput
            style={styles.input}
            value={formData.experience?.toString() || ''}
            onChangeText={(value) =>
              updateFormData('experience', parseInt(value) || 0)
            }
            placeholder="Years of experience"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Consultation Fee ($)</Text>
          <TextInput
            style={styles.input}
            value={formData.consultationFee?.toString() || ''}
            onChangeText={(value) =>
              updateFormData('consultationFee', parseFloat(value) || 0)
            }
            placeholder="Consultation fee"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Languages (comma separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.languages?.join(', ') || ''}
            onChangeText={(value) =>
              updateFormData(
                'languages',
                value.split(',').map((s: string) => s.trim())
              )
            }
            placeholder="e.g., English, Spanish"
          />
        </View>
      </View>
    </>
  );

  const renderAdminForm = () => (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Admin Information
      </ThemedText>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Department</Text>
        <TextInput
          style={styles.input}
          value={formData.department || ''}
          onChangeText={(value) => updateFormData('department', value)}
          placeholder="Department"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={formData.phoneNumber || ''}
          onChangeText={(value) => updateFormData('phoneNumber', value)}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  if (profileLoading) {
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#333" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Edit Profile
          </ThemedText>
          <TouchableOpacity
            onPress={handleSave}
            disabled={updateLoading}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>
              {updateLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Image */}
          <View style={styles.imageSection}>
            <TouchableOpacity
              onPress={handleImagePicker}
              style={styles.imageContainer}
            >
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <IconSymbol name="camera.fill" size={30} color="#666" />
                </View>
              )}
              <View style={styles.imageOverlay}>
                <IconSymbol name="camera" size={20} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.imageLabel}>Tap to change photo</Text>
          </View>

          {/* Role-specific Forms */}
          {user?.role === 'patient' && renderPatientForm()}
          {user?.role === 'practitioner' && renderPractitionerForm()}
          {user?.role === 'admin' && renderAdminForm()}
        </ScrollView>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 14,
    color: '#666',
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  genderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  genderButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  genderButtonText: {
    color: '#333',
    fontSize: 14,
  },
  genderButtonTextActive: {
    color: 'white',
  },
});
