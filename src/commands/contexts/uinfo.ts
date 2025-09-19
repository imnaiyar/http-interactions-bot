import { formatUserInfo } from '@/utils';
import type { ContextMenu } from '@/structures';
import { ApplicationCommandType } from 'discord-api-types/v10';
export default {
	data: {
		name: 'Info',
		type: ApplicationCommandType.User,
		integration_types: [1],
		contexts: [0, 1, 2],
	},
	async run(app, interaction, options) {
		const targetUser = await app.api.getUser(interaction.data.target_id);
		const member = options.getTargetMember();
		// prettier-ignore
		const embed = formatUserInfo( member ?? undefined as any , targetUser, interaction, app);
		await app.api.editInteractionReply(interaction.application_id, interaction.token, {
			embeds: [embed.toJSON() as any],
		});
	},
} satisfies ContextMenu<'User'>;
