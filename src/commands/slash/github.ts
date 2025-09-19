import { ContextType, IntegrationType, type SlashCommand } from '@/structures';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { EmbedBuilder } from '@discordjs/builders';
import { GitHubAPI, type GitHubConfig } from '@/services/github';

export default {
	data: {
		name: 'github',
		description: 'GitHub operations - manage issues, PRs, files, and workflows',
		options: [
			{
				name: 'issues',
				description: 'Manage GitHub issues',
				type: ApplicationCommandOptionType.SubcommandGroup,
				options: [
					{
						name: 'list',
						description: 'List issues in a repository',
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: 'state',
								description: 'Filter by issue state',
								type: ApplicationCommandOptionType.String,
								choices: [
									{ name: 'Open', value: 'open' },
									{ name: 'Closed', value: 'closed' },
									{ name: 'All', value: 'all' },
								],
								required: false,
							},
							{
								name: 'repo',
								description: 'Repository name (owner/repo)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
							{
								name: 'token',
								description: 'GitHub token (overrides default)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
						],
					},
					{
						name: 'get',
						description: 'Get a specific issue',
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: 'number',
								description: 'Issue number',
								type: ApplicationCommandOptionType.Integer,
								required: true,
							},
							{
								name: 'repo',
								description: 'Repository name (owner/repo)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
							{
								name: 'token',
								description: 'GitHub token (overrides default)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
						],
					},
					{
						name: 'create',
						description: 'Create a new issue',
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: 'title',
								description: 'Issue title',
								type: ApplicationCommandOptionType.String,
								required: true,
							},
							{
								name: 'body',
								description: 'Issue description',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
							{
								name: 'repo',
								description: 'Repository name (owner/repo)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
							{
								name: 'token',
								description: 'GitHub token (overrides default)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
						],
					},
					{
						name: 'close',
						description: 'Close an issue',
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: 'number',
								description: 'Issue number',
								type: ApplicationCommandOptionType.Integer,
								required: true,
							},
							{
								name: 'repo',
								description: 'Repository name (owner/repo)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
							{
								name: 'token',
								description: 'GitHub token (overrides default)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
						],
					},
				],
			},
			{
				name: 'prs',
				description: 'Manage GitHub pull requests',
				type: ApplicationCommandOptionType.SubcommandGroup,
				options: [
					{
						name: 'list',
						description: 'List pull requests in a repository',
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: 'state',
								description: 'Filter by PR state',
								type: ApplicationCommandOptionType.String,
								choices: [
									{ name: 'Open', value: 'open' },
									{ name: 'Closed', value: 'closed' },
									{ name: 'All', value: 'all' },
								],
								required: false,
							},
							{
								name: 'repo',
								description: 'Repository name (owner/repo)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
							{
								name: 'token',
								description: 'GitHub token (overrides default)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
						],
					},
					{
						name: 'get',
						description: 'Get a specific pull request',
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: 'number',
								description: 'Pull request number',
								type: ApplicationCommandOptionType.Integer,
								required: true,
							},
							{
								name: 'repo',
								description: 'Repository name (owner/repo)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
							{
								name: 'token',
								description: 'GitHub token (overrides default)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
						],
					},
				],
			},
			{
				name: 'files',
				description: 'Manage GitHub files',
				type: ApplicationCommandOptionType.SubcommandGroup,
				options: [
					{
						name: 'list',
						description: 'List files in a directory',
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: 'path',
								description: 'Path to list (default: root)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
							{
								name: 'repo',
								description: 'Repository name (owner/repo)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
							{
								name: 'ref',
								description: 'Branch/tag/commit reference',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
							{
								name: 'token',
								description: 'GitHub token (overrides default)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
						],
					},
					{
						name: 'content',
						description: 'Get file content',
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: 'path',
								description: 'File path',
								type: ApplicationCommandOptionType.String,
								required: true,
							},
							{
								name: 'repo',
								description: 'Repository name (owner/repo)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
							{
								name: 'ref',
								description: 'Branch/tag/commit reference',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
							{
								name: 'token',
								description: 'GitHub token (overrides default)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
						],
					},
				],
			},
			{
				name: 'workflows',
				description: 'Manage GitHub Actions workflows',
				type: ApplicationCommandOptionType.SubcommandGroup,
				options: [
					{
						name: 'list',
						description: 'List workflows in a repository',
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: 'repo',
								description: 'Repository name (owner/repo)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
							{
								name: 'token',
								description: 'GitHub token (overrides default)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
						],
					},
					{
						name: 'runs',
						description: 'List workflow runs',
						type: ApplicationCommandOptionType.Subcommand,
						options: [
							{
								name: 'workflow',
								description: 'Workflow ID or filename',
								type: ApplicationCommandOptionType.String,
								required: true,
							},
							{
								name: 'repo',
								description: 'Repository name (owner/repo)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
							{
								name: 'status',
								description: 'Filter by status',
								type: ApplicationCommandOptionType.String,
								choices: [
									{ name: 'Queued', value: 'queued' },
									{ name: 'In Progress', value: 'in_progress' },
									{ name: 'Completed', value: 'completed' },
								],
								required: false,
							},
							{
								name: 'token',
								description: 'GitHub token (overrides default)',
								type: ApplicationCommandOptionType.String,
								required: false,
							},
						],
					},
				],
			},
		],
		integration_types: [IntegrationType.Users],
		contexts: [ContextType.BotDM, ContextType.Guild, ContextType.PrivateChannels],
	},
	async run(app, interaction, options) {
		const github = new GitHubAPI(app.env);
		const subcommandGroup = options.getSubcommandGroup();
		const subcommand = options.getSubcommand();

		// Parse repo parameter
		function parseRepoConfig(repoParam?: string | null, token?: string | null): GitHubConfig {
			const config: GitHubConfig = {};
			
			if (token) {
				config.token = token;
			}
			
			if (repoParam) {
				const parts = repoParam.split('/');
				if (parts.length === 2) {
					config.owner = parts[0];
					config.repo = parts[1];
				}
			}
			
			return config;
		}

		try {
			switch (subcommandGroup) {
				case 'issues': {
					const repoParam = options.getString('repo');
					const token = options.getString('token');
					const config = parseRepoConfig(repoParam, token);

					switch (subcommand) {
						case 'list': {
							const state = options.getString('state') as 'open' | 'closed' | 'all' || 'open';
							const issues = await github.listIssues(config, { state });

							const embed = new EmbedBuilder()
								.setTitle(`📋 Issues (${state})`)
								.setColor(0x238636)
								.setDescription(
									issues.length === 0
										? 'No issues found.'
										: issues
												.slice(0, 10)
												.map((issue) => `**#${issue.number}** ${issue.title} - *${issue.state}*`)
												.join('\n')
								)
								.setFooter({ text: `Showing ${Math.min(issues.length, 10)} of ${issues.length} issues` });

							await app.editReply(interaction, { embeds: [embed.toJSON() as any] });
							break;
						}
						case 'get': {
							const number = options.getInteger('number')!;
							const issue = await github.getIssue(config, number);

							const embed = new EmbedBuilder()
								.setTitle(`📋 Issue #${issue.number}: ${issue.title}`)
								.setURL(issue.html_url)
								.setColor(issue.state === 'open' ? 0x238636 : 0x8b5cf6)
								.setDescription(issue.body?.slice(0, 1000) || 'No description')
								.addFields([
									{ name: 'State', value: issue.state, inline: true },
									{ name: 'Author', value: issue.user.login, inline: true },
									{ name: 'Created', value: new Date(issue.created_at).toLocaleString(), inline: true },
								])
								.setThumbnail(issue.user.avatar_url);

							await app.editReply(interaction, { embeds: [embed.toJSON() as any] });
							break;
						}
						case 'create': {
							const title = options.getString('title')!;
							const body = options.getString('body');
							
							const issue = await github.createIssue(config, { title, body });

							const embed = new EmbedBuilder()
								.setTitle(`✅ Issue Created: #${issue.number}`)
								.setURL(issue.html_url)
								.setColor(0x238636)
								.setDescription(`**${issue.title}**\n\n${issue.body?.slice(0, 1000) || 'No description'}`);

							await app.editReply(interaction, { embeds: [embed.toJSON() as any] });
							break;
						}
						case 'close': {
							const number = options.getInteger('number')!;
							await github.updateIssue(config, number, { state: 'closed' });

							const embed = new EmbedBuilder()
								.setTitle(`✅ Issue #${number} Closed`)
								.setColor(0x8b5cf6)
								.setDescription(`Successfully closed issue #${number}`);

							await app.editReply(interaction, { embeds: [embed.toJSON() as any] });
							break;
						}
					}
					break;
				}

				case 'prs': {
					const repoParam = options.getString('repo');
					const token = options.getString('token');
					const config = parseRepoConfig(repoParam, token);

					switch (subcommand) {
						case 'list': {
							const state = options.getString('state') as 'open' | 'closed' | 'all' || 'open';
							const prs = await github.listPullRequests(config, { state });

							const embed = new EmbedBuilder()
								.setTitle(`🔀 Pull Requests (${state})`)
								.setColor(0x238636)
								.setDescription(
									prs.length === 0
										? 'No pull requests found.'
										: prs
												.slice(0, 10)
												.map((pr) => `**#${pr.number}** ${pr.title} - *${pr.state}*`)
												.join('\n')
								)
								.setFooter({ text: `Showing ${Math.min(prs.length, 10)} of ${prs.length} pull requests` });

							await app.editReply(interaction, { embeds: [embed.toJSON() as any] });
							break;
						}
						case 'get': {
							const number = options.getInteger('number')!;
							const pr = await github.getPullRequest(config, number);

							const embed = new EmbedBuilder()
								.setTitle(`🔀 PR #${pr.number}: ${pr.title}`)
								.setURL(pr.html_url)
								.setColor(pr.state === 'open' ? 0x238636 : pr.merged ? 0x8b5cf6 : 0xda3633)
								.setDescription(pr.body?.slice(0, 1000) || 'No description')
								.addFields([
									{ name: 'State', value: pr.state, inline: true },
									{ name: 'Author', value: pr.user.login, inline: true },
									{ name: 'Merged', value: pr.merged ? 'Yes' : 'No', inline: true },
									{ name: 'Head', value: pr.head.ref, inline: true },
									{ name: 'Base', value: pr.base.ref, inline: true },
									{ name: 'Created', value: new Date(pr.created_at).toLocaleString(), inline: true },
								])
								.setThumbnail(pr.user.avatar_url);

							await app.editReply(interaction, { embeds: [embed.toJSON() as any] });
							break;
						}
					}
					break;
				}

				case 'files': {
					const repoParam = options.getString('repo');
					const token = options.getString('token');
					const ref = options.getString('ref');
					const config = parseRepoConfig(repoParam, token);

					switch (subcommand) {
						case 'list': {
							const path = options.getString('path') || '';
							const files = await github.getContents(config, path, ref || undefined);

							const embed = new EmbedBuilder()
								.setTitle(`📁 Files${path ? ` in /${path}` : ''}`)
								.setColor(0x0969da)
								.setDescription(
									files.length === 0
										? 'No files found.'
										: files
												.slice(0, 20)
												.map((file) => `${file.type === 'dir' ? '📁' : '📄'} ${file.name}`)
												.join('\n')
								)
								.setFooter({ text: `Showing ${Math.min(files.length, 20)} of ${files.length} items` });

							await app.editReply(interaction, { embeds: [embed.toJSON() as any] });
							break;
						}
						case 'content': {
							const path = options.getString('path')!;
							const fileContent = await github.getFileContent(config, path, ref || undefined);

							// Truncate content if too long
							const content = fileContent.content.length > 1900 
								? fileContent.content.slice(0, 1900) + '...'
								: fileContent.content;

							const embed = new EmbedBuilder()
								.setTitle(`📄 ${path}`)
								.setColor(0x0969da)
								.setDescription(`\`\`\`\n${content}\n\`\`\``)
								.addFields([
									{ name: 'Encoding', value: fileContent.encoding, inline: true },
									{ name: 'SHA', value: fileContent.sha.slice(0, 8), inline: true },
								]);

							await app.editReply(interaction, { embeds: [embed.toJSON() as any] });
							break;
						}
					}
					break;
				}

				case 'workflows': {
					const repoParam = options.getString('repo');
					const token = options.getString('token');
					const config = parseRepoConfig(repoParam, token);

					switch (subcommand) {
						case 'list': {
							const result = await github.listWorkflows(config);

							const embed = new EmbedBuilder()
								.setTitle(`⚙️ Workflows`)
								.setColor(0xf78166)
								.setDescription(
									result.workflows.length === 0
										? 'No workflows found.'
										: result.workflows
												.slice(0, 15)
												.map((workflow) => `**${workflow.name}** - *${workflow.state}*`)
												.join('\n')
								)
								.setFooter({ text: `Showing ${Math.min(result.workflows.length, 15)} of ${result.workflows.length} workflows` });

							await app.editReply(interaction, { embeds: [embed.toJSON() as any] });
							break;
						}
						case 'runs': {
							const workflowId = options.getString('workflow')!;
							const status = options.getString('status');
							
							const result = await github.listWorkflowRuns(config, workflowId, { 
								status: status || undefined 
							});

							const embed = new EmbedBuilder()
								.setTitle(`🏃 Workflow Runs`)
								.setColor(0xf78166)
								.setDescription(
									result.workflow_runs.length === 0
										? 'No workflow runs found.'
										: result.workflow_runs
												.slice(0, 10)
												.map((run) => `**${run.name}** - *${run.status}* (${run.conclusion || 'pending'})`)
												.join('\n')
								)
								.setFooter({ text: `Showing ${Math.min(result.workflow_runs.length, 10)} of ${result.workflow_runs.length} runs` });

							await app.editReply(interaction, { embeds: [embed.toJSON() as any] });
							break;
						}
					}
					break;
				}
			}
		} catch (error) {
			console.error('GitHub API error:', error);
			
			const embed = new EmbedBuilder()
				.setTitle('❌ Error')
				.setColor(0xda3633)
				.setDescription(`Failed to execute GitHub operation: ${error instanceof Error ? error.message : 'Unknown error'}`);

			await app.editReply(interaction, { embeds: [embed.toJSON() as any] });
		}
	},
} satisfies SlashCommand;