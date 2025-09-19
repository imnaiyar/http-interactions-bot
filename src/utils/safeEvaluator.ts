/**
 * Safe expression evaluator for Cloudflare Workers
 * Since eval() and Function constructor are not available in Workers,
 * this provides a limited but safe alternative for basic JavaScript expressions
 */

// Safe context object with commonly used globals
const createSafeContext = (customContext: Record<string, any> = {}) => ({
	// Math functions
	Math,
	
	// Date functions
	Date,
	
	// Basic globals
	console,
	JSON,
	Array,
	Object,
	String,
	Number,
	Boolean,
	
	// Utility functions
	typeof: (val: any) => typeof val,
	instanceof: (obj: any, constructor: any) => obj instanceof constructor,
	
	// Common constants
	undefined,
	null: null,
	true: true,
	false: false,
	Infinity,
	NaN,
	
	// Custom context
	...customContext,
});

/**
 * Parse and evaluate simple mathematical expressions
 * Supports basic arithmetic, comparisons, and some built-in functions
 */
export class SafeEvaluator {
	private context: Record<string, any>;
	
	constructor(customContext: Record<string, any> = {}) {
		this.context = createSafeContext(customContext);
	}
	
	/**
	 * Evaluate a simple expression safely
	 * This is a very limited evaluator that handles basic cases
	 */
	evaluate(expression: string): any {
		// Clean the expression
		expression = expression.trim();
		
		// Handle simple literal values
		if (this.isLiteral(expression)) {
			return this.parseLiteral(expression);
		}
		
		// Handle simple object literals like {}
		if (expression === '{}') {
			return {};
		}
		
		// Handle simple array literals like []
		if (expression === '[]') {
			return [];
		}
		
		// Handle property access (e.g., Math.PI, Date.now())
		if (this.isPropertyAccess(expression)) {
			return this.evaluatePropertyAccess(expression);
		}
		
		// Handle method calls (e.g., Math.floor(3.14), JSON.stringify({}))
		if (this.isMethodCall(expression)) {
			return this.evaluateMethodCall(expression);
		}
		
		// Handle simple arithmetic expressions
		if (this.isArithmetic(expression)) {
			return this.evaluateArithmetic(expression);
		}
		
		// For complex expressions, return a helpful error
		throw new Error(`Expression too complex or unsafe: ${expression}`);
	}
	
	private isLiteral(expr: string): boolean {
		// Check for numbers, strings, booleans, null, undefined
		return /^(\d+\.?\d*|'.*?'|".*?"|true|false|null|undefined)$/.test(expr);
	}
	
	private parseLiteral(expr: string): any {
		if (expr === 'null') return null;
		if (expr === 'undefined') return undefined;
		if (expr === 'true') return true;
		if (expr === 'false') return false;
		if (/^\d+\.?\d*$/.test(expr)) return Number(expr);
		if (/^['"].*['"]$/.test(expr)) return expr.slice(1, -1); // Remove quotes
		return expr;
	}
	
	private isPropertyAccess(expr: string): boolean {
		// e.g., Math.PI, Date.now, console.log
		return /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/.test(expr);
	}
	
	private evaluatePropertyAccess(expr: string): any {
		const parts = expr.split('.');
		let current = this.context[parts[0]];
		
		if (current === undefined) {
			throw new Error(`Unknown identifier: ${parts[0]}`);
		}
		
		for (let i = 1; i < parts.length; i++) {
			current = current[parts[i]];
			if (current === undefined) {
				throw new Error(`Property ${parts.slice(0, i + 1).join('.')} not found`);
			}
		}
		
		return current;
	}
	
	private isMethodCall(expr: string): boolean {
		// e.g., Math.floor(3.14), JSON.stringify({})
		return /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*\(.*\)$/.test(expr);
	}
	
	private evaluateMethodCall(expr: string): any {
		const match = expr.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\((.*)\)$/);
		if (!match) {
			throw new Error(`Invalid method call: ${expr}`);
		}
		
		const [, methodPath, argsStr] = match;
		const method = this.evaluatePropertyAccess(methodPath);
		
		if (typeof method !== 'function') {
			throw new Error(`${methodPath} is not a function`);
		}
		
		// Parse arguments (simplified - only handles literals and simple expressions)
		const args = this.parseArguments(argsStr);
		
		// Execute the method
		const pathParts = methodPath.split('.');
		const thisContext = pathParts.length > 1 ? this.evaluatePropertyAccess(pathParts.slice(0, -1).join('.')) : null;
		
		return method.apply(thisContext, args);
	}
	
	private parseArguments(argsStr: string): any[] {
		if (!argsStr.trim()) return [];
		
		// Very simple argument parsing - only handles basic literals
		const args: any[] = [];
		const argParts = argsStr.split(',');
		
		for (const arg of argParts) {
			const trimmed = arg.trim();
			if (this.isLiteral(trimmed)) {
				args.push(this.parseLiteral(trimmed));
			} else if (this.isPropertyAccess(trimmed)) {
				args.push(this.evaluatePropertyAccess(trimmed));
			} else {
				throw new Error(`Complex argument not supported: ${trimmed}`);
			}
		}
		
		return args;
	}
	
	private isArithmetic(expr: string): boolean {
		// Basic arithmetic operations
		return /^[\d\s\+\-\*\/\(\)\.]+$/.test(expr);
	}
	
	private evaluateArithmetic(expr: string): number {
		// Use a simple arithmetic evaluator for basic math
		// This is a very simplified version - only handles basic operations
		
		// Remove spaces
		expr = expr.replace(/\s/g, '');
		
		// For now, only handle very simple expressions
		const simpleMatch = expr.match(/^(\d+(?:\.\d+)?)\s*([+\-*/])\s*(\d+(?:\.\d+)?)$/);
		if (simpleMatch) {
			const [, left, op, right] = simpleMatch;
			const a = Number(left);
			const b = Number(right);
			
			switch (op) {
				case '+': return a + b;
				case '-': return a - b;
				case '*': return a * b;
				case '/': 
					if (b === 0) throw new Error('Division by zero');
					return a / b;
				default: throw new Error(`Unknown operator: ${op}`);
			}
		}
		
		// If it's just a number, return it
		if (/^\d+(?:\.\d+)?$/.test(expr)) {
			return Number(expr);
		}
		
		throw new Error(`Arithmetic expression too complex: ${expr}`);
	}
}

/**
 * Main evaluation function that provides a helpful response when eval is not available
 */
export async function safeEvaluate(code: string, context: Record<string, any> = {}): Promise<any> {
	const evaluator = new SafeEvaluator(context);
	
	try {
		return evaluator.evaluate(code);
	} catch (error) {
		// Provide helpful error message explaining limitations
		return {
			__error: true,
			message: `Expression evaluation failed: ${error.message}`,
			note: "This is a limited evaluator that only supports basic expressions like literals, property access (e.g., Math.PI), simple method calls (e.g., Math.floor(3.14)), and basic arithmetic. Complex JavaScript expressions are not supported in Cloudflare Workers for security reasons.",
			input: code
		};
	}
}