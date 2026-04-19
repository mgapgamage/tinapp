import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput,
  SafeAreaView, StatusBar, FlatList, Linking, Alert,
  Vibration, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  green:      '#1a7a4a',
  greenLight: '#2a9a60',
  greenPale:  '#e8f5ee',
  greenMid:   '#c2e8d0',
  dark:       '#0f1f16',
  gray:       '#6b7c72',
  bg:         '#f5f7f5',
  white:      '#ffffff',
  amber:      '#d97706',
  red:        '#dc2626',
};

const PALPA_URL = 'https://extra.palpa.fi/pantillisuus';

// ─────────────────────────────────────────────────────────────
export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [screen, setScreen]   = useState('home'); // 'home' | 'scan'
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [manual, setManual]   = useState('');
  const [history, setHistory] = useState([]);

  // Load history on mount
  useEffect(() => {
    AsyncStorage.getItem('palpa_history')
      .then(raw => { if (raw) setHistory(JSON.parse(raw)); })
      .catch(() => {});
  }, []);

  const saveHistory = (code) => {
    const time = new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
    setHistory(prev => {
      const filtered = prev.filter(h => h.code !== code);
      const next = [{ code, time }, ...filtered].slice(0, 15);
      AsyncStorage.setItem('palpa_history', JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const handleBarcode = ({ data }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(80);
    setBarcode(data);
    saveHistory(data);
    setScreen('home');
  };

  const checkManual = () => {
    const code = manual.trim();
    if (code.length < 8) {
      Alert.alert('Too short', 'Please enter at least 8 digits.');
      return;
    }
    setBarcode(code);
    saveHistory(code);
    setManual('');
  };

  const openPalpa = () => {
    Linking.openURL(PALPA_URL).catch(() =>
      Alert.alert('Error', 'Could not open browser.')
    );
  };

  const startScan = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Camera permission needed',
          'Please allow camera access in Settings to scan barcodes.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setScanned(false);
    setScreen('scan');
  };

  // ── Scanner screen ─────────────────────────────────────────
  if (screen === 'scan') {
    return (
      <View style={styles.scanScreen}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={handleBarcode}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
          }}
        />

        {/* Dark overlay with cutout */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanWindow}>
              {/* Corner marks */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              {/* Scan line */}
              <ScanLine />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            <Text style={styles.scanHint}>Point camera at the barcode</Text>
            <Text style={styles.scanSub}>EAN-13 · EAN-8 · UPC-A supported</Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setScreen('home')}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── Home screen ────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>📦</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>PALPA Scanner</Text>
            <Text style={styles.headerSub}>Finnish deposit check</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* Scan button */}
          <TouchableOpacity style={styles.scanBtn} onPress={startScan} activeOpacity={0.85}>
            <Text style={styles.scanBtnIcon}>📷</Text>
            <View>
              <Text style={styles.scanBtnTitle}>Scan Barcode</Text>
              <Text style={styles.scanBtnSub}>Open camera and point at bottle or can</Text>
            </View>
          </TouchableOpacity>

          {/* Manual entry */}
          <View style={styles.manualCard}>
            <Text style={styles.sectionLabel}>Or enter manually</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={manual}
                onChangeText={setManual}
                placeholder="e.g. 6408430000027"
                placeholderTextColor="#b0bdb5"
                keyboardType="numeric"
                maxLength={14}
                returnKeyType="done"
                onSubmitEditing={checkManual}
              />
              <TouchableOpacity style={styles.checkBtn} onPress={checkManual}>
                <Text style={styles.checkBtnText}>Check</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Result */}
          {barcode !== '' && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultLabel}>Barcode detected</Text>
                <Text style={styles.resultCode}>{barcode}</Text>
              </View>
              <View style={styles.resultBody}>
                <TouchableOpacity style={styles.palpaBtn} onPress={openPalpa} activeOpacity={0.85}>
                  <View>
                    <Text style={styles.palpaBtnTitle}>Check deposit on PALPA →</Text>
                    <Text style={styles.palpaBtnSub}>Opens extra.palpa.fi in your browser</Text>
                  </View>
                  <Text style={styles.arrowIcon}>↗</Text>
                </TouchableOpacity>

                <View style={styles.note}>
                  <Text style={styles.noteIcon}>ℹ️</Text>
                  <Text style={styles.noteText}>
                    PALPA shows the product name, package type and deposit value (pantin arvo).
                    Works for Finnish registered bottles and cans only.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setBarcode('')}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearBtnText}>Clear result</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* History */}
          {history.length > 0 && (
            <View style={styles.histSection}>
              <Text style={styles.histTitle}>Recent scans</Text>
              {history.map((item) => (
                <TouchableOpacity
                  key={item.code + item.time}
                  style={styles.histItem}
                  onPress={() => setBarcode(item.code)}
                >
                  <Text style={styles.histIcon}>▐▌</Text>
                  <Text style={styles.histCode}>{item.code}</Text>
                  <Text style={styles.histTime}>{item.time}</Text>
                  <Text style={styles.histArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.footer}>
            Data by Suomen Palautuspakkaus Oy (PALPA){'\n'}
            Not affiliated with PALPA · Finnish deposits only
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// Animated scan line
// ─────────────────────────────────────────────────────────────
function ScanLine() {
  const anim = useRef(null);
  const [top, setTop] = useState(0);
  const dir = useRef(1);

  useEffect(() => {
    const id = setInterval(() => {
      setTop(prev => {
        const next = prev + dir.current * 2;
        if (next >= 100) { dir.current = -1; return 100; }
        if (next <= 0)   { dir.current =  1; return 0; }
        return next;
      });
    }, 12);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={[styles.scanLineWrap, { top: `${top}%` }]}>
      <View style={styles.scanLine} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
const CORNER_SIZE = 22;
const CORNER_THICK = 3;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Header
  header: {
    backgroundColor: COLORS.dark,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 38, height: 38,
    backgroundColor: COLORS.green,
    borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 18 },
  headerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSub: { color: '#8aac96', fontSize: 12, marginTop: 1 },

  // Scan button
  scanBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scanBtnIcon: { fontSize: 32 },
  scanBtnTitle: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  scanBtnSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

  // Manual card
  manualCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#d4ddd8',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1,
    color: COLORS.dark,
    backgroundColor: COLORS.bg,
  },
  checkBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  checkBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  // Result card
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  resultHeader: {
    backgroundColor: COLORS.greenPale,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greenMid,
    padding: 14,
  },
  resultLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  resultCode: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
    letterSpacing: 2,
    marginTop: 4,
  },
  resultBody: { padding: 16, gap: 10 },

  // PALPA button
  palpaBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  palpaBtnTitle: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  palpaBtnSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  arrowIcon: { color: COLORS.white, fontSize: 22, fontWeight: '300' },

  // Note
  note: {
    backgroundColor: '#fffbf0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f5e9c0',
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  noteIcon: { fontSize: 14 },
  noteText:  { flex: 1, fontSize: 12, color: '#7a6020', lineHeight: 18 },

  // Clear
  clearBtn: { alignItems: 'center', paddingVertical: 4 },
  clearBtnText: { color: COLORS.gray, fontSize: 13 },

  // History
  histSection: { marginBottom: 16 },
  histTitle: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  histItem: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  histIcon: { color: COLORS.green, fontSize: 14, fontWeight: '700' },
  histCode: { flex: 1, fontSize: 14, fontWeight: '700', letterSpacing: 0.8, color: COLORS.dark },
  histTime: { fontSize: 12, color: COLORS.gray },
  histArrow:{ fontSize: 18, color: COLORS.green },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#a0ada6',
    lineHeight: 18,
    marginTop: 8,
  },

  // ── Scanner screen ────────────────────────────────────────
  scanScreen: { flex: 1, backgroundColor: '#000' },

  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayMiddle: { flexDirection: 'row', height: 160 },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  overlayBottom: {
    flex: 1.5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 20,
  },

  scanWindow: {
    width: 260,
    height: 160,
    borderRadius: 4,
    overflow: 'hidden',
  },

  // Corners
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#5eff99',
    borderWidth: 0,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK },

  // Scan line
  scanLineWrap: { position: 'absolute', left: 0, right: 0 },
  scanLine: {
    height: 2,
    backgroundColor: '#5eff99',
    shadowColor: '#5eff99',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },

  scanHint: { color: '#fff', fontSize: 15, fontWeight: '600' },
  scanSub:  { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  cancelBtn: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 30,
  },
  cancelText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
