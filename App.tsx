import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  createInitialState,
  inputBackspace,
  inputClear,
  inputDecimal,
  inputDigit,
  inputEquals,
  inputOperator,
  inputPercent,
  inputToggleSign,
  type Operator,
} from './src/calculatorLogic';

type Key =
  | { kind: 'digit'; value: string }
  | { kind: 'decimal' }
  | { kind: 'backspace' }
  | { kind: 'allClear' }
  | { kind: 'percent' }
  | { kind: 'toggleSign' }
  | { kind: 'equals' }
  | { kind: 'operator'; op: Operator };

const ROWS: Key[][] = [
  [
    { kind: 'backspace' },
    { kind: 'allClear' },
    { kind: 'percent' },
    { kind: 'operator', op: '/' },
  ],
  [
    { kind: 'digit', value: '7' },
    { kind: 'digit', value: '8' },
    { kind: 'digit', value: '9' },
    { kind: 'operator', op: '*' },
  ],
  [
    { kind: 'digit', value: '4' },
    { kind: 'digit', value: '5' },
    { kind: 'digit', value: '6' },
    { kind: 'operator', op: '-' },
  ],
  [
    { kind: 'digit', value: '1' },
    { kind: 'digit', value: '2' },
    { kind: 'digit', value: '3' },
    { kind: 'operator', op: '+' },
  ],
  [
    { kind: 'toggleSign' },
    { kind: 'digit', value: '0' },
    { kind: 'decimal' },
    { kind: 'equals' },
  ],
];

function labelForKey(key: Key): string | null {
  switch (key.kind) {
    case 'digit':
      return key.value;
    case 'decimal':
      return '.';
    case 'allClear':
      return 'AC';
    case 'percent':
      return '%';
    case 'toggleSign':
      return '+/−';
    case 'equals':
      return '=';
    case 'operator':
      if (key.op === '/') return '÷';
      if (key.op === '*') return '×';
      if (key.op === '-') return '−';
      return key.op;
    default:
      return null;
  }
}

function isOperatorKey(key: Key): boolean {
  return key.kind === 'operator' || key.kind === 'equals';
}

function isUtilityKey(key: Key): boolean {
  return (
    key.kind === 'backspace' ||
    key.kind === 'allClear' ||
    key.kind === 'percent' ||
    (key.kind === 'operator' && key.op === '/')
  );
}

function isNumberKey(key: Key): boolean {
  return (
    key.kind === 'digit' ||
    key.kind === 'decimal' ||
    key.kind === 'toggleSign'
  );
}

export default function App() {
  const [state, setState] = useState(createInitialState);

  const keySize = useMemo(() => {
    const w = Dimensions.get('window').width;
    const hPad = 20;
    const gap = 14;
    const cols = 4;
    const raw = (w - hPad * 2 - gap * (cols - 1)) / cols;
    return Math.min(82, Math.max(56, raw));
  }, []);

  const dispatch = useCallback((key: Key) => {
    setState((prev) => {
      switch (key.kind) {
        case 'digit':
          return inputDigit(prev, key.value);
        case 'decimal':
          return inputDecimal(prev);
        case 'allClear':
          return inputClear();
        case 'backspace':
          return inputBackspace(prev);
        case 'percent':
          return inputPercent(prev);
        case 'toggleSign':
          return inputToggleSign(prev);
        case 'equals':
          return inputEquals(prev);
        case 'operator':
          return inputOperator(prev, key.op);
        default:
          return prev;
      }
    });
  }, []);

  const topInset =
    Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0;

  const expressionVisible =
    state.expressionLine.length > 0 ? state.expressionLine : '\u00a0';

  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Menu"
        >
          <Ionicons name="menu" size={22} color="#fff" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Calculator"
        >
          <Ionicons name="calculator-outline" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.displayOuter}>
        <Text style={styles.expressionText} numberOfLines={1}>
          {expressionVisible}
        </Text>
        <Text
          style={styles.mainDisplayText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.35}
        >
          {state.display}
        </Text>
      </View>

      <View style={[styles.keypad, { paddingHorizontal: 20 }]}>
        {ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((key, colIndex) => {
              const label = labelForKey(key);
              const isOp = isOperatorKey(key);
              const isUtil = isUtilityKey(key);
              const isNum = isNumberKey(key);
              return (
                <Pressable
                  key={`${rowIndex}-${colIndex}-${key.kind}`}
                  onPress={() => dispatch(key)}
                  style={({ pressed }) => [
                    styles.keyCircle,
                    {
                      width: keySize,
                      height: keySize,
                      borderRadius: keySize / 2,
                    },
                    isOp && styles.keyOperator,
                    isUtil && !isOp && styles.keyUtility,
                    isNum && styles.keyNumber,
                    pressed && styles.keyPressed,
                  ]}
                >
                  {key.kind === 'backspace' ? (
                    <Ionicons name="backspace-outline" size={26} color="#fff" />
                  ) : (
                    <Text
                      style={[
                        styles.keyText,
                        isOp && styles.keyTextOnOrange,
                        isUtil && !isOp && styles.keyTextUtility,
                      ]}
                    >
                      {label}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  displayOuter: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 28,
    minHeight: 140,
  },
  expressionText: {
    fontSize: 22,
    fontWeight: '400',
    color: '#8e8e93',
    width: '100%',
    textAlign: 'right',
    marginBottom: 8,
    ...Platform.select({
      android: { fontFamily: 'sans-serif' },
      ios: { fontFamily: 'System' },
      default: {},
    }),
  },
  mainDisplayText: {
    fontSize: 64,
    fontWeight: '600',
    color: '#ffffff',
    width: '100%',
    textAlign: 'right',
    letterSpacing: -1,
    ...Platform.select({
      android: { fontFamily: 'sans-serif' },
      ios: { fontFamily: 'System' },
      default: {},
    }),
  },
  keypad: {
    paddingBottom: 28,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  keyCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyUtility: {
    backgroundColor: '#5c5c5e',
  },
  keyNumber: {
    backgroundColor: '#1c1c1e',
  },
  keyOperator: {
    backgroundColor: '#ff9f0a',
  },
  keyPressed: {
    opacity: 0.85,
  },
  keyText: {
    fontSize: 30,
    fontWeight: '500',
    color: '#ffffff',
  },
  keyTextUtility: {
    fontSize: 26,
    fontWeight: '500',
  },
  keyTextOnOrange: {
    fontSize: 34,
    fontWeight: '500',
    color: '#ffffff',
  },
});
