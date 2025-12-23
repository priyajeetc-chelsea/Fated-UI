/**
 * Temporary Debug Screen - Add this to your app to check auth state
 * 
 * To use:
 * 1. Import this in your app and navigate to it
 * 2. Or copy the code into an existing screen
 */

import { useAuth } from '@/contexts/auth/AuthContext';
import { authApiService } from '@/services/auth/api';
import { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function DebugAuthScreen() {
  const auth = useAuth();
  const [storageInfo, setStorageInfo] = useState<any>(null);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    const [bearerToken, refreshToken, userData] = await Promise.all([
      authApiService.getBearerToken(),
      authApiService.getRefreshToken(),
      authApiService.getUserData(),
    ]);
    
    const isExpired = await authApiService.isTokenExpired();

    setStorageInfo({
      bearerToken: bearerToken ? 'Present ✅' : 'Missing ❌',
      refreshToken: refreshToken ? 'Present ✅' : 'Missing ❌',
      userData: userData ? JSON.stringify(userData, null, 2) : 'Missing ❌',
      isExpired: isExpired ? 'Yes ⚠️' : 'No ✅',
    });
  };

  const clearAllAuth = async () => {
    await authApiService.clearAuthData();
    alert('Auth data cleared!');
    loadStorageInfo();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Auth Debug Screen</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auth Context State:</Text>
        <Text>isAuthenticated: {auth.isAuthenticated ? 'Yes ✅' : 'No ❌'}</Text>
        <Text>isLoading: {auth.isLoading ? 'Yes ⏳' : 'No'}</Text>
        <Text>phoneNumber: {auth.phoneNumber || 'None'}</Text>
        <Text>isOtpSent: {auth.isOtpSent ? 'Yes' : 'No'}</Text>
        <Text>error: {auth.error || 'None'}</Text>
        <Text>user: {auth.user ? JSON.stringify(auth.user, null, 2) : 'None'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AsyncStorage:</Text>
        {storageInfo ? (
          <>
            <Text>Bearer Token: {storageInfo.bearerToken}</Text>
            <Text>Refresh Token: {storageInfo.refreshToken}</Text>
            <Text>Token Expired: {storageInfo.isExpired}</Text>
            <Text>User Data: {storageInfo.userData}</Text>
          </>
        ) : (
          <Text>Loading...</Text>
        )}
      </View>

      <View style={styles.section}>
        <Button title="Refresh Storage Info" onPress={loadStorageInfo} />
        <View style={{ height: 10 }} />
        <Button title="Clear All Auth Data" onPress={clearAllAuth} color="red" />
        <View style={{ height: 10 }} />
        <Button title="Sign Out" onPress={() => auth.signOut()} color="orange" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
