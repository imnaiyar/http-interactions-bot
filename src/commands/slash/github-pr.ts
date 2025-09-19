import { ContextType, IntegrationType, type SlashCommand } from '@/structures';
import {
	APIApplicationCommandInteractionDataBasicOption,
	ApplicationCommandOptionType,
	InteractionType,
	MessageFlags,
} from 'discord-api-types/v10';
import { EmbedBuilder } from '@discordjs/builders';
import { GitHubService } from '@/services/github';

export default {
	data: {
		name: 'github-pr',
		description: 'Manage GitHub pull requests',
		options: [
			{
				name: 'get',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'Get information about a pull request',
				options: [
					{
						name: 'pr',
						type: ApplicationCommandOptionType.String,
						description: 'PR number or search term',
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
				description: 'List repository pull requests',
				options: [
					{
						name: 'state',
						type: ApplicationCommandOptionType.String,
						description: 'PR state',
						required: false,
						choices: [
							{ name: 'Open', value: 'open' },
							{ name: 'Closed', value: 'closed' },
							{ name: 'All', value: 'all' },
						],
					},
					{
						name: 'base',
						type: ApplicationCommandOptionType.String,
						description: 'Base branch',
						required: false,
					},
					{
						name: 'head',
						type: ApplicationCommandOptionType.String,
						description: 'Head branch',
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
				description: 'Create a new pull request',
				options: [
					{
						name: 'title',
						type: ApplicationCommandOptionType.String,
						description: 'PR title',
						required: true,
					},
					{
						name: 'head',
						type: ApplicationCommandOptionType.String,
						description: 'Head branch (source)',
						required: true,
					},
					{
						name: 'base',
						type: ApplicationCommandOptionType.String,
						description: 'Base branch (target)',
						required: true,
					},
					{
						name: 'body',
						type: ApplicationCommandOptionType.String,
						description: 'PR description',
						required: false,
					},
					{
						name: 'draft',
						type: ApplicationCommandOptionType.Boolean,
						description: 'Create as draft PR',
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
				name: 'merge',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'Merge a pull request',
				options: [
					{
						name: 'pr',
						type: ApplicationCommandOptionType.String,
						description: 'PR number',
						required: true,
						autocomplete: true,
					},
					{
						name: 'method',
						type: ApplicationCommandOptionType.String,
						description: 'Merge method',
						required: false,
						choices: [
							{ name: 'Merge', value: 'merge' },
							{ name: 'Squash', value: 'squash' },
							{ name: 'Rebase', value: 'rebase' },
						],
					},
					{
						name: 'commit_title',
						type: ApplicationCommandOptionType.String,
						description: 'Custom commit title',
						required: false,
					},
					{
						name: 'commit_message',
						type: ApplicationCommandOptionType.String,
						description: 'Custom commit message',
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
				description: 'Close a pull request',
				options: [
					{
						name: 'pr',
						type: ApplicationCommandOptionType.String,
						description: 'PR number',
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

		if (!focusedOption || focusedOption.name !== 'pr') {
			return { choices: [] };
		}

		const subcommand = options.getSubcommand();
		const repository = options.getString('repository');
		const token = options.getString('token');

		try {
			const octokit = await githubService.getOctokit(userId, token);
			const repoInfo = await githubService.getRepoInfo(userId, repository);

			let pullRequests;
			if (subcommand === 'merge' || subcommand === 'close') {
				// For merge/close commands, only show open PRs
				pullRequests = await githubService.searchPullRequests(octokit, repoInfo.owner, repoInfo.repo, 'is:open', 25);
			} else {
				// For other commands, search based on the input
				const searchQuery = focusedOption.value ? String(focusedOption.value) : '';
				pullRequests = await githubService.searchPullRequests(octokit, repoInfo.owner, repoInfo.repo, searchQuery, 25);
			}

			const choices = pullRequests
				.sort((a, b) => {
					if (a.state === 'open' && b.state === 'closed') return -1;
					if (a.state === 'closed' && b.state === 'open') return 1;
					// If same state, sort by issue number (descending - newest first)
					return b.number - a.number;
				})
				.map((pr) => ({
					name: `#${pr.number}: ${pr.title.slice(0, 80)}${pr.title.length > 80 ? '...' : ''}`,
					value: pr.number.toString(),
				}));

			return { choices: choices.slice(0, 25) };
		} catch (error) {
			console.error('Error in PR autocomplete:', error);
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
				const prInput = options.getString('pr', true);
				const prNumber = parseInt(prInput);

				if (isNaN(prNumber)) {
					return app.editReply(interaction, {
						content: 'Please provide a valid PR number.',
					});
				}

				const { data: pr } = await octokit.rest.pulls.get({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					pull_number: prNumber,
				});

				const embed = new EmbedBuilder()
					.setTitle(`Pull Request #${pr.number}: ${pr.title}`)
					.setURL(pr.html_url)
					.setColor(pr.state === 'open' ? 0x28a745 : pr.merged ? 0x6f42c1 : 0xda3633)
					.setDescription(pr.body ? (pr.body.length > 2000 ? pr.body.slice(0, 2000) + '...' : pr.body) : 'No description provided.')
					.addFields(
						{ name: 'State', value: pr.merged ? 'MERGED' : pr.state.toUpperCase(), inline: true },
						{ name: 'Author', value: pr.user?.login || 'Unknown', inline: true },
						{ name: 'Draft', value: pr.draft ? 'Yes' : 'No', inline: true },
						{ name: 'Base Branch', value: pr.base.ref, inline: true },
						{ name: 'Head Branch', value: pr.head.ref, inline: true },
						{ name: 'Commits', value: pr.commits.toString(), inline: true },
						{ name: 'Additions', value: `+${pr.additions}`, inline: true },
						{ name: 'Deletions', value: `-${pr.deletions}`, inline: true },
						{ name: 'Changed Files', value: pr.changed_files.toString(), inline: true },
						{ name: 'Created', value: new Date(pr.created_at).toLocaleString(), inline: false },
					);

				if (pr.merged_at) {
					embed.addFields({ name: 'Merged', value: new Date(pr.merged_at).toLocaleString(), inline: true });
				}

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}

			if (subcommand === 'list') {
				const state = options.getString('state') || 'open';
				const base = options.getString('base');
				const head = options.getString('head');

				const { data: prs } = await octokit.rest.pulls.list({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					state: state as 'open' | 'closed' | 'all',
					base: base || undefined,
					head: head || undefined,
					per_page: 10,
				});

				const embed = new EmbedBuilder()
					.setTitle(`🔀 Pull Requests in ${repoInfo.owner}/${repoInfo.repo}`)
					.setColor(0x0366d6)
					.setTimestamp();

				if (prs.length === 0) {
					embed.setDescription('No pull requests found matching the criteria.');
				} else {
					const prsList = prs
						.map((pr) => {
							const status = pr.merged_at ? '🟣 merged' : pr.state === 'open' ? '🟢 open' : '🔴 closed';
							const draft = pr.draft ? ' (draft)' : '';
							return `**#${pr.number}** [${pr.title}](${pr.html_url}) - ${status}${draft} by ${pr.user?.login}`;
						})
						.join('\n');

					embed.setDescription(prsList);
					embed.setFooter({ text: `Showing ${prs.length} pull requests` });
				}

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}

			if (subcommand === 'create') {
				const title = options.getString('title', true);
				const head = options.getString('head', true);
				const base = options.getString('base', true);
				const body = options.getString('body');
				const draft = options.getBoolean('draft') || false;

				const { data: pr } = await octokit.rest.pulls.create({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					title,
					head,
					base,
					body: body || undefined,
					draft,
				});

				const embed = new EmbedBuilder()
					.setTitle(`✅ Pull Request Created: #${pr.number}`)
					.setURL(pr.html_url)
					.setColor(0x28a745)
					.setDescription(`**${title}**\n\n${body || 'No description provided.'}`)
					.addFields(
						{ name: 'Repository', value: `${repoInfo.owner}/${repoInfo.repo}`, inline: true },
						{ name: 'PR Number', value: `#${pr.number}`, inline: true },
						{ name: 'Head → Base', value: `${head} → ${base}`, inline: true },
						{ name: 'Draft', value: draft ? 'Yes' : 'No', inline: true },
					)
					.setTimestamp();

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}

			if (subcommand === 'merge') {
				const prInput = options.getString('pr', true);
				const method = options.getString('method') || 'merge';
				const commitTitle = options.getString('commit_title');
				const commitMessage = options.getString('commit_message');
				const prNumber = parseInt(prInput);

				if (isNaN(prNumber)) {
					return app.editReply(interaction, {
						content: 'Please provide a valid PR number.',
					});
				}

				const { data: mergeResult } = await octokit.rest.pulls.merge({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					pull_number: prNumber,
					merge_method: method as 'merge' | 'squash' | 'rebase',
					commit_title: commitTitle || undefined,
					commit_message: commitMessage || undefined,
				});

				const embed = new EmbedBuilder()
					.setTitle(`🔀 Pull Request Merged: #${prNumber}`)
					.setColor(0x6f42c1)
					.addFields(
						{ name: 'Repository', value: `${repoInfo.owner}/${repoInfo.repo}`, inline: true },
						{ name: 'Merge Method', value: method.toUpperCase(), inline: true },
						{ name: 'Commit SHA', value: mergeResult.sha.slice(0, 7), inline: true },
					)
					.setTimestamp();

				if (mergeResult.merged) {
					embed.setDescription('✅ Pull request has been successfully merged!');
				} else {
					embed.setDescription('⚠️ Pull request merge completed with warnings.');
				}

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}

			if (subcommand === 'close') {
				const prInput = options.getString('pr', true);
				const prNumber = parseInt(prInput);

				if (isNaN(prNumber)) {
					return app.editReply(interaction, {
						content: 'Please provide a valid PR number.',
						flags: MessageFlags.Ephemeral,
					});
				}

				const { data: pr } = await octokit.rest.pulls.update({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					pull_number: prNumber,
					state: 'closed',
				});

				const embed = new EmbedBuilder()
					.setTitle(`🔒 Pull Request Closed: #${pr.number}`)
					.setURL(pr.html_url)
					.setColor(0xda3633)
					.setDescription(`**${pr.title}**`)
					.addFields(
						{ name: 'Repository', value: `${repoInfo.owner}/${repoInfo.repo}`, inline: true },
						{ name: 'Head → Base', value: `${pr.head.ref} → ${pr.base.ref}`, inline: true },
					)
					.setTimestamp();

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}
		} catch (error) {
			console.error('Error in GitHub PR command:', error);
			let errorMessage = 'An error occurred while processing your request.';

			if (error instanceof Error) {
				if (error.message.includes('token')) {
					errorMessage = 'GitHub token error. Please check your token with `/github config`.';
				} else if (error.message.includes('repository')) {
					errorMessage = 'Repository error. Please check the repository name or set a default with `/github config`.';
				} else if (error.message.includes('Not Found')) {
					errorMessage = 'Pull request not found or access denied.';
				} else if (error.message.includes('Validation Failed')) {
					errorMessage = 'Invalid branch names or pull request already exists.';
				}
			}

			return app.editReply(interaction, {
				content: `❌ ${errorMessage}`,
				flags: MessageFlags.Ephemeral,
			});
		}
	},
} as SlashCommand<true>;
