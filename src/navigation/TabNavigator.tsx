import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';

// Screens — we'll fill these in as we build them
// Placeholder stubs until each screen is built
const Stub = ({ route }: { route: { name: string } }) => (
  <View style={styles.stub}>
    <Text style={styles.stubText}>{route.name}</Text>
  </View>
);

// Temporary stub imports — replace with real screens as they're built
const HomeScreen = (p: any) => <Stub route={{ name: 'Home' }} />;
const CoursesScreen = (p: any) => <Stub route={{ name: 'Courses' }} />;
const AssignmentsScreen = (p: any) => <Stub route={{ name: 'Assignments' }} />;
const GradesScreen = (p: any) => <Stub route={{ name: 'Grades' }} />;
const ProfileScreen = (p: any) => <Stub route={{ name: 'Profile' }} />;
const CourseDetailScreen = (p: any) => <Stub route={{ name: 'Course Detail' }} />;

// ── Param lists ───────────────────────────────────────────────────

export type HomeStackParamList = {
  Home: undefined;
};

export type CoursesStackParamList = {
  Courses: undefined;
  CourseDetail: { siteId: string; title: string; code: string };
};

export type AssignmentsStackParamList = {
  Assignments: undefined;
};

export type GradesStackParamList = {
  Grades: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  CoursesTab: undefined;
  AssignmentsTab: undefined;
  GradesTab: undefined;
  ProfileTab: undefined;
};

// ── Stack navigators ──────────────────────────────────────────────

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const CoursesStack = createNativeStackNavigator<CoursesStackParamList>();
const AssignmentsStack = createNativeStackNavigator<AssignmentsStackParamList>();
const GradesStack = createNativeStackNavigator<GradesStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const HEADER_STYLE = {
  headerStyle: { backgroundColor: '#1B5E20' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '800' as const, fontSize: 18 },
};

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={HEADER_STYLE}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'Thuto' }} />
    </HomeStack.Navigator>
  );
}

function CoursesStackNav() {
  return (
    <CoursesStack.Navigator screenOptions={HEADER_STYLE}>
      <CoursesStack.Screen name="Courses" component={CoursesScreen} options={{ title: 'My Courses' }} />
      <CoursesStack.Screen
        name="CourseDetail"
        component={CourseDetailScreen}
        options={({ route }) => ({ title: route.params.code })}
      />
    </CoursesStack.Navigator>
  );
}

function AssignmentsStackNav() {
  return (
    <AssignmentsStack.Navigator screenOptions={HEADER_STYLE}>
      <AssignmentsStack.Screen name="Assignments" component={AssignmentsScreen} options={{ title: 'Assignments' }} />
    </AssignmentsStack.Navigator>
  );
}

function GradesStackNav() {
  return (
    <GradesStack.Navigator screenOptions={HEADER_STYLE}>
      <GradesStack.Screen name="Grades" component={GradesScreen} options={{ title: 'Grades' }} />
    </GradesStack.Navigator>
  );
}

function ProfileStackNav({ onLogout }: { onLogout: () => void }) {
  return (
    <ProfileStack.Navigator screenOptions={HEADER_STYLE}>
      <ProfileStack.Screen
        name="Profile"
        options={{ title: 'Profile' }}
      >
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </ProfileStack.Screen>
    </ProfileStack.Navigator>
  );
}

// ── Tab icons (inline SVG-style using View) ───────────────────────

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const color = focused ? '#2E7D32' : '#94A3B8';
  const icons: Record<string, string> = {
    home: '⌂', courses: '📖', assignments: '📋', grades: '📊', profile: '👤',
  };
  return (
    <Text style={{ fontSize: 18, color }}>{icons[name]}</Text>
  );
}

// ── Tab Navigator ─────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();

interface TabNavigatorProps {
  onLogout: () => void;
}

export function TabNavigator({ onLogout }: TabNavigatorProps) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNav}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }}
      />
      <Tab.Screen
        name="CoursesTab"
        component={CoursesStackNav}
        options={{ tabBarLabel: 'Courses', tabBarIcon: ({ focused }) => <TabIcon name="courses" focused={focused} /> }}
      />
      <Tab.Screen
        name="AssignmentsTab"
        component={AssignmentsStackNav}
        options={{ tabBarLabel: 'Tasks', tabBarIcon: ({ focused }) => <TabIcon name="assignments" focused={focused} /> }}
      />
      <Tab.Screen
        name="GradesTab"
        component={GradesStackNav}
        options={{ tabBarLabel: 'Grades', tabBarIcon: ({ focused }) => <TabIcon name="grades" focused={focused} /> }}
      />
      <Tab.Screen
        name="ProfileTab"
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} /> }}
      >
        {() => <ProfileStackNav onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  stub: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF4EF',
  },
  stubText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
  },
});
