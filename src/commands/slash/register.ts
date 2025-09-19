import { ContextType, IntegrationType, type SlashCommand } from '@/structures';
import { ApplicationCommandOptionType, MessageFlags, InteractionResponseType } from 'discord-api-types/v10';
import { EmbedBuilder } from '@discordjs/builders';
import { loadContext, loadSlash } from '@/handlers/loadCommands';
import config from '@/config';

export default {
	data: {
		name: 'register',
		description: 'Register bot commands with Discord (Owner only)',
		integration_types: [IntegrationType.Guilds, IntegrationType.Users],
		contexts: [ContextType.Guild, ContextType.BotDM, ContextType.PrivateChannels],
	},
	ownerOnly: true,
	async run(app, interaction, options) {
		const userId = interaction.member?.user?.id || interaction.user?.id;

		// Check if user is owner
		if (!userId || !config.OWNERS.includes(userId)) {
			return app.editReply(interaction, {
				content: '❌ This command is restricted to bot owners only.',
			});
		}

		try {
			const commands = [...loadSlash('commands/slash').values(), ...loadContext('commands/contexts').values()].map((cmd) => cmd.data);

			const apiUrl = `https://discord.com/api/v10/applications/${app.env.DISCORD_CLIENT_ID}/commands`;

			// Register commands with Discord
			const response = await fetch(apiUrl, {
				method: 'PUT',
				headers: {
					Authorization: `Bot ${app.env.DISCORD_TOKEN}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(commands),
			});

			if (!response.ok) {
				const errorData = await response.text();
				throw new Error(`Discord API error: ${response.status} - ${errorData}`);
			}

			const registeredCommands = (await response.json()) as any[];

			return app.editReply(interaction, {
				content: `✅ Successfully registered ${registeredCommands.length} commands .`,
			});
		} catch (error) {
			console.error('Error registering commands:', error);

			const errorEmbed = new EmbedBuilder()
				.setTitle('❌ Command Registration Failed')
				.setColor(0xff0000)
				.setDescription(`An error occurred while registering commands: ${error instanceof Error ? error.message : 'Unknown error'}`)
				.setTimestamp();

			return app.editReply(interaction, {
				embeds: [errorEmbed.toJSON()],
			});
		}
	},
} as SlashCommand;
