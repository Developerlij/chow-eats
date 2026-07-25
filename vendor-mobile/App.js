import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  Platform, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { WebView } from 'react-native-webview';

const DEFAULT_PORT = '5177';
const APP_NAME = 'Vendor';

export default function App() {
  const defaultUrl = Platform.select({
    android: `http://10.0.2.2:${DEFAULT_PORT}`,
    ios: `http://127.0.0.1:${DEFAULT_PORT}`,
    default: `http://localhost:${DEFAULT_PORT}`
  });

  const [targetUrl, setTargetUrl] = useState(defaultUrl);
  const [errorDesc, setErrorDesc] = useState(null);
  const [customIp, setCustomIp] = useState('');
  const [key, setKey] = useState(0); // to force webview refresh

  const handleConnect = () => {
    if (!customIp.trim()) return;
    let url = customIp.trim();
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes(':')) {
        url = `http://${url}`;
      } else {
        url = `http://${url}:${DEFAULT_PORT}`;
      }
    }

    setTargetUrl(url);
    setErrorDesc(null);
    setKey(prev => prev + 1);
  };

  const handleResetDefault = () => {
    setTargetUrl(defaultUrl);
    setErrorDesc(null);
    setKey(prev => prev + 1);
  };

  const handleRetry = () => {
    setErrorDesc(null);
    setKey(prev => prev + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1E1E" />
      
      {errorDesc ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Chow {APP_NAME} Link 🛰️</Text>
          <Text style={styles.errorSubtitle}>
            Unable to connect to local server at:
          </Text>
          <Text style={styles.urlHighlight}>{targetUrl}</Text>
          
          <Text style={styles.errorDescText}>
            Status: {errorDesc} (ERR_ADDRESS_UNREACHABLE)
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Connect to custom host/IP:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 192.168.1.50"
              placeholderTextColor="#666"
              value={customIp}
              onChangeText={setCustomIp}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity style={styles.connectBtn} onPress={handleConnect}>
              <Text style={styles.connectBtnText}>Save & Connect</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>Troubleshooting:</Text>
            <Text style={styles.instructionStep}>1. Ensure Vite is running (`npm run dev` in {APP_NAME.toLowerCase()} web folder)</Text>
            <Text style={styles.instructionStep}>2. USB Debugging: Run `adb reverse tcp:{DEFAULT_PORT} tcp:{DEFAULT_PORT}` on your PC</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleResetDefault}>
              <Text style={styles.resetBtnText}>Use Default Loopback</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
              <Text style={styles.retryBtnText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <WebView 
          key={key}
          source={{ uri: targetUrl }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setErrorDesc(nativeEvent.description || 'Connection failed');
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#06C167',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 6,
    textAlign: 'center',
  },
  urlHighlight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#1E1E1E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorDescText: {
    fontSize: 12,
    color: '#E53935',
    marginBottom: 24,
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 44,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
  },
  connectBtn: {
    height: 44,
    backgroundColor: '#06C167',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionsBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 28,
  },
  instructionsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 6,
  },
  instructionStep: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    marginVertical: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '600',
  },
  retryBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#333333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
