import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ToastHost from '../components/ToastHost';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="category-manage" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="stats" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="category-detail" options={{ headerShown: false, presentation: 'card' }} />
      </Stack>
      <ToastHost />
    </>
  );
}
