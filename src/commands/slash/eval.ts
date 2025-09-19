import { IntegrationType, type SlashCommand } from '@/structures';
import { codeBlock, EmbedBuilder } from '@discordjs/builders';
import { ApplicationCommandOptionType, MessageFlags } from 'discord-api-types/v10';
import { Stopwatch } from '@sapphire/stopwatch';
import { postToHaste } from '@/utils';
import Sval from 'sval';

// For Workers compatibility, use a basic inspect function instead of Node's util.inspect
function inspect(obj: any, options: { depth?: number } = {}): string {
	const depth = options.depth ?? 0;

	if (obj === null) return 'null';
	if (obj === undefined) return 'undefined';
	if (typeof obj === 'string') return `'${obj}'`;
	if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
	if (typeof obj === 'function') return `[Function: ${obj.name || 'anonymous'}]`;

	if (Array.isArray(obj)) {
		if (depth === 0) return '[Array]';
		return `[${obj.map((item) => inspect(item, { depth: depth - 1 })).join(', ')}]`;
	}

	if (typeof obj === 'object') {
		if (depth === 0) return '[Object]';
		const keys = Object.keys(obj);
		const props = keys.slice(0, 5).map((key) => `${key}: ${inspect(obj[key], { depth: depth - 1 })}`);
		return `{ ${props.join(', ')}${keys.length > 5 ? ', ...' : ''} }`;
	}

	return String(obj);
}
export default {
	data: {
		name: 'eval',
		description: 'evaluate JavaScript expressions safely using Sval interpreter',
		options: [
			{
				name: 'exp',
				description: 'expression to evaluate',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'async',
				description: 'eval an async expression',
				type: ApplicationCommandOptionType.Boolean,
			},
			{
				name: 'haste',
				description: 'paste the result to haste',
				type: ApplicationCommandOptionType.Boolean,
			},
			{
				name: 'depth',
				description: 'depth of the output',
				type: ApplicationCommandOptionType.String,
			},
			{
				name: 'hide',
				description: 'hide the response',
				type: ApplicationCommandOptionType.Boolean,
			},
		],
		integration_types: [IntegrationType.Users],
		contexts: [1, 0, 2],
	},
	ownerOnly: true,
	async run(app, interaction, options) {
		let code = options.getString('exp')!;
		const async = options.getBoolean('async');
		const haste = options.getBoolean('haste') || false;
		const hide = options.getBoolean('hide');
		
		// Wrap in async function if requested
		if (async) {
			code = `(async () => { ${code} })()`;
		}
		
		const dp = options.getString('depth') || '0';
		const regex = /^\d+$|^Infinity$|^null$/;

		const match = dp.match(regex);
		if (code.includes('process.env') || code.includes('TOKEN') || code.includes('DISCORD')) {
			await app.api.editInteractionReply(interaction.application_id, interaction.token, {
				content: 'You cannot evaluate an expression that may expose secrets',
				flags: hide ? MessageFlags.Ephemeral : undefined,
			});
			return;
		}
		if (!match) {
			await app.api.editInteractionReply(interaction.application_id, interaction.token, {
				content: `${dp} is not a valid depth`,
				flags: hide ? MessageFlags.Ephemeral : undefined,
			});
			return;
		}
		let result;
		try {
			const time = new Stopwatch().start();
			
			// Use Sval interpreter for safe JavaScript execution
			const interpreter = new Sval({
				ecmaVer: 2020,
				sandBox: true,
			});
			
			// Add some useful globals to the interpreter context
			interpreter.import('console', console);
			interpreter.import('Math', Math);
			interpreter.import('Date', Date);
			interpreter.import('JSON', JSON);
			interpreter.import('Array', Array);
			interpreter.import('Object', Object);
			interpreter.import('String', String);
			interpreter.import('Number', Number);
			interpreter.import('Boolean', Boolean);
			interpreter.import('app', app);
			interpreter.import('interaction', interaction);
			interpreter.import('options', options);
			
			// Execute the code and get the result
			interpreter.run(`exports.result = ${code}`);
			let output = interpreter.exports.result;
			
			// Handle promises (for async code)
			if (output && typeof output.then === 'function') {
				output = await output;
			}
			
			time.stop();
			result = await buildSuccessResponse(output, time.toString(), haste, parseInt(dp), code);
		} catch (err) {
			console.error(err);
			result = buildErrorResponse(err);
		}
		await app.api.editInteractionReply(interaction.application_id, interaction.token, result);
	},
} satisfies SlashCommand;

const buildSuccessResponse = async (output: any, time: string, haste: boolean, depth: number, input: any) => {
	// Token protection
	output = (typeof output === 'string' ? output : inspect(output, { depth: depth }))
		.replaceAll('TOKEN', '~~REDACTED~~')
		.replaceAll(/token:\s*'.*?'/g, "token: '~~REDACTED~~'")
		.replaceAll(/DISCORD_TOKEN/g, '~~REDACTED~~');
	let embOutput;

	if (!haste && output.length <= 2048) {
		embOutput = codeBlock('js', output);
	} else {
		embOutput = await postToHaste(output);
	}
	const embed = new EmbedBuilder()
		.setAuthor({ name: '📤 Output' })
		.setDescription(`**Input**\n\n` + codeBlock(input) + '\n**Output**\n\n' + embOutput)
		.setColor(0x2c9438)
		.setFooter({
			text: `⏱️ Took ${time} | Type "${typeof output}"`,
		})
		.setTimestamp(Date.now());

	return { embeds: [embed.toJSON() as any] };
};

const buildErrorResponse = (err: any) => {
	const embed = new EmbedBuilder()
		.setAuthor({ name: '📤 Error' })
		.setDescription('```js\n' + (err.length > 4096 ? `${err.substr(0, 4000)}...` : err) + '\n```')
		.setColor(0xff0000)
		.setTimestamp();

	return { embeds: [embed.toJSON() as any] };
};
