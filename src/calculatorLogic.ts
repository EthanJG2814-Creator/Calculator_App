export type Operator = '+' | '-' | '*' | '/';

export interface CalculatorState {
  display: string;
  currentValue: number | null;
  operator: Operator | null;
  waitingForOperand: boolean;
  expressionLine: string;
}

export function opSymbol(op: Operator): string {
  switch (op) {
    case '/':
      return '÷';
    case '*':
      return '×';
    case '-':
      return '−';
    case '+':
      return '+';
    default:
      return op;
  }
}

function formatLocaleForExpr(value: number): string {
  if (!Number.isFinite(value)) return '';
  return value.toLocaleString('en-US', {
    maximumFractionDigits: 12,
    useGrouping: true,
  });
}

function formatRawForExpr(raw: string): string {
  if (raw === 'Error') return '';
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return raw;
  return formatLocaleForExpr(n);
}

export function buildExpressionLine(state: CalculatorState): string {
  if (isErrorDisplay(state.display)) return '';
  if (state.currentValue === null || state.operator === null) {
    return '';
  }
  const left = formatLocaleForExpr(state.currentValue);
  const sym = opSymbol(state.operator);
  if (state.waitingForOperand) {
    return `${left}${sym}`;
  }
  return `${left}${sym}${formatRawForExpr(state.display)}`;
}

export function createInitialState(): CalculatorState {
  return {
    display: '0',
    currentValue: null,
    operator: null,
    waitingForOperand: false,
    expressionLine: '',
  };
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) {
    return 'Error';
  }
  const rounded = Math.round(n * 1e12) / 1e12;
  const s = String(rounded);
  if (s.length > 14) {
    return rounded.toPrecision(10);
  }
  return s;
}

function applyOp(a: number, op: Operator, b: number): number | null {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b === 0 ? null : a / b;
    default:
      return null;
  }
}

function isErrorDisplay(display: string): boolean {
  return display === 'Error';
}

function withExpr(state: CalculatorState, patch: Partial<CalculatorState>): CalculatorState {
  const next = { ...state, ...patch };
  return { ...next, expressionLine: buildExpressionLine(next) };
}

export function inputClear(): CalculatorState {
  return createInitialState();
}

export function inputDigit(state: CalculatorState, digit: string): CalculatorState {
  if (!/^[0-9]$/.test(digit)) {
    return state;
  }

  if (isErrorDisplay(state.display)) {
    return {
      ...createInitialState(),
      display: digit,
      waitingForOperand: false,
    };
  }

  if (state.waitingForOperand && state.operator === null) {
    return {
      ...state,
      display: digit,
      waitingForOperand: false,
      currentValue: null,
      expressionLine: '',
    };
  }

  if (state.waitingForOperand) {
    return withExpr(state, {
      display: digit,
      waitingForOperand: false,
    });
  }

  if (state.display === '0') {
    return withExpr(state, { display: digit });
  }

  const next = state.display + digit;
  if (next.replace('.', '').length > 15) {
    return state;
  }
  return withExpr(state, { display: next });
}

export function inputDecimal(state: CalculatorState): CalculatorState {
  if (isErrorDisplay(state.display)) {
    return {
      ...createInitialState(),
      display: '0.',
      waitingForOperand: false,
    };
  }

  if (state.waitingForOperand && state.operator === null) {
    return {
      ...state,
      display: '0.',
      waitingForOperand: false,
      currentValue: null,
      expressionLine: '',
    };
  }

  if (state.waitingForOperand) {
    return withExpr(state, {
      display: '0.',
      waitingForOperand: false,
    });
  }

  if (state.display.includes('.')) {
    return state;
  }

  return withExpr(state, { display: state.display + '.' });
}

export function inputOperator(state: CalculatorState, op: Operator): CalculatorState {
  if (isErrorDisplay(state.display)) {
    return state;
  }

  const value = parseFloat(state.display);

  if (state.currentValue === null) {
    return withExpr(state, {
      currentValue: value,
      operator: op,
      waitingForOperand: true,
    });
  }

  if (state.waitingForOperand) {
    return withExpr(state, {
      operator: op,
    });
  }

  if (state.operator === null) {
    return withExpr(state, {
      currentValue: value,
      operator: op,
      waitingForOperand: true,
    });
  }

  const result = applyOp(state.currentValue, state.operator, value);
  if (result === null) {
    return {
      ...createInitialState(),
      display: 'Error',
    };
  }

  const display = formatNumber(result);
  if (display === 'Error') {
    return {
      ...createInitialState(),
      display: 'Error',
    };
  }

  return withExpr(state, {
    display,
    currentValue: result,
    operator: op,
    waitingForOperand: true,
  });
}

export function inputEquals(state: CalculatorState): CalculatorState {
  if (isErrorDisplay(state.display)) {
    return state;
  }

  if (state.operator === null || state.currentValue === null) {
    return state;
  }

  if (state.waitingForOperand) {
    return state;
  }

  const value = parseFloat(state.display);
  const left = state.currentValue;
  const op = state.operator;
  const result = applyOp(left, op, value);
  if (result === null) {
    return {
      ...createInitialState(),
      display: 'Error',
    };
  }

  const display = formatNumber(result);
  if (display === 'Error') {
    return {
      ...createInitialState(),
      display: 'Error',
    };
  }

  const expressionLine = `${formatLocaleForExpr(left)}${opSymbol(op)}${formatLocaleForExpr(value)}`;

  return {
    display,
    currentValue: result,
    operator: null,
    waitingForOperand: true,
    expressionLine,
  };
}

export function inputBackspace(state: CalculatorState): CalculatorState {
  if (isErrorDisplay(state.display)) {
    return createInitialState();
  }
  if (state.waitingForOperand) {
    return state;
  }
  if (state.display.length <= 1) {
    return withExpr(state, { display: '0' });
  }
  let next = state.display.slice(0, -1);
  if (next === '-' || next === '') {
    next = '0';
  }
  return withExpr(state, { display: next });
}

export function inputPercent(state: CalculatorState): CalculatorState {
  if (isErrorDisplay(state.display)) {
    return state;
  }
  const v = parseFloat(state.display) / 100;
  const display = formatNumber(v);
  if (display === 'Error') {
    return { ...createInitialState(), display: 'Error' };
  }
  return withExpr(state, { display });
}

export function inputToggleSign(state: CalculatorState): CalculatorState {
  if (isErrorDisplay(state.display)) {
    return state;
  }
  if (state.waitingForOperand) {
    return state;
  }
  if (state.display === '0') {
    return state;
  }
  if (state.display.startsWith('-')) {
    const next = state.display.slice(1) || '0';
    return withExpr(state, { display: next });
  }
  return withExpr(state, { display: `-${state.display}` });
}
