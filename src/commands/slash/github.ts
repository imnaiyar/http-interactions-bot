import { EmbedBuilder } from '@discordjs/builders';
import { type SlashCommand } from '@/structures';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import type { GitHubIssue } from '@/services/github';

function formatIssueEmbed(issue: GitHubIssue, owner: string, repo: string): EmbedBuilder {
	const embed = new EmbedBuilder()
		.setTitle(`#${issue.number}: ${issue.title}`)
		.setURL(issue.html_url)
		.setDescription(issue.body ? (issue.body.length > 300 ? issue.body.substring(0, 300) + '...' : issue.body) : 'No description')
		.setColor(issue.state === 'open' ? 0x238636 : 0x8b5cf6)
		.addFields(
			{
				name: 'Repository',
				value: `${owner}/${repo}`,
				inline: true,
			},
			{
				name: 'State',
				value: issue.state === 'open' ? '🟢 Open' : '🟣 Closed',
				inline: true,
			},
			{
				name: 'Author',
				value: issue.user.login,
				inline: true,
			}
		)
		.setTimestamp(new Date(issue.created_at));

	if (issue.labels.length > 0) {
		embed.addFields({
			name: 'Labels',
			value: issue.labels.map(label => `\`${label.name}\``).join(', '),
			inline: false,
		});
	}

	if (issue.assignees.length > 0) {
		embed.addFields({
			name: 'Assignees',
			value: issue.assignees.map(assignee => assignee.login).join(', '),
			inline: false,
		});
	}

	if (issue.milestone) {
		embed.addFields({
			name: 'Milestone',
			value: issue.milestone.title,
			inline: true,
		});
	}

	return embed;
}

function formatIssuesListEmbed(issues: GitHubIssue[], owner: string, repo: string, state: string): EmbedBuilder {
	const embed = new EmbedBuilder()
		.setTitle(`${owner}/${repo} Issues (${state})`)
		.setColor(0x238636)
		.setTimestamp();

	if (issues.length === 0) {
		embed.setDescription('No issues found.');
		return embed;
	}

	const description = issues
		.slice(0, 10) // Limit to 10 issues to avoid embed limits
		.map(issue => {
			const stateIcon = issue.state === 'open' ? '🟢' : '🟣';
			const title = issue.title.length > 50 ? issue.title.substring(0, 50) + '...' : issue.title;
			return `${stateIcon} [#${issue.number}](${issue.html_url}) ${title}`;
		})
		.join('\n');

	embed.setDescription(description);

	if (issues.length > 10) {
		embed.setFooter({ text: `Showing 10 of ${issues.length} issues` });
	}

	return embed;
}

export default {
	async run(app, interaction, options) {
		const subcommand = options.getSubcommand();
		
		try {
			switch (subcommand) {
				case 'list': {
					const owner = options.getString('owner', false);
					const repo = options.getString('repo', false);
					const state = options.getString('state', false) as 'open' | 'closed' | 'all' || 'open';
					const limit = options.getInteger('limit', false) || 10;

					const issues = await app.github.listIssues(owner || undefined, repo || undefined, state, Math.min(limit, 25));
					const { owner: defaultOwner, repo: defaultRepo } = app.github.getDefaultRepo();
					const actualOwner = owner || defaultOwner;
					const actualRepo = repo || defaultRepo;

					const embed = formatIssuesListEmbed(issues, actualOwner, actualRepo, state);

					await app.editReply(interaction, {
						embeds: [embed.toJSON() as any],
					});
					break;
				}

				case 'get': {
					const issueNumber = options.getInteger('number', true);
					const owner = options.getString('owner', false);
					const repo = options.getString('repo', false);

					const issue = await app.github.getIssue(issueNumber, owner || undefined, repo || undefined);
					const { owner: defaultOwner, repo: defaultRepo } = app.github.getDefaultRepo();
					const actualOwner = owner || defaultOwner;
					const actualRepo = repo || defaultRepo;

					const embed = formatIssueEmbed(issue, actualOwner, actualRepo);

					await app.editReply(interaction, {
						embeds: [embed.toJSON() as any],
					});
					break;
				}

				case 'create': {
					const title = options.getString('title', true);
					const body = options.getString('body', false);
					const owner = options.getString('owner', false);
					const repo = options.getString('repo', false);
					const labels = options.getString('labels', false);
					const assignees = options.getString('assignees', false);

					const createData: any = { title };
					if (body) createData.body = body;
					if (labels) createData.labels = labels.split(',').map(l => l.trim());
					if (assignees) createData.assignees = assignees.split(',').map(a => a.trim());

					const issue = await app.github.createIssue(createData, owner || undefined, repo || undefined);
					const { owner: defaultOwner, repo: defaultRepo } = app.github.getDefaultRepo();
					const actualOwner = owner || defaultOwner;
					const actualRepo = repo || defaultRepo;

					const embed = new EmbedBuilder()
						.setTitle('✅ Issue Created Successfully')
						.setDescription(`Created issue [#${issue.number}: ${issue.title}](${issue.html_url})`)
						.setColor(0x238636)
						.addFields(
							{
								name: 'Repository',
								value: `${actualOwner}/${actualRepo}`,
								inline: true,
							},
							{
								name: 'Issue Number',
								value: `#${issue.number}`,
								inline: true,
							}
						)
						.setTimestamp();

					await app.editReply(interaction, {
						embeds: [embed.toJSON() as any],
					});
					break;
				}

				case 'edit': {
					const issueNumber = options.getInteger('number', true);
					const title = options.getString('title', false);
					const body = options.getString('body', false);
					const state = options.getString('state', false) as 'open' | 'closed' | null;
					const owner = options.getString('owner', false);
					const repo = options.getString('repo', false);
					const labels = options.getString('labels', false);
					const assignees = options.getString('assignees', false);

					const editData: any = {};
					if (title) editData.title = title;
					if (body !== null) editData.body = body; // Allow empty string to clear body
					if (state) editData.state = state;
					if (labels) editData.labels = labels.split(',').map(l => l.trim());
					if (assignees) editData.assignees = assignees.split(',').map(a => a.trim());

					if (Object.keys(editData).length === 0) {
						await app.editReply(interaction, {
							content: '❌ No changes specified. Please provide at least one field to update.',
						});
						return;
					}

					const issue = await app.github.editIssue(issueNumber, editData, owner || undefined, repo || undefined);
					const { owner: defaultOwner, repo: defaultRepo } = app.github.getDefaultRepo();
					const actualOwner = owner || defaultOwner;
					const actualRepo = repo || defaultRepo;

					const embed = new EmbedBuilder()
						.setTitle('✅ Issue Updated Successfully')
						.setDescription(`Updated issue [#${issue.number}: ${issue.title}](${issue.html_url})`)
						.setColor(0x238636)
						.addFields(
							{
								name: 'Repository',
								value: `${actualOwner}/${actualRepo}`,
								inline: true,
							},
							{
								name: 'State',
								value: issue.state === 'open' ? '🟢 Open' : '🟣 Closed',
								inline: true,
							}
						)
						.setTimestamp();

					await app.editReply(interaction, {
						embeds: [embed.toJSON() as any],
					});
					break;
				}

				case 'close': {
					const issueNumber = options.getInteger('number', true);
					const owner = options.getString('owner', false);
					const repo = options.getString('repo', false);

					const issue = await app.github.closeIssue(issueNumber, owner || undefined, repo || undefined);
					const { owner: defaultOwner, repo: defaultRepo } = app.github.getDefaultRepo();
					const actualOwner = owner || defaultOwner;
					const actualRepo = repo || defaultRepo;

					const embed = new EmbedBuilder()
						.setTitle('✅ Issue Closed Successfully')
						.setDescription(`Closed issue [#${issue.number}: ${issue.title}](${issue.html_url})`)
						.setColor(0x8b5cf6)
						.addFields(
							{
								name: 'Repository',
								value: `${actualOwner}/${actualRepo}`,
								inline: true,
							},
							{
								name: 'State',
								value: '🟣 Closed',
								inline: true,
							}
						)
						.setTimestamp();

					await app.editReply(interaction, {
						embeds: [embed.toJSON() as any],
					});
					break;
				}

				default:
					await app.editReply(interaction, {
						content: '❌ Unknown subcommand.',
					});
			}
		} catch (error) {
			console.error('GitHub command error:', error);
			
			let errorMessage = 'An error occurred while executing the GitHub command.';
			if (error instanceof Error) {
				errorMessage = error.message;
			}

			await app.editReply(interaction, {
				content: `❌ ${errorMessage}`,
			});
		}
	},
	data: {
		name: 'github',
		description: 'Manage GitHub issues',
		options: [
			{
				name: 'list',
				description: 'List issues from a repository',
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: 'state',
						description: 'Issue state to filter by',
						type: ApplicationCommandOptionType.String,
						choices: [
							{ name: 'Open', value: 'open' },
							{ name: 'Closed', value: 'closed' },
							{ name: 'All', value: 'all' },
						],
						required: false,
					},
					{
						name: 'limit',
						description: 'Number of issues to return (max 25)',
						type: ApplicationCommandOptionType.Integer,
						min_value: 1,
						max_value: 25,
						required: false,
					},
					{
						name: 'owner',
						description: 'Repository owner (overrides default)',
						type: ApplicationCommandOptionType.String,
						required: false,
					},
					{
						name: 'repo',
						description: 'Repository name (overrides default)',
						type: ApplicationCommandOptionType.String,
						required: false,
					},
				],
			},
			{
				name: 'get',
				description: 'Get details of a specific issue',
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: 'number',
						description: 'Issue number',
						type: ApplicationCommandOptionType.Integer,
						min_value: 1,
						required: true,
					},
					{
						name: 'owner',
						description: 'Repository owner (overrides default)',
						type: ApplicationCommandOptionType.String,
						required: false,
					},
					{
						name: 'repo',
						description: 'Repository name (overrides default)',
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
						name: 'labels',
						description: 'Comma-separated list of labels',
						type: ApplicationCommandOptionType.String,
						required: false,
					},
					{
						name: 'assignees',
						description: 'Comma-separated list of assignees',
						type: ApplicationCommandOptionType.String,
						required: false,
					},
					{
						name: 'owner',
						description: 'Repository owner (overrides default)',
						type: ApplicationCommandOptionType.String,
						required: false,
					},
					{
						name: 'repo',
						description: 'Repository name (overrides default)',
						type: ApplicationCommandOptionType.String,
						required: false,
					},
				],
			},
			{
				name: 'edit',
				description: 'Edit an existing issue',
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: 'number',
						description: 'Issue number',
						type: ApplicationCommandOptionType.Integer,
						min_value: 1,
						required: true,
					},
					{
						name: 'title',
						description: 'New issue title',
						type: ApplicationCommandOptionType.String,
						required: false,
					},
					{
						name: 'body',
						description: 'New issue description',
						type: ApplicationCommandOptionType.String,
						required: false,
					},
					{
						name: 'state',
						description: 'New issue state',
						type: ApplicationCommandOptionType.String,
						choices: [
							{ name: 'Open', value: 'open' },
							{ name: 'Closed', value: 'closed' },
						],
						required: false,
					},
					{
						name: 'labels',
						description: 'Comma-separated list of labels',
						type: ApplicationCommandOptionType.String,
						required: false,
					},
					{
						name: 'assignees',
						description: 'Comma-separated list of assignees',
						type: ApplicationCommandOptionType.String,
						required: false,
					},
					{
						name: 'owner',
						description: 'Repository owner (overrides default)',
						type: ApplicationCommandOptionType.String,
						required: false,
					},
					{
						name: 'repo',
						description: 'Repository name (overrides default)',
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
						description: 'Issue number to close',
						type: ApplicationCommandOptionType.Integer,
						min_value: 1,
						required: true,
					},
					{
						name: 'owner',
						description: 'Repository owner (overrides default)',
						type: ApplicationCommandOptionType.String,
						required: false,
					},
					{
						name: 'repo',
						description: 'Repository name (overrides default)',
						type: ApplicationCommandOptionType.String,
						required: false,
					},
				],
			},
		],
		integration_types: [1],
		contexts: [0, 1, 2],
	},
} satisfies SlashCommand;