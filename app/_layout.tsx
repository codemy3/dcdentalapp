import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#0a2540", // Dark Navy Blue
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Discovery Coast Dental & Medical" }}
      />
      <Stack.Screen
        name="appointment"
        options={{ title: "Book Appointment" }}
      />
      <Stack.Screen name="success" options={{ headerShown: false }} />
      <Stack.Screen name="doctor-login" options={{ title: "Doctor Login" }} />
      <Stack.Screen
        name="doctor-dashboard"
        options={{ title: "Doctor Dashboard" }}
      />
    </Stack>
  );
}
