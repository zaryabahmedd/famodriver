// Dynamic Expo config: layers the Google Maps API key (from env) and the
// expo-location permission plugin on top of the static app.json.
// The Google key is read from EXPO_PUBLIC_GOOGLE_MAPS_API_KEY at build time.
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

module.exports = ({ config }) => {
  return {
    ...config,
    android: {
      ...config.android,
      ...(GOOGLE_MAPS_API_KEY
        ? { config: { googleMaps: { apiKey: GOOGLE_MAPS_API_KEY } } }
        : {}),
    },
    ios: {
      ...config.ios,
      ...(GOOGLE_MAPS_API_KEY ? { config: { googleMapsApiKey: GOOGLE_MAPS_API_KEY } } : {}),
    },
    plugins: [
      ...(config.plugins ?? []),
      'expo-secure-store',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'FAMO uses your location to match you with nearby deliveries and share live tracking with customers during a delivery.',
          locationWhenInUsePermission:
            'FAMO uses your location to match you with nearby deliveries.',
        },
      ],
    ],
  };
};
