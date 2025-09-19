import { describe, it, expect } from 'vitest';
import Sval from 'sval';

describe('Eval Command with Sval Interpreter', () => {
	it('should handle basic expressions', () => {
		const interpreter = new Sval({
			ecmaVer: 2020,
			sandBox: true,
		});
		
		// Add globals
		interpreter.import('Math', Math);
		interpreter.import('JSON', JSON);
		
		// Test basic math
		interpreter.run('exports.result = 5 + 3 * 2');
		expect(interpreter.exports.result).toBe(11);
		
		// Test Math functions
		interpreter.run('exports.result = Math.floor(3.7)');
		expect(interpreter.exports.result).toBe(3);
		
		// Test JSON operations
		interpreter.run('exports.result = JSON.stringify({test: true})');
		expect(interpreter.exports.result).toBe('{"test":true}');
	});
	
	it('should handle functions and arrays', () => {
		const interpreter = new Sval({
			ecmaVer: 2020,
			sandBox: true,
		});
		
		// Test function definitions
		interpreter.run(`
			function multiply(a, b) {
				return a * b;
			}
			exports.result = multiply(6, 7);
		`);
		expect(interpreter.exports.result).toBe(42);
		
		// Test array operations
		interpreter.run(`
			const arr = [1, 2, 3, 4, 5];
			exports.result = arr.map(x => x * 2).reduce((a, b) => a + b, 0);
		`);
		expect(interpreter.exports.result).toBe(30);
	});
	
	it('should handle async operations', async () => {
		const interpreter = new Sval({
			ecmaVer: 2020,
			sandBox: true,
		});
		
		// Test async/await
		interpreter.run(`
			exports.result = (async () => {
				const promise = Promise.resolve(42);
				return await promise;
			})();
		`);
		
		const result = await interpreter.exports.result;
		expect(result).toBe(42);
	});
	
	it('should handle complex expressions', () => {
		const interpreter = new Sval({
			ecmaVer: 2020,
			sandBox: true,
		});
		
		interpreter.import('Date', Date);
		
		// Test object operations
		interpreter.run(`
			const obj = {
				name: 'test',
				values: [1, 2, 3],
				calculate() {
					return this.values.reduce((a, b) => a + b, 0);
				}
			};
			exports.result = obj.calculate();
		`);
		expect(interpreter.exports.result).toBe(6);
		
		// Test Date operations
		interpreter.run(`
			const now = Date.now();
			exports.result = typeof now;
		`);
		expect(interpreter.exports.result).toBe('number');
	});
});