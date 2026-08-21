import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../screens/LoginScreen';
import { TabNavigator } from './TabNavigator';
import { SessionExpiredError } from '../api/client';

export type RootStackParamList = {
  Login: undefined;
  App: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root navigator.
 *
 * Shows a loading spinner while checking SecureStore on launch,
 * then routes to Login or the main Tab navigator based on auth state.
 *
 * SessionExpiredError thrown anywhere inside the app should call
 * the onSessionExpired callback (passed via context or prop drilling)
 * which triggers logout() and returns user here.
 */
export function RootNavigator() {
  const { status, login, logout } = useAuth();

  // Cold start — checking SecureStore
  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {status === 'unauthenticated' ? (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={login} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="App">
            {() => <TabNavigator onLogout={logout} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B5E20',
  },
});
