import { ContextType, IntegrationType, type ContextMenu } from '@/structures';
import { ApplicationCommandType } from '@discordjs/core/http-only';
import fs from 'node:fs';
import { messageLink } from '@discordjs/formatters';
import { Bookmark } from '../slash/bookmarks';
export default {
	data: {
		name: 'Bookmark',
		type: ApplicationCommandType.Message,
		integration_types: [IntegrationType.Users],
		contexts: [ContextType.BotDM, ContextType.Guild, ContextType.PrivateChannels],
	},
	async run(app, interaction, options) {
		const message = options.getTargetMessage();
		const content = message.content;
		const authorId = interaction.member?.user.id ?? interaction.user!.id;
		const username = message.author.username;
		const guildId = interaction.guild_id;
		const url = messageLink(message.channel_id, message.id, interaction.guild_id ?? '@me');
		const bookmarked = (await app.env.bookmarks.getWithMetadata<'', Bookmark>(message.id, 'json')).metadata;
		if (bookmarked) {
			await app.api.interactions.reply(interaction.id, interaction.token, {
				content: 'This message is already bookmarked',
				flags: app.ephemeral,
			});
			return;
		}
		9;
		await app.env.bookmarks.put(message.id, '', {
			metadata: {
				content,
				authorId,
				username,
				url,
				messageId: message.id,
				...(guildId && { guildId }),
			},
		});

		await app.api.interactions.reply(interaction.id, interaction.token, {
			content: 'Bookmark saved!',
			flags: app.ephemeral,
		});
	},
} satisfies ContextMenu<'Message'>;
