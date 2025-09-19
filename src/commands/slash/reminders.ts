import { ContextType, IntegrationType, type SlashCommand } from '@/structures';
import { ApplicationCommandOptionType, ChannelType } from 'discord-api-types/v10';
import { EmbedBuilder, time } from '@discordjs/builders';
export default {
	data: {
		name: 'reminders',
		description: 'set a reminder',
		options: [
			{
				name: 'text',
				description: 'description of the reminder',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'months',
				description: 'months until the reminder',
				min_value: 1,
				max_value: 6,
				type: ApplicationCommandOptionType.Integer,
				required: false,
			},
			{
				name: 'days',
				description: 'days until the reminder',
				min_value: 1,
				max_value: 100,
				type: ApplicationCommandOptionType.Integer,
				required: false,
			},
			{
				name: 'hours',
				description: 'hours until the reminder',
				min_value: 1,
				max_value: 500,
				type: ApplicationCommandOptionType.Integer,
				required: false,
			},
			{
				name: 'minutes',
				description: 'minutes until the reminder',
				min_value: 1,
				max_value: 1000,
				type: ApplicationCommandOptionType.Integer,
				required: false,
			},
		],
		integration_types: [IntegrationType.Users],
		contexts: [ContextType.BotDM, ContextType.Guild, ContextType.PrivateChannels],
	},
	async run(app, interaction, options) {
		const user = interaction.user || interaction.member?.user;
		const text = options.getString('text', true);
		const months = options.getInteger('months', false);
		const days = options.getInteger('days', false);
		const hours = options.getInteger('hours', false);
		const minutes = options.getInteger('minutes', false);
		const seconds = options.getInteger('seconds', false);
		if (!months && !days && !hours && !minutes && !seconds) {
			await app.api.editInteractionReply(interaction.application_id, interaction.token, {
				content: 'You must provide at least one time options.',
			});
			return;
		}
		if (interaction.channel.type !== ChannelType.DM || !interaction.channel.recipients?.find((v) => v.id === app.env.DISCORD_CLIENT_ID)) {
			await app.api.editInteractionReply(interaction.application_id, interaction.token, {
				content: 'You can only use this command in my DMs',
			});
			return;
		}
		const dur =
			Date.now() +
			(months || 0) * 30 * 24 * 60 * 60_000 +
			(days || 0) * 24 * 60 * 60_000 +
			(hours || 0) * 60 * 60_000 +
			(minutes || 0) * 60_000;

		const embed = new EmbedBuilder()
			.setTitle('Reminders')
			.setDescription(
				`Reminders saved\nText: \`${text}\`\n\nIn: ${time(Math.trunc(dur / 1000), 'F')} (${time(Math.trunc(dur / 1000), 'R')})`,
			)
			.setColor(0x3cff2e);

		await app.env.REMINDERS.put(interaction.id, '', {
			metadata: {
				authorId: interaction.user?.id ?? interaction.member!.user.id,
				text,
				time: dur,
				username: user!.username,
				setAt: Date.now(),
				dmId: interaction.channel.id,
				sent: false,
			},
			expiration: Math.trunc(dur / 1000) + 3600, // 1 hour after the reminder
		});
		await app.api.editInteractionReply(interaction.application_id, interaction.token, {
			embeds: [embed.toJSON() as any],
			flags: app.ephemeral,
		});
	},
} satisfies SlashCommand;

export interface Reminder {
	authorId: string;
	text: string;
	time: number;
	username: string;
	setAt: number;
	dmId: string;
	sent: boolean;
}
