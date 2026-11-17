import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppProvider, AppContext } from './Context';
import { ListScreen, DetailScreen, FormScreen, AuthScreen } from './Screens';

const Stack = createNativeStackNavigator();

function Nav() {
  const { c } = useContext(AppContext);
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.fg,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="List" component={ListScreen} options={{ title: 'Ads' }} />
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="Form" component={FormScreen} options={{ title: 'Ad form' }} />
        <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'Login / Register' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Nav />
    </AppProvider>
  );
}
