module.exports = ({ config }) => {
  const isLite = process.env.EXPO_PUBLIC_LITE_MODE === 'true';
  if (isLite) {
    return {
      ...config,
      name: "Chow Lite",
      slug: "chow-lite",
      android: {
        ...config.android,
        package: "com.mazisx.chow.lite"
      },
      ios: {
        ...config.ios,
        bundleIdentifier: "com.mazisx.chow.lite"
      }
    };
  }
  return config;
};
