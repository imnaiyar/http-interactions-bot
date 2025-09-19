import { describe, it, expect } from 'vitest';
import { SafeEvaluator, safeEvaluate } from '../src/utils/safeEvaluator';

describe('SafeEvaluator', () => {
	it('should evaluate simple literals', async () => {
		const result1 = await safeEvaluate('42');
		expect(result1).toBe(42);
		
		const result2 = await safeEvaluate('"hello"');
		expect(result2).toBe('hello');
		
		const result3 = await safeEvaluate('true');
		expect(result3).toBe(true);
		
		const result4 = await safeEvaluate('null');
		expect(result4).toBe(null);
		
		const result5 = await safeEvaluate('undefined');
		expect(result5).toBe(undefined);
	});
	
	it('should evaluate simple object and array literals', async () => {
		const result1 = await safeEvaluate('{}');
		expect(result1).toEqual({});
		
		const result2 = await safeEvaluate('[]');
		expect(result2).toEqual([]);
	});
	
	it('should evaluate basic property access', async () => {
		const result1 = await safeEvaluate('Math.PI');
		expect(result1).toBeCloseTo(3.14159);
		
		const result2 = await safeEvaluate('Math.E');
		expect(result2).toBeCloseTo(2.71828);
		
		const result3 = await safeEvaluate('Infinity');
		expect(result3).toBe(Infinity);
	});
	
	it('should evaluate simple method calls', async () => {
		const result1 = await safeEvaluate('Math.floor(3.7)');
		expect(result1).toBe(3);
		
		const result2 = await safeEvaluate('Math.max(5, 10)');
		expect(result2).toBe(10);
		
		const result3 = await safeEvaluate('JSON.stringify(true)');
		expect(result3).toBe('true');
	});
	
	it('should evaluate basic arithmetic', async () => {
		const result1 = await safeEvaluate('5 + 3');
		expect(result1).toBe(8);
		
		const result2 = await safeEvaluate('10 - 4');
		expect(result2).toBe(6);
		
		const result3 = await safeEvaluate('6 * 7');
		expect(result3).toBe(42);
		
		const result4 = await safeEvaluate('15 / 3');
		expect(result4).toBe(5);
	});
	
	it('should handle division by zero', async () => {
		const result = await safeEvaluate('5 / 0');
		expect(result).toHaveProperty('__error', true);
		expect(result.message).toContain('Division by zero');
	});
	
	it('should handle errors gracefully for complex expressions', async () => {
		const result = await safeEvaluate('function() { return 42; }');
		expect(result).toHaveProperty('__error', true);
		expect(result).toHaveProperty('message');
		expect(result).toHaveProperty('note');
	});
	
	it('should handle errors gracefully for unsafe expressions', async () => {
		const result = await safeEvaluate('eval("alert(1)")');
		expect(result).toHaveProperty('__error', true);
	});
	
	it('should work with custom context', async () => {
		const result = await safeEvaluate('myVar', { myVar: 'test value' });
		expect(result).toBe('test value');
	});
});