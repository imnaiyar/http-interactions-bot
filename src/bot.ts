import {
	type APIInteraction,
	type APIApplicationCommandAutocompleteInteraction,
	type APIApplicationCommandInteraction,
	ApplicationCommandType,
	type APIChatInputApplicationCommandInteraction,
	type APIContextMenuInteraction,
	MessageFlags,
	type APIChannel,
	type APIDMChannel,
	type APIInteractionResponseCallbackData,
	type Snowflake,
	type APIMessageComponentInteraction,
	type APIModalSubmitInteraction,
	InteractionResponseType,
} from 'discord-api-types/v10';
import { Collection } from '@discordjs/collection';
import { InteractionOptionResolver } from '@sapphire/discord-utilities';

import type { ContextMenu, SlashCommand } from '@/structures';
import { loadSlash, loadContext, validate } from '@/handlers';
import { handleReminders } from '@/handlers';
import config from '@/config';
import { DiscordAPI, type RawFile } from '@/services/discord';

type RepliableInteractions = Exclude<APIInteraction, APIApplicationCommandAutocompleteInteraction>;

export class Bot {
	public slash: Collection<string, SlashCommand> = new Collection();
	public contexts: Collection<string, ContextMenu<'User' | 'Message'>> = new Collection();
	public config = config;
	public channels = new Collection<string, APIChannel | APIDMChannel>();
	public api: DiscordAPI;
	public ephemeral: MessageFlags.Ephemeral | undefined = MessageFlags.Ephemeral;
	public env: Env;

	constructor(env: Env) {
		this.env = env;
		this.api = new DiscordAPI(env);
		this.init();
	}

	private async init() {
		try {
			// Load commands - we'll need to modify this for Workers
			const sCommands = loadSlash('commands/slash');
			const contexts = loadContext('commands/contexts');
			this.slash = sCommands;
			this.contexts = contexts;
			console.log('initialized');
		} catch (error) {
			console.error('Failed to initialize bot:', error);
		}
	}

	async handleApplicationCommand(interaction: APIApplicationCommandInteraction, ctx: ExecutionContext): Promise<Response> {
		const options = new InteractionOptionResolver(interaction as any);

		if (interaction.data.type === ApplicationCommandType.ChatInput) {
			const commandName = interaction.data.name;
			const command = this.slash.get(commandName);
			const isValid = validate(this, interaction, command);
			if (!isValid) {
				return new Response('Unauthorized', { status: 403 });
			}
			try {
				ctx.waitUntil(
					(async () => await command!.run(this, interaction as unknown as APIChatInputApplicationCommandInteraction, options))(),
				);
				// Return empty response since Discord API calls handle the response
				const hide = options.getBoolean('hide', false);
				return new Response(
					JSON.stringify({
						type: InteractionResponseType.DeferredChannelMessageWithSource,
						data: { flags: hide === null ? this.ephemeral : hide ? MessageFlags.Ephemeral : undefined },
					}),
					{ headers: { 'Content-Type': 'application/json' } },
				);
			} catch (err) {
				console.error('Command execution error:', err);
				return new Response('Internal error', { status: 500 });
			}
		}

		if (interaction.data.type === ApplicationCommandType.Message || interaction.data.type === ApplicationCommandType.User) {
			const command = this.contexts.get(interaction.data.name);
			const isValid = validate(this, interaction, command);
			if (!isValid) {
				return new Response('Unauthorized', { status: 403 });
			}

			try {
				ctx.waitUntil((async () => await command!.run(this, interaction as unknown as APIContextMenuInteraction, options))());
				return new Response(
					JSON.stringify({
						type: InteractionResponseType.DeferredChannelMessageWithSource,
						data: { flags: this.ephemeral },
					}),
					{ headers: { 'Content-Type': 'application/json' } },
				);
			} catch (err) {
				console.error('Context command execution error:', err);
				return new Response('Internal error', { status: 500 });
			}
		}

		return new Response('Unknown command type', { status: 400 });
	}

	async handleAutocomplete(interaction: APIApplicationCommandAutocompleteInteraction, ctx: ExecutionContext): Promise<Response> {
		const command = this.slash.get(interaction.data.name) as unknown as SlashCommand<true>;
		if (!command) {
			return new Response(
				JSON.stringify({
					type: InteractionResponseType.ApplicationCommandAutocompleteResult,
					data: { choices: [{ name: 'No command found! Something went wrong', value: null }] },
				}),
				{ headers: { 'Content-Type': 'application/json' } },
			);
		}

		const options = new InteractionOptionResolver(interaction as any);
		try {
			const choices = await command.autocomplete!(this, interaction, options);
			return new Response(
				JSON.stringify({
					type: InteractionResponseType.ApplicationCommandAutocompleteResult,
					data: choices,
				}),
				{ headers: { 'Content-Type': 'application/json' } },
			);
		} catch (err) {
			console.error('Autocomplete error:', err);
			return new Response('Internal error', { status: 500 });
		}
	}

	async handleMessageComponent(interaction: APIMessageComponentInteraction, ctx: ExecutionContext): Promise<Response> {
		const userId = interaction.data.custom_id.split(';')[1];

		if (userId && userId !== (interaction.member?.user || interaction.user!).id) {
			return new Response(
				JSON.stringify({
					type: InteractionResponseType.ChannelMessageWithSource,
					data: {
						content: 'This is not your interaction. Nice try tho Haha!!',
						flags: 64,
					},
				}),
				{ headers: { 'Content-Type': 'application/json' } },
			);
		}

		return new Response(null, { status: 200 });
	}

	async handleModalSubmit(interaction: APIModalSubmitInteraction): Promise<Response> {
		// Handle modal submissions here
		console.log('Modal submit received:', interaction.data.custom_id);
		return new Response(null, { status: 200 });
	}

	async handleScheduledReminders(): Promise<void> {
		try {
			await handleReminders(this);
		} catch (error) {
			console.error('Error handling scheduled reminders:', error);
		}
	}

	/** Reply to the given interaction */
	public reply(interaction: RepliableInteractions, data: APIInteractionResponseCallbackData & { files?: RawFile[] }) {
		return this.api.replyToInteraction(interaction.id, interaction.token, data);
	}

	/** Edit the reply to the given interaction */
	public editReply(
		interaction: RepliableInteractions,
		data: APIInteractionResponseCallbackData & { files?: RawFile[] },
		messageId: Snowflake = '@original',
	) {
		return this.api.editInteractionReply(interaction.application_id, interaction.token, data, messageId);
	}

	/** Update this interactions Message */
	public update(
		interaction: APIMessageComponentInteraction | APIModalSubmitInteraction,
		data: APIInteractionResponseCallbackData & { files?: RawFile[] },
	) {
		return this.api.updateInteractionMessage(interaction.id, interaction.token, data);
	}

	/** Delete the reply to this interaction */
	public deleteReply(interaction: RepliableInteractions, messageId: Snowflake = '@original') {
		return this.api.deleteInteractionReply(interaction.application_id, interaction.token, messageId);
	}

	/** Create a follow up response to this interaction */
	public followUp(interaction: RepliableInteractions, data: APIInteractionResponseCallbackData & { files?: RawFile[] }) {
		return this.api.followUpInteraction(interaction.application_id, interaction.token, data);
	}
}
