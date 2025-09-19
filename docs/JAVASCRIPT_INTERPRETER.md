# JavaScript Interpreter for Cloudflare Workers

This implementation uses the `sval` JavaScript interpreter, which provides full JavaScript execution capabilities in Cloudflare Workers.

## What it supports

The sval interpreter supports the complete JavaScript language including:

### Full JavaScript Language Support
- **ES2020 features**: Arrow functions, async/await, destructuring, spread operator
- **Function definitions**: `function() {}`, `() => {}`, method definitions
- **Variable declarations**: `let`, `const`, `var` with proper scoping
- **Control flow**: `if/else`, `for`, `while`, `switch`, `try/catch`
- **Objects and arrays**: Full object manipulation, array methods
- **Classes**: Class definitions, inheritance, static methods
- **Modules**: Import/export (within the sandbox)

### Built-in JavaScript Objects
- **Math**: All Math functions and constants
- **Date**: Date creation and manipulation
- **JSON**: Parse and stringify operations
- **Array/Object/String/Number**: All prototype methods
- **Promise**: Async operations with full promise support
- **RegExp**: Regular expression support

### Custom Context
The interpreter provides access to:
- `app` - Discord API instance
- `interaction` - Current interaction object
- `options` - Command options
- `console` - Console logging (for debugging)

## Examples

### Basic Expressions
```javascript
// Math operations
5 + 3 * 2  // 11
Math.floor(3.7)  // 3
Math.random()  // random number

// String operations
"hello " + "world"  // "hello world"
"test".toUpperCase()  // "TEST"

// Array operations
[1, 2, 3].map(x => x * 2)  // [2, 4, 6]
```

### Functions and Logic
```javascript
// Function definitions
function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1);
}
factorial(5)  // 120

// Arrow functions
const add = (a, b) => a + b;
add(10, 20)  // 30

// Control flow
const numbers = [1, 2, 3, 4, 5];
const evens = numbers.filter(n => n % 2 === 0);  // [2, 4]
```

### Async Operations
```javascript
// Async/await
async function fetchData() {
  const data = await Promise.resolve({id: 1, name: "test"});
  return data.name;
}
fetchData()  // Promise resolving to "test"

// Promise chains
Promise.resolve(42)
  .then(x => x * 2)
  .then(x => x + 10)  // Promise resolving to 94
```

### Object Manipulation
```javascript
// Object operations
const user = {
  name: "Alice",
  age: 30,
  greet() {
    return `Hello, I'm ${this.name}`;
  }
};
user.greet()  // "Hello, I'm Alice"

// Destructuring
const {name, age} = user;
name  // "Alice"

// JSON operations
JSON.stringify(user)  // '{"name":"Alice","age":30}'
```

## Security

- **Sandboxed execution**: No access to file system or network
- **Controlled globals**: Only safe built-in objects are available
- **Token protection**: Automatic redaction of sensitive data
- **Input validation**: Expression content is checked before execution
- **Error handling**: Safe error reporting without exposing internals

## Advantages over Custom Evaluator

- ✅ **Full JavaScript support**: No limitations on language features
- ✅ **Async/await support**: Handle promises and async operations
- ✅ **Better performance**: Optimized interpreter implementation
- ✅ **Standard compliance**: Follows ECMAScript specifications
- ✅ **Extensive testing**: Well-tested library with good ecosystem support

This implementation provides the full power of JavaScript evaluation while maintaining security and compatibility with Cloudflare Workers.