import { ContextType, IntegrationType, type SlashCommand } from '@/structures';
import { ApplicationCommandOptionType, MessageFlags } from 'discord-api-types/v10';
import { EmbedBuilder } from '@discordjs/builders';
import { GitHubService } from '@/services/github';

export default {
	data: {
		name: 'github',
		description: 'GitHub operations and configuration',
		options: [
			{
				name: 'config',
				type: ApplicationCommandOptionType.SubcommandGroup,
				description: 'Configure GitHub settings',
				options: [
					{
						name: 'set',
						type: ApplicationCommandOptionType.Subcommand,
						description: 'Set your GitHub preferences',
						options: [
							{
								name: 'token',
								type: ApplicationCommandOptionType.String,
								description: 'Your GitHub personal access token',
								required: false,
							},
							{
								name: 'default_repo',
								type: ApplicationCommandOptionType.String,
								description: 'Default repository (format: owner/repo)',
								required: false,
							},
						],
					},
					{
						name: 'get',
						type: ApplicationCommandOptionType.Subcommand,
						description: 'View your GitHub preferences',
					},
					{
						name: 'clear',
						type: ApplicationCommandOptionType.Subcommand,
						description: 'Clear your GitHub preferences',
						options: [
							{
								name: 'token',
								type: ApplicationCommandOptionType.Boolean,
								description: 'Clear your GitHub token',
								required: false,
							},
							{
								name: 'default_repo',
								type: ApplicationCommandOptionType.Boolean,
								description: 'Clear your default repository',
								required: false,
							},
						],
					},
				],
			},
		],
		integration_types: [IntegrationType.Guilds, IntegrationType.Users],
		contexts: [ContextType.Guild, ContextType.BotDM, ContextType.PrivateChannels],
	},
	async run(app, interaction, options) {
		const subcommandGroup = options.getSubcommandGroup();
		const subcommand = options.getSubcommand();

		if (subcommandGroup === 'config') {
			const githubService = new GitHubService(app.env);
			const userId = interaction.member?.user?.id || interaction.user?.id!;

			if (subcommand === 'set') {
				const token = options.getString('token');
				const defaultRepo = options.getString('default_repo');

				if (!token && !defaultRepo) {
					return app.editReply(interaction, {
						content: 'You must provide at least one option to set.',
					});
				}

				try {
					// Validate repository format if provided
					if (defaultRepo) {
						try {
							githubService.parseRepo(defaultRepo);
						} catch (error) {
							return app.editReply(interaction, {
								content: 'Invalid repository format. Use "owner/repo" format.',
							});
						}
					}

					// Validate token if provided
					if (token) {
						try {
							const octokit = await githubService.getOctokit(userId, token);
							await octokit.rest.users.getAuthenticated();
						} catch (error) {
							return app.editReply(interaction, {
								content: 'Invalid GitHub token. Please check your token and try again.',
							});
						}
					}

					await githubService.saveUserPreferences(userId, defaultRepo, token);

					const embed = new EmbedBuilder()
						.setTitle('✅ GitHub Configuration Updated')
						.setColor(0x00ff00)
						.setDescription('Your GitHub preferences have been successfully updated.')
						.setTimestamp();

					if (token) embed.addFields({ name: 'Token', value: '✓ Updated', inline: true });
					if (defaultRepo) embed.addFields({ name: 'Default Repository', value: defaultRepo, inline: true });

					return app.editReply(interaction, {
						embeds: [embed.toJSON()],
					});
				} catch (error) {
					console.error('Error saving GitHub preferences:', error);
					return app.editReply(interaction, {
						content: 'An error occurred while saving your preferences. Please try again.',
					});
				}
			}

			if (subcommand === 'get') {
				try {
					const preferences = await githubService.getUserPreferences(userId);

					const embed = new EmbedBuilder().setTitle('🔧 Your GitHub Configuration').setColor(0x0366d6).setTimestamp();

					if (preferences) {
						embed.addFields(
							{
								name: 'Default Repository',
								value: preferences.default_repo || 'Not set',
								inline: true,
							},
							{
								name: 'GitHub Token',
								value: preferences.github_token ? '✓ Configured' : 'Not set',
								inline: true,
							},
							{
								name: 'Last Updated',
								value: new Date(preferences.updated_at).toLocaleString(),
								inline: false,
							},
						);
					} else {
						embed.setDescription('No GitHub configuration found. Use `/github config set` to configure your preferences.');
					}

					return app.editReply(interaction, {
						embeds: [embed.toJSON()],
					});
				} catch (error) {
					console.error('Error fetching GitHub preferences:', error);
					return app.editReply(interaction, {
						content: 'An error occurred while fetching your preferences.',
					});
				}
			}

			if (subcommand === 'clear') {
				const clearToken = options.getBoolean('token');
				const clearRepo = options.getBoolean('default_repo');

				if (!clearToken && !clearRepo) {
					return app.editReply(interaction, {
						content: 'You must specify what to clear.',
					});
				}

				try {
					const preferences = await githubService.getUserPreferences(userId);
					if (!preferences) {
						return app.editReply(interaction, {
							content: 'No GitHub configuration found to clear.',
						});
					}

					const newToken = clearToken ? null : preferences.github_token;
					const newRepo = clearRepo ? null : preferences.default_repo;

					await githubService.saveUserPreferences(userId, newRepo, newToken);

					const embed = new EmbedBuilder()
						.setTitle('🗑️ GitHub Configuration Cleared')
						.setColor(0xff6b35)
						.setDescription('Selected preferences have been cleared.')
						.setTimestamp();

					if (clearToken) embed.addFields({ name: 'Token', value: '✓ Cleared', inline: true });
					if (clearRepo) embed.addFields({ name: 'Default Repository', value: '✓ Cleared', inline: true });

					return app.editReply(interaction, {
						embeds: [embed.toJSON()],
					});
				} catch (error) {
					console.error('Error clearing GitHub preferences:', error);
					return app.editReply(interaction, {
						content: 'An error occurred while clearing your preferences.',
					});
				}
			}
		}
	},
} as SlashCommand;
