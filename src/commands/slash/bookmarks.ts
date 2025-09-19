import { ContextType, IntegrationType, type SlashCommand } from '@/structures';
import { ApplicationCommandOptionType, ButtonStyle, MessageFlags } from 'discord-api-types/v10';
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from '@discordjs/builders';
export default {
	data: {
		name: 'bookmarks',
		description: 'get yor bookmarks',
		options: [
			{
				name: 'get',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'get your bookmarks',
				options: [
					{
						name: 'keyword',
						description: 'bookmark keywords',
						type: ApplicationCommandOptionType.String,
						required: true,
						autocomplete: true,
					},
					{
						name: 'hide',
						description: 'hides the response',
						type: ApplicationCommandOptionType.Boolean,
						required: false,
					},
				],
			},
			{
				name: 'delete',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'get your bookmarks',
				options: [
					{
						name: 'keyword',
						description: 'bookmark keywords',
						type: ApplicationCommandOptionType.String,
						required: true,
						autocomplete: true,
					},
					{
						name: 'hide',
						description: 'hides the response',
						type: ApplicationCommandOptionType.Boolean,
					},
				],
			},
		],
		integration_types: [IntegrationType.Users],
		contexts: [ContextType.BotDM, ContextType.Guild, ContextType.PrivateChannels],
	},
	async run(app, interaction, options) {
		const value = options.getString('keyword');
		const sub = options.getSubcommand();
		const hide = options.getBoolean('hide');
		if (!value || value === 'null') {
			await app.api.replyToInteraction(interaction.id, interaction.token, {
				content: 'Invalid Keyword: No bookmarks found with that keyword',
				flags: hide === null ? app.ephemeral : hide ? MessageFlags.Ephemeral : undefined,
			});
			return;
		}

		const userId = interaction.user?.id ?? interaction.member!.user.id;
		const bookmark = (await app.env.bookmarks.getWithMetadata<Bookmark>(value)).metadata;
		switch (sub) {
			case 'get': {
				if (!bookmark) {
					await app.api.replyToInteraction(interaction.id, interaction.token, {
						content: 'Invalid Keyword: No bookmarks found with that keyword',
						flags: hide === null ? app.ephemeral : hide ? MessageFlags.Ephemeral : undefined,
					});
					return;
				}
				const embed = new EmbedBuilder()
					.setTitle(`${bookmark.username} Message`)
					.setDescription(`${bookmark.content || 'No Desc'}`)
					.setFooter({ text: `Requested by ${interaction.member?.user.id ?? interaction.user!.id}` });
				const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Link').setURL(bookmark.url),
				);
				await app.api.replyToInteraction(interaction.id, interaction.token, {
					embeds: [embed.toJSON() as any],
					components: [buttons.toJSON() as any],
					flags: hide === null ? app.ephemeral : hide ? MessageFlags.Ephemeral : undefined,
				});
				break;
			}
			case 'delete': {
				if (!bookmark) {
					await app.api.replyToInteraction(interaction.id, interaction.token, {
						content: 'Invalid Keyword: No bookmark found with that keyword',
						flags: MessageFlags.Ephemeral,
					});
					return;
				}
				await app.env.bookmarks.delete(value);
				await app.reply(interaction, {
					content: 'Bookmark Deleted',
					embeds: [],
					components: [],
				});
			}
		}
	},
	async autocomplete(app, interaction, options) {
		try {
			const op = options.getFocusedOption();
			console.log('Hello: autocomplete');
			const value = op.value as string;
			const bookmarks = (await app.env.bookmarks.list<Bookmark>({ prefix: '' })).keys.map((v) => v.metadata).filter(Boolean) as Bookmark[];
			const parsed = bookmarks.filter((v) => v.authorId === (interaction.member?.user.id ?? interaction.user!.id));

			if (!parsed) {
				await app.api.createAutocompleteResponse(interaction.id, interaction.token, {
					choices: [
						{
							name: 'No saved bookmarks',
							value: 'null',
						},
					],
				});
				return;
			}
			let data = Object.values(parsed)
				.filter(
					(v) =>
						v.authorId.toLocaleLowerCase().includes(value.toLocaleLowerCase()) ||
						v.content.toLocaleLowerCase().includes(value.toLocaleLowerCase()) ||
						v.url.toLocaleLowerCase().includes(value.toLocaleLowerCase()) ||
						v.username.toLocaleLowerCase().includes(value.toLocaleLowerCase()) ||
						v.messageId.toLocaleLowerCase().includes(value.toLocaleLowerCase()),
				)
				.map((v) => ({
					name: `${v.username}: ${v.content.substring(0, 40)}...`,
					value: v.messageId.toString(),
				}));
			await app.api.createAutocompleteResponse(interaction.id, interaction.token, {
				choices: data,
			});
		} catch (err) {
			await app.api.createAutocompleteResponse(interaction.id, interaction.token, {
				choices: [{ name: 'Something went wrong', value: 'wrong' }],
			});
			console.error(err);
		}
	},
} satisfies SlashCommand<true>;

export interface Bookmark {
	authorId: string;
	content: string;
	url: string;
	username: string;
	messageId: string;
	guildId?: string;
}
