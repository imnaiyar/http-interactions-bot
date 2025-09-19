# Safe Evaluator for Cloudflare Workers

This module provides a Workers-compatible alternative to JavaScript's `eval()` function, which is not available in Cloudflare Workers for security reasons.

## What it supports

The safe evaluator supports a limited but useful subset of JavaScript expressions:

### Basic Literals
- Numbers: `42`, `3.14`
- Strings: `"hello"`, `'world'`
- Booleans: `true`, `false`
- Null/undefined: `null`, `undefined`
- Simple objects/arrays: `{}`, `[]`

### Property Access
- Global objects: `Math.PI`, `Math.E`, `Infinity`, `NaN`
- Object properties: `Date.now`, `console.log`

### Method Calls
- Math functions: `Math.floor(3.7)`, `Math.max(5, 10)`, `Math.random()`
- JSON operations: `JSON.stringify(true)`, `JSON.parse('{"a":1}')`
- Date operations: `Date.now()`, `new Date()`

### Basic Arithmetic
- Simple operations: `5 + 3`, `10 - 4`, `6 * 7`, `15 / 3`
- Division by zero protection

## What it doesn't support

The safe evaluator does **not** support:
- Function definitions: `function() {}`
- Arrow functions: `() => {}`
- Variable declarations: `let x = 5`
- Complex expressions: `for`, `while`, `if`
- Async/await: `async () => {}`
- Object destructuring: `{a, b} = obj`
- Spread operators: `...args`
- Any `eval()` or `Function()` constructor calls

## Usage

```typescript
import { safeEvaluate } from '@/utils/safeEvaluator';

// Basic usage
const result = await safeEvaluate('Math.PI * 2'); // 6.283...

// With custom context
const result = await safeEvaluate('myVar + 10', { myVar: 5 }); // 15

// Error handling
const result = await safeEvaluate('function() {}');
// Returns: { __error: true, message: "...", note: "..." }
```

## Security

- No arbitrary code execution
- No access to global scope beyond safe objects
- No dynamic function creation
- Input validation and sanitization
- Clear error messages for unsupported operations

This implementation ensures the eval command works in Cloudflare Workers while maintaining security and providing clear feedback about limitations.