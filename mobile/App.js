import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, ActivityIndicator, StyleSheet, Easing } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BarChart3, Megaphone, MessageSquare, Settings as SettingsIcon, Bot, Home } from 'lucide-react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/theme';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import CampaignsScreen from './src/screens/CampaignsScreen';
import ChatsScreen from './src/screens/ChatsScreen'; // Keeping for reference or removal
import InstancesScreen from './src/screens/InstancesScreen';
import SessionChatsScreen from './src/screens/SessionChatsScreen';
import ChatDetailScreen from './src/screens/ChatDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CampaignDetailsScreen from './src/screens/CampaignDetailsScreen';
import AgentsScreen from './src/screens/AgentsScreen';
import CampaignCreateScreen from './src/screens/CampaignCreateScreen';
import CampaignEditScreen from './src/screens/CampaignEditScreen';
import LeadImportScreen from './src/screens/LeadImportScreen';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

// Custom Easing: Fast at start, slow in middle, fast at end (Cubic Bezier equivalent)
const customEasing = Easing.bezier(0.65, 0, 0.35, 1);

// Tab Icon Component
const TabIcon = ({ Icon, focused }) => (
  <Icon
    size={24}
    color={focused ? colors.white : colors.textDark}
    strokeWidth={focused ? 2.5 : 2}
  />
);


// Main Tab Navigator
const MainTabs = () => (
  <Tab.Navigator
    tabBarPosition="bottom"
    screenOptions={{
      tabBarShowLabel: false,
      tabBarShowIcon: true,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        elevation: 0,
        height: 75,
        paddingBottom: 5,
      },
      tabBarItemStyle: {
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
      },
      tabBarIndicatorStyle: {
        height: 0,
      },
      tabBarActiveTintColor: colors.white,
      tabBarInactiveTintColor: colors.textDark,
      tabBarPressColor: 'transparent',
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} />,
        tabBarLabel: 'Home'
      }}
    />
    <Tab.Screen
      name="Instances"
      component={InstancesScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon Icon={MessageSquare} focused={focused} />,
        tabBarLabel: 'Chat'
      }}
    />
    <Tab.Screen
      name="Campaigns"
      component={CampaignsScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon Icon={Megaphone} focused={focused} />,
      }}
    />
    <Tab.Screen
      name="Agents"
      component={AgentsScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon Icon={Bot} focused={focused} />,
        tabBarLabel: 'Agents'
      }}
    />
  </Tab.Navigator>
);

// Auth Flow
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// ... (imports remain)

// Main App Flow
const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="SessionChats" component={SessionChatsScreen} />
    <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
    <Stack.Screen name="CampaignDetails" component={CampaignDetailsScreen} />
    <Stack.Screen name="CampaignCreate" component={CampaignCreateScreen} />
    <Stack.Screen name="CampaignEdit" component={CampaignEditScreen} />
    <Stack.Screen name="LeadImport" component={LeadImportScreen} />
  </Stack.Navigator>
);

// Navigation Handler
const Navigation = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const linking = {
    prefixes: ['axis://'],
    config: {
      screens: {
        // We don't need deep links to specific screens for auth, matches are handled by Supabase/AuthContext
        // But we need the linking config for the app to 'listen' to the scheme.
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

// Main App Component
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 16,
  },
});
