import { ContextType, IntegrationType, type SlashCommand } from '@/structures';
import {
	APIApplicationCommandInteractionDataBasicOption,
	ApplicationCommandOptionType,
	InteractionType,
	MessageFlags,
} from 'discord-api-types/v10';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder } from '@discordjs/builders';
import { GitHubService } from '@/services/github';

export default {
	data: {
		name: 'github-issues',
		description: 'Manage GitHub issues',
		options: [
			{
				name: 'get',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'Get information about an issue',
				options: [
					{
						name: 'issue',
						type: ApplicationCommandOptionType.String,
						description: 'Issue number or search term',
						required: true,
						autocomplete: true,
					},
					{
						name: 'repository',
						type: ApplicationCommandOptionType.String,
						description: 'Repository (owner/repo) - overrides default',
						required: false,
					},
					{
						name: 'token',
						type: ApplicationCommandOptionType.String,
						description: 'GitHub token - overrides saved token',
						required: false,
					},
				],
			},
			{
				name: 'list',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'List repository issues',
				options: [
					{
						name: 'state',
						type: ApplicationCommandOptionType.String,
						description: 'Issue state',
						required: false,
						choices: [
							{ name: 'Open', value: 'open' },
							{ name: 'Closed', value: 'closed' },
							{ name: 'All', value: 'all' },
						],
					},
					{
						name: 'labels',
						type: ApplicationCommandOptionType.String,
						description: 'Filter by labels (comma-separated)',
						required: false,
					},
					{
						name: 'assignee',
						type: ApplicationCommandOptionType.String,
						description: 'Filter by assignee username',
						required: false,
					},
					{
						name: 'repository',
						type: ApplicationCommandOptionType.String,
						description: 'Repository (owner/repo) - overrides default',
						required: false,
					},
					{
						name: 'token',
						type: ApplicationCommandOptionType.String,
						description: 'GitHub token - overrides saved token',
						required: false,
					},
				],
			},
			{
				name: 'create',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'Create a new issue',
				options: [
					{
						name: 'title',
						type: ApplicationCommandOptionType.String,
						description: 'Issue title',
						required: true,
					},
					{
						name: 'body',
						type: ApplicationCommandOptionType.String,
						description: 'Issue description',
						required: false,
					},
					{
						name: 'labels',
						type: ApplicationCommandOptionType.String,
						description: 'Labels (comma-separated)',
						required: false,
					},
					{
						name: 'assignees',
						type: ApplicationCommandOptionType.String,
						description: 'Assignees (comma-separated usernames)',
						required: false,
					},
					{
						name: 'repository',
						type: ApplicationCommandOptionType.String,
						description: 'Repository (owner/repo) - overrides default',
						required: false,
					},
					{
						name: 'token',
						type: ApplicationCommandOptionType.String,
						description: 'GitHub token - overrides saved token',
						required: false,
					},
				],
			},
			{
				name: 'close',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'Close an issue',
				options: [
					{
						name: 'issue',
						type: ApplicationCommandOptionType.String,
						description: 'Issue number',
						required: true,
						autocomplete: true,
					},
					{
						name: 'reason',
						type: ApplicationCommandOptionType.String,
						description: 'Reason for closing',
						required: false,
						choices: [
							{ name: 'Completed', value: 'completed' },
							{ name: 'Not planned', value: 'not_planned' },
						],
					},
					{
						name: 'comment',
						type: ApplicationCommandOptionType.String,
						description: 'Comment to add when closing the issue',
						required: false,
					},
					{
						name: 'repository',
						type: ApplicationCommandOptionType.String,
						description: 'Repository (owner/repo) - overrides default',
						required: false,
					},
					{
						name: 'token',
						type: ApplicationCommandOptionType.String,
						description: 'GitHub token - overrides saved token',
						required: false,
					},
				],
			},
		],
		integration_types: [IntegrationType.Guilds, IntegrationType.Users],
		contexts: [ContextType.Guild, ContextType.BotDM, ContextType.PrivateChannels],
	},

	async autocomplete(app, interaction, options) {
		const githubService = new GitHubService(app.env);
		const userId = interaction.member?.user?.id || interaction.user?.id;
		if (!userId) {
			return { choices: [] };
		}

		const focusedOption = options.getFocusedOption();

		if (!focusedOption || focusedOption.name !== 'issue') {
			return { choices: [] };
		}
		const subcommand = options.getSubcommand();
		const repository = options.getString('repository');
		const token = options.getString('token');

		try {
			const octokit = await githubService.getOctokit(userId, token);
			const repoInfo = await githubService.getRepoInfo(userId, repository);

			let issues;
			if (subcommand === 'close') {
				// For closing issues, only show open issues
				issues = await githubService.searchIssues(octokit, repoInfo.owner, repoInfo.repo, 'is:open', 25);
			} else {
				// For other commands, search based on the input
				const searchQuery = focusedOption.value ? String(focusedOption.value) : '';
				issues = await githubService.searchIssues(octokit, repoInfo.owner, repoInfo.repo, searchQuery, 25);
			}

			const choices = issues
				.sort((a, b) => {
					// Open issues first, then closed
					if (a.state === 'open' && b.state === 'closed') return -1;
					if (a.state === 'closed' && b.state === 'open') return 1;
					// If same state, sort by issue number (descending - newest first)
					return b.number - a.number;
				})
				.map((issue) => ({
					name: `#${issue.number}: ${issue.title.slice(0, 80)}${issue.title.length > 80 ? '...' : ''}`,
					value: issue.number.toString(),
				}));

			return { choices: choices.slice(0, 25) };
		} catch (error) {
			console.error('Error in issues autocomplete:', error);
			return { choices: [] };
		}
	},

	async run(app, interaction, options) {
		const githubService = new GitHubService(app.env);
		const userId = interaction.member?.user?.id || interaction.user?.id;

		if (!userId) {
			return app.editReply(interaction, {
				content: 'Unable to identify user.',
			});
		}

		const subcommand = options.getSubcommand();
		const repository = options.getString('repository');
		const token = options.getString('token');

		try {
			const octokit = await githubService.getOctokit(userId, token);
			const repoInfo = await githubService.getRepoInfo(userId, repository);

			// Validate repository access
			const hasAccess = await githubService.validateRepository(octokit, repoInfo.owner, repoInfo.repo);
			if (!hasAccess) {
				return app.editReply(interaction, {
					content: `❌ Repository \`${repoInfo.owner}/${repoInfo.repo}\` not found or access denied.`,
				});
			}

			if (subcommand === 'get') {
				const issueInput = options.getString('issue', true);
				const issueNumber = parseInt(issueInput);

				if (isNaN(issueNumber)) {
					return app.editReply(interaction, {
						content: 'Please provide a valid issue number.',
					});
				}

				const { data: issue } = await octokit.rest.issues.get({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					issue_number: issueNumber,
				});

				const embed = new EmbedBuilder()
					.setTitle(`Issue #${issue.number}: ${issue.title}`)
					.setURL(issue.html_url)
					.setColor(issue.state === 'open' ? 0x28a745 : 0x6f42c1)
					.setDescription(
						issue.body ? (issue.body.length > 2000 ? issue.body.slice(0, 2000) + '...' : issue.body) : 'No description provided.',
					)
					.addFields(
						{ name: 'State', value: issue.state.toUpperCase(), inline: true },
						{ name: 'Author', value: issue.user?.login || 'Unknown', inline: true },
						{ name: 'Created', value: new Date(issue.created_at).toLocaleString(), inline: true },
					);

				if (issue.labels && issue.labels.length > 0) {
					const labels = issue.labels.map((label) => (typeof label === 'string' ? label : label.name)).join(', ');
					embed.addFields({ name: 'Labels', value: labels, inline: false });
				}

				if (issue.assignees && issue.assignees.length > 0) {
					const assignees = issue.assignees
						.map((assignee) => assignee?.login)
						.filter(Boolean)
						.join(', ');
					embed.addFields({ name: 'Assignees', value: assignees, inline: false });
				}

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}

			if (subcommand === 'list') {
				const state = options.getString('state') || 'open';
				const labels = options.getString('labels');
				const assignee = options.getString('assignee');

				const { data: issues } = await octokit.rest.issues.listForRepo({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					state: state as 'open' | 'closed' | 'all',
					labels: labels ? labels : undefined,
					assignee: assignee || undefined,
					per_page: 10,
				});

				const embed = new EmbedBuilder().setTitle(`📋 Issues in ${repoInfo.owner}/${repoInfo.repo}`).setColor(0x0366d6).setTimestamp();

				if (issues.length === 0) {
					embed.setDescription('No issues found matching the criteria.');
				} else {
					const issuesList = issues
						.map((issue) => `**#${issue.number}** [${issue.title}](${issue.html_url}) - ${issue.state} by ${issue.user?.login}`)
						.join('\n');

					embed.setDescription(issuesList);
					embed.setFooter({ text: `Showing ${issues.length} issues` });
				}

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}

			if (subcommand === 'create') {
				const title = options.getString('title', true);
				const body = options.getString('body');
				const labels = options.getString('labels');
				const assignees = options.getString('assignees');

				const { data: issue } = await octokit.rest.issues.create({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					title,
					body: body || undefined,
					labels: labels ? labels.split(',').map((l) => l.trim()) : undefined,
					assignees: assignees ? assignees.split(',').map((a) => a.trim()) : undefined,
				});

				const embed = new EmbedBuilder()
					.setTitle(`✅ Issue Created: #${issue.number}`)
					.setURL(issue.html_url)
					.setColor(0x28a745)
					.setDescription(`**${title}**\n\n${body || 'No description provided.'}`)
					.addFields(
						{ name: 'Repository', value: `${repoInfo.owner}/${repoInfo.repo}`, inline: true },
						{ name: 'Issue Number', value: `#${issue.number}`, inline: true },
					)
					.setTimestamp();

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}

			if (subcommand === 'close') {
				const issueInput = options.getString('issue', true);
				const reason = options.getString('reason') as 'completed' | 'not_planned' | undefined;
				const comment = options.getString('comment');

				const issueNumber = parseInt(issueInput);

				if (isNaN(issueNumber)) {
					return app.editReply(interaction, {
						content: 'Please provide a valid issue number.',
						flags: MessageFlags.Ephemeral,
					});
				}

				// If a comment is provided, add it before closing
				if (comment) {
					await octokit.rest.issues.createComment({
						owner: repoInfo.owner,
						repo: repoInfo.repo,
						issue_number: issueNumber,
						body: comment,
					});
				}

				const { data: issue } = await octokit.rest.issues.update({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					issue_number: issueNumber,
					state: 'closed',
					state_reason: reason,
				});

				const embed = new EmbedBuilder()
					.setTitle(`🔒 Issue Closed: #${issue.number}`)
					.setURL(issue.html_url)
					.setColor(0x6f42c1)
					.setDescription(`**${issue.title}**`)
					.addFields(
						{ name: 'Repository', value: `${repoInfo.owner}/${repoInfo.repo}`, inline: true },
						{ name: 'Reason', value: reason || 'Not specified', inline: true },
					)
					.setTimestamp();

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}
		} catch (error) {
			console.error('Error in GitHub issues command:', error);
			let errorMessage = 'An error occurred while processing your request.';

			if (error instanceof Error) {
				if (error.message.includes('token')) {
					errorMessage = 'GitHub token error. Please check your token with `/github config`.';
				} else if (error.message.includes('repository')) {
					errorMessage = 'Repository error. Please check the repository name or set a default with `/github config`.';
				} else if (error.message.includes('Not Found')) {
					errorMessage = 'Issue not found or access denied.';
				}
			}

			return app.editReply(interaction, {
				content: `❌ ${errorMessage}`,
			});
		}
	},
} as SlashCommand<true>;
