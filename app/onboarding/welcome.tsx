import OnboardingButton from '@/components/onboarding/onboarding-button';
import ReferralCodeModal from '@/components/referral-code-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const REFERRAL_APPLIED_KEY = "@fated_referral_applied";

export default function WelcomeScreen() {
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralApplied, setReferralApplied] = useState(false);

  useEffect(() => {
    checkReferralStatus();
  }, []);

  const checkReferralStatus = async () => {
    const applied = await AsyncStorage.getItem(REFERRAL_APPLIED_KEY);
    if (applied === 'true') {
      setReferralApplied(true);
    }
  };

  const handleGetStarted = () => {
    router.push('/onboarding/basic');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.appName}>FATED</Text>

        <Text style={styles.subtitle}>
          Let&rsquo;s create your profile and find meaningful connections based on what matters to you.
        </Text>

        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Share your basic details</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Tell us about your lifestyle</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Express your thoughts & values</Text>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>Add your best photos</Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <OnboardingButton
          title="Get Started"
          onPress={handleGetStarted}
        />

        {referralApplied ? (
          <View style={styles.referralChip}>
            <Text style={styles.referralChipText}>Referral applied</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowReferralModal(true)}
            style={styles.referralLink}
          >
            <Text style={styles.referralLinkText}>Have a referral code?</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.timeEstimate}>
          Takes about 5-10 minutes to complete
        </Text>
      </View>

      <ReferralCodeModal
        visible={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        onSuccess={() => setReferralApplied(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  appName: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000',
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  stepsContainer: {
    width: '100%',
    maxWidth: 300,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  stepText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  referralLink: {
    marginTop: 16,
    padding: 4,
  },
  referralLinkText: {
    fontSize: 14,
    color: '#4B164C',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  referralChip: {
    marginTop: 16,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  referralChipText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  timeEstimate: {
    fontSize: 14,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
});
