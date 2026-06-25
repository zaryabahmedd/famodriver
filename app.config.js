// Dynamic Expo config: layers the Google Maps API key and the expo-location
// permission plugin on top of the static app.json. The Google key is read from
// EXPO_PUBLIC_GOOGLE_MAPS_API_KEY at build time, falling back to the key baked
// into app.json so EAS builds always have one (env vars aren't guaranteed there).

module.exports = ({ config }) => {
  const googleMapsApiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    config.android?.config?.googleMaps?.apiKey;

  return {
    ...config,
    android: {
      ...config.android,
      ...(googleMapsApiKey
        ? { config: { ...config.android?.config, googleMaps: { apiKey: googleMapsApiKey } } }
        : {}),
    },
    ios: {
      ...config.ios,
      ...(googleMapsApiKey
        ? { config: { ...config.ios?.config, googleMapsApiKey } }
        : {}),
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
