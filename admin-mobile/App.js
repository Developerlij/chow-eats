import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  // Point to localhost development server via loopback on Android emulator (10.0.2.2) or normal local host on iOS (127.0.0.1)
  const targetUrl = Platform.select({
    android: 'http://10.0.2.2:5173',
    ios: 'http://127.0.0.1:5173',
    default: 'http://localhost:5173'
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1E1E" />
      <WebView 
        source={{ uri: targetUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  webview: {
    flex: 1,
  },
});
