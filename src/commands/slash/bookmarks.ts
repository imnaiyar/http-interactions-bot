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
				const embed = new EmbedBuilder()
					.setTitle(`Are you sure you want to delete this?`)
					.setDescription(`**Message**\n${bookmark.content.substring(0, 2000)}\n\nAuthor: ${bookmark.username}`)
					.setColor(0xff0000)
					.toJSON();
				const buttons = new ActionRowBuilder<ButtonBuilder>()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('yes' + `;${(interaction.member?.user || interaction.user!).id}`)
							.setLabel('Yes')
							.setStyle(ButtonStyle.Danger),
						new ButtonBuilder()
							.setCustomId('no' + `;${(interaction.member?.user || interaction.user!).id}`)
							.setLabel('No')
							.setStyle(ButtonStyle.Success),
						new ButtonBuilder().setLabel('Message Link').setStyle(ButtonStyle.Link).setURL(bookmark.url),
					)
					.toJSON();
				await app.api.replyToInteraction(interaction.id, interaction.token, {
					embeds: [embed as any],
					components: [buttons as any],
					flags: hide === null ? app.ephemeral : hide ? MessageFlags.Ephemeral : undefined,
				});
				const collector = new app.collector(app, {
					filter: (init) =>
						(init.user?.id ?? init.member!.user.id) === userId &&
						(init.data.custom_id.startsWith('yes') || init.data.custom_id.startsWith('no')),
					timeout: 60_000,
					max: 1,
				});
				collector.on('collect', async (int) => {
					const id = int.data.custom_id.split(';')[0];
					switch (id) {
						case 'yes': {
							await app.env.bookmarks.delete(value);
							app.update(int, {
								content: 'Bookmark Deleted',
								embeds: [],
								components: [],
							});
							break;
						}
						case 'no': {
							app.update(int, {
								content: 'Canceled deletion',
								components: [],
							});
						}
					}
				});
				collector.on('end', async (_collected, reason) => {
					if (reason === 'timeout') {
						app.api.editInteractionReply(interaction.application_id, interaction.token, {
							content: 'Canceled! Timed Out.',
							embeds: [],
							components: [],
						});
					}
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
			app.api.createAutocompleteResponse(interaction.id, interaction.token, {
				choices: data,
			});
		} catch (err) {
			app.api.createAutocompleteResponse(interaction.id, interaction.token, {
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
