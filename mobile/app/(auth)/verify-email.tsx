import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  useVerifyEmailMutation,
  useResendVerificationMutation,
} from '@/store/api/authApi';

export default function VerifyEmailScreen() {
  const colorScheme = useColorScheme();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [isVerified, setIsVerified] = useState(false);
  const [verifyEmail, { isLoading: verifyLoading }] = useVerifyEmailMutation();
  const [resendVerification, { isLoading: resendLoading }] =
    useResendVerificationMutation();

  useEffect(() => {
    if (token) {
      handleVerifyEmail();
    }
  }, [token]);

  const handleVerifyEmail = async () => {
    if (!token) {
      Alert.alert('Error', 'Invalid verification token');
      return;
    }

    try {
      const result = await verifyEmail({ token }).unwrap();
      setIsVerified(true);

      Alert.alert('Success', 'Your email has been verified successfully!', [
        {
          text: 'Continue to Login',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        'Failed to verify email. The link may be expired.';
      Alert.alert('Verification Failed', errorMessage);
    }
  };

  const handleResendVerification = async () => {
    // This would need an email parameter - you might want to pass it through navigation
    // For now, we'll show a message to contact support
    Alert.alert(
      'Resend Verification',
      'Please contact support to resend verification email or try registering again.',
      [
        { text: 'OK' },
        {
          text: 'Go to Registration',
          onPress: () => router.replace('/(auth)/register'),
        },
      ]
    );
  };

  if (verifyLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={Colors[colorScheme ?? 'light'].tint}
          />
          <ThemedText style={styles.loadingText}>
            Verifying your email...
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.main}>
        <IconSymbol
          name={isVerified ? 'checkmark.circle.fill' : 'envelope.badge'}
          size={80}
          color={isVerified ? '#28a745' : Colors[colorScheme ?? 'light'].tint}
        />

        <ThemedText type="title" style={styles.title}>
          {isVerified ? 'Email Verified!' : 'Email Verification'}
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          {isVerified
            ? 'Your email has been successfully verified. You can now log in to your account.'
            : "We're verifying your email address. Please wait..."}
        </ThemedText>

        <View style={styles.buttonContainer}>
          {isVerified ? (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.continueButtonText}>Continue to Login</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleVerifyEmail}
                disabled={verifyLoading}
              >
                <Text style={styles.retryButtonText}>
                  {verifyLoading ? 'Verifying...' : 'Retry Verification'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendVerification}
                disabled={resendLoading}
              >
                <Text style={styles.resendButtonText}>
                  {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    backgroundColor: '#6c757d',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  resendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
  },
});
