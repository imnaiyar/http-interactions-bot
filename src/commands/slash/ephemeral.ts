import { ContextType, IntegrationType, type SlashCommand } from '@/structures';
import { MessageFlags } from 'discord-api-types/v10';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
export default {
	data: {
		name: 'ephemeral',
		description: 'change ephemeral state of replies',
		options: [
			{
				name: 'ephemeral',
				description: 'the ephemeral state',
				type: ApplicationCommandOptionType.Boolean,
				required: true,
			},
		],
		integration_types: [IntegrationType.Users],
		contexts: [ContextType.BotDM, ContextType.Guild, ContextType.PrivateChannels],
	},
	ownerOnly: true,
	async run(app, interaction, options) {
		const hide = options.getBoolean('ephemeral');
		app.ephemeral = hide ? MessageFlags.Ephemeral : undefined;
		await app.editReply(interaction, {
			content: `Ephemeral state changed to \`${hide}\``,
		});
	},
} satisfies SlashCommand;
