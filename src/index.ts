/**
 * Welcome to Cloudflare Workers! This is your new worker, you can deploy it to the Cloudflare Edge with Wrangler.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { InteractionType, InteractionResponseType } from 'discord-api-types/v10';
import type {
	APIInteraction,
	APIApplicationCommandInteraction,
	APIApplicationCommandAutocompleteInteraction,
	APIMessageComponentInteraction,
	APIModalSubmitInteraction,
} from 'discord-api-types/v10';
import { Bot } from './bot';
import { verify } from './middlewares/discord-verify';

// Initialize bot instance
let botInstance: Bot | null = null;

const getBotInstance = (env: Env): Bot => {
	if (!botInstance) {
		botInstance = new Bot(env);
	}
	return botInstance;
};

async function handleDiscordInteraction(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	// Verify the request is from Discord
	const isValid = await verify(request, env);
	if (!isValid) {
		return new Response('Invalid signature', { status: 401 });
	}

	const interaction: APIInteraction = await request.json();
	const bot = getBotInstance(env);

	// Handle ping
	if (interaction.type === InteractionType.Ping) {
		console.log('Ping received!');
		return new Response(JSON.stringify({ type: InteractionResponseType.Pong }), {
			headers: { 'Content-Type': 'application/json' },
		});
	}

	try {
		// Handle different interaction types
		if (interaction.type === InteractionType.ApplicationCommand) {
			return await bot.handleApplicationCommand(interaction as APIApplicationCommandInteraction, ctx);
		}

		if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
			return await bot.handleAutocomplete(interaction as APIApplicationCommandAutocompleteInteraction, ctx);
		}

		if (interaction.type === InteractionType.MessageComponent) {
			return await bot.handleMessageComponent(interaction as APIMessageComponentInteraction, ctx);
		}

		if (interaction.type === InteractionType.ModalSubmit) {
			return await bot.handleModalSubmit(interaction as APIModalSubmitInteraction);
		}

		return new Response('Unknown interaction type', { status: 400 });
	} catch (error) {
		console.error('Error handling interaction:', error);
		return new Response('Internal server error', { status: 500 });
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Handle Discord interactions
		if (url.pathname === '/interactions' && request.method === 'POST') {
			return await handleDiscordInteraction(request, env, ctx);
		}

		// Handle health check
		if (url.pathname === '/health' && request.method === 'GET') {
			return new Response('OK', { status: 200 });
		}

		// Handle other routes
		return new Response('Not found', { status: 404 });
	},

	// Scheduled handler for reminders (optional)
	async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
		const bot = getBotInstance(env);
		await bot.handleScheduledReminders();
	},
};
