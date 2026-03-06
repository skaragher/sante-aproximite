// app.config.js
import 'dotenv/config';

export default ({ config }) => {
  const env = process.env.NODE_ENV || 'development';

  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    (env === "production"
      ? process.env.EXPO_PUBLIC_API_URL_PROD
      : process.env.EXPO_PUBLIC_API_URL_DEV);
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return {
    ...config,
    extra: {
      ...(config?.extra || {}),
      apiUrl,
      googleMapsApiKey
    }
  };
};
