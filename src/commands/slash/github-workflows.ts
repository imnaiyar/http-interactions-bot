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
		name: 'github-workflows',
		description: 'Manage GitHub Actions workflows',
		options: [
			{
				name: 'list',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'List repository workflows',
				options: [
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
				name: 'runs',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'Get workflow runs',
				options: [
					{
						name: 'workflow',
						type: ApplicationCommandOptionType.String,
						description: 'Workflow ID or name',
						required: true,
						autocomplete: true,
					},
					{
						name: 'status',
						type: ApplicationCommandOptionType.String,
						description: 'Filter by run status',
						required: false,
						choices: [
							{ name: 'All', value: 'all' },
							{ name: 'Completed', value: 'completed' },
							{ name: 'Action Required', value: 'action_required' },
							{ name: 'Cancelled', value: 'cancelled' },
							{ name: 'Failure', value: 'failure' },
							{ name: 'Neutral', value: 'neutral' },
							{ name: 'Skipped', value: 'skipped' },
							{ name: 'Stale', value: 'stale' },
							{ name: 'Success', value: 'success' },
							{ name: 'Timed Out', value: 'timed_out' },
							{ name: 'In Progress', value: 'in_progress' },
							{ name: 'Queued', value: 'queued' },
							{ name: 'Requested', value: 'requested' },
							{ name: 'Waiting', value: 'waiting' },
							{ name: 'Pending', value: 'pending' },
						],
					},
					{
						name: 'branch',
						type: ApplicationCommandOptionType.String,
						description: 'Filter by branch',
						required: false,
					},
					{
						name: 'limit',
						type: ApplicationCommandOptionType.Integer,
						description: 'Number of runs to show (1-30)',
						required: false,
						min_value: 1,
						max_value: 30,
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
				name: 'trigger',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'Trigger a workflow run',
				options: [
					{
						name: 'workflow',
						type: ApplicationCommandOptionType.String,
						description: 'Workflow ID or filename',
						required: true,
						autocomplete: true,
					},
					{
						name: 'ref',
						type: ApplicationCommandOptionType.String,
						description: 'Branch or tag to run the workflow on',
						required: true,
					},
					{
						name: 'inputs',
						type: ApplicationCommandOptionType.String,
						description: 'Workflow inputs as JSON (optional)',
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
				name: 'cancel',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'Cancel a workflow run',
				options: [
					{
						name: 'run_id',
						type: ApplicationCommandOptionType.String,
						description: 'Workflow run ID',
						required: true,
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

		if (!focusedOption || focusedOption.name !== 'workflow') {
			return { choices: [] };
		}

		const repository = options.getString('repository');
		const token = options.getString('token');

		try {
			const octokit = await githubService.getOctokit(userId, token);
			const repoInfo = await githubService.getRepoInfo(userId, repository);

			const workflows = await githubService.getWorkflows(octokit, repoInfo.owner, repoInfo.repo);

			const searchTerm = focusedOption.value ? String(focusedOption.value).toLowerCase() : '';

			const choices = workflows
				.filter((workflow) => workflow.name.toLowerCase().includes(searchTerm) || workflow.path.toLowerCase().includes(searchTerm))
				.map((workflow) => ({
					name: `${workflow.name} (${workflow.path})`,
					value: workflow.id.toString(),
				}))
				.slice(0, 25);

			return { choices };
		} catch (error) {
			console.error('Error in workflows autocomplete:', error);
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

			if (subcommand === 'list') {
				const workflows = await githubService.getWorkflows(octokit, repoInfo.owner, repoInfo.repo);

				const embed = new EmbedBuilder().setTitle(`⚙️ Workflows in ${repoInfo.owner}/${repoInfo.repo}`).setColor(0x0366d6).setTimestamp();

				if (workflows.length === 0) {
					embed.setDescription('No workflows found in this repository.');
				} else {
					const workflowsList = workflows
						.map((workflow) => {
							const state = workflow.state === 'active' ? '🟢' : '🔴';
							return `${state} **${workflow.name}**\n` + `   📄 \`${workflow.path}\`\n` + `   🆔 ID: ${workflow.id}`;
						})
						.join('\n\n');

					embed.setDescription(workflowsList);
					embed.setFooter({ text: `${workflows.length} workflow(s) found` });
				}

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}

			if (subcommand === 'runs') {
				const workflowId = options.getString('workflow', true);
				const status = options.getString('status');
				const branch = options.getString('branch');
				const limit = options.getInteger('limit') || 10;

				let parsedWorkflowId: string | number = workflowId;
				if (!isNaN(Number(workflowId))) {
					parsedWorkflowId = Number(workflowId);
				}

				const runs = await githubService.getWorkflowRuns(octokit, repoInfo.owner, repoInfo.repo, parsedWorkflowId, limit);

				let filteredRuns = runs;
				if (status && status !== 'all') {
					filteredRuns = runs.filter((run) => run.status === status || run.conclusion === status);
				}
				if (branch) {
					filteredRuns = filteredRuns.filter((run) => run.head_branch === branch);
				}

				const embed = new EmbedBuilder().setTitle(`🔄 Workflow Runs`).setColor(0x0366d6).setTimestamp();

				if (filteredRuns.length === 0) {
					embed.setDescription('No workflow runs found matching the criteria.');
				} else {
					const runsList = filteredRuns
						.slice(0, limit)
						.map((run) => {
							let statusIcon = '⚪';
							if (run.conclusion === 'success') statusIcon = '✅';
							else if (run.conclusion === 'failure') statusIcon = '❌';
							else if (run.conclusion === 'cancelled') statusIcon = '🚫';
							else if (run.status === 'in_progress') statusIcon = '🔄';
							else if (run.status === 'queued') statusIcon = '⏳';

							return (
								`${statusIcon} **Run #${run.run_number}** [${run.display_title}](${run.html_url})\n` +
								`   📅 ${new Date(run.created_at).toLocaleString()}\n` +
								`   🌿 ${run.head_branch} • 👤 ${run.triggering_actor?.login}\n` +
								`   ⏱️ ${run.status} ${run.conclusion ? `• ${run.conclusion}` : ''}`
							);
						})
						.join('\n\n');

					embed.setDescription(runsList);
					embed.setFooter({ text: `Showing ${Math.min(filteredRuns.length, limit)} of ${filteredRuns.length} runs` });
				}

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}

			if (subcommand === 'trigger') {
				const workflowId = options.getString('workflow', true);
				const ref = options.getString('ref', true);
				const inputsString = options.getString('inputs');

				let inputs: Record<string, any> = {};
				if (inputsString) {
					try {
						inputs = JSON.parse(inputsString);
					} catch (error) {
						return app.editReply(interaction, {
							content: '❌ Invalid JSON format for inputs.',
						});
					}
				}

				let parsedWorkflowId: string | number = workflowId;
				if (!isNaN(Number(workflowId))) {
					parsedWorkflowId = Number(workflowId);
				}

				await octokit.rest.actions.createWorkflowDispatch({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					workflow_id: parsedWorkflowId,
					ref,
					inputs: Object.keys(inputs).length > 0 ? inputs : undefined,
				});

				const embed = new EmbedBuilder()
					.setTitle('🚀 Workflow Triggered')
					.setColor(0x28a745)
					.addFields(
						{ name: 'Repository', value: `${repoInfo.owner}/${repoInfo.repo}`, inline: true },
						{ name: 'Workflow', value: workflowId, inline: true },
						{ name: 'Branch/Tag', value: ref, inline: true },
					)
					.setDescription('Workflow dispatch request has been sent successfully!')
					.setTimestamp();

				if (Object.keys(inputs).length > 0) {
					embed.addFields({
						name: 'Inputs',
						value: `\`\`\`json\n${JSON.stringify(inputs, null, 2)}\n\`\`\``,
						inline: false,
					});
				}

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}

			if (subcommand === 'cancel') {
				const runId = options.getString('run_id', true);
				const runIdNumber = parseInt(runId);

				if (isNaN(runIdNumber)) {
					return app.editReply(interaction, {
						content: 'Please provide a valid run ID number.',
					});
				}

				await octokit.rest.actions.cancelWorkflowRun({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					run_id: runIdNumber,
				});

				const embed = new EmbedBuilder()
					.setTitle('🛑 Workflow Run Cancelled')
					.setColor(0xffa500)
					.addFields(
						{ name: 'Repository', value: `${repoInfo.owner}/${repoInfo.repo}`, inline: true },
						{ name: 'Run ID', value: runId, inline: true },
					)
					.setDescription('Workflow run cancellation request has been sent.')
					.setTimestamp();

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}
		} catch (error) {
			console.error('Error in GitHub workflows command:', error);
			let errorMessage = 'An error occurred while processing your request.';

			if (error instanceof Error) {
				if (error.message.includes('token')) {
					errorMessage = 'GitHub token error. Please check your token with `/github config`.';
				} else if (error.message.includes('repository')) {
					errorMessage = 'Repository error. Please check the repository name or set a default with `/github config`.';
				} else if (error.message.includes('Not Found')) {
					errorMessage = 'Workflow not found or access denied.';
				} else if (error.message.includes('workflow_dispatch')) {
					errorMessage = 'This workflow does not support manual triggering.';
				}
			}

			return app.editReply(interaction, {
				content: `❌ ${errorMessage}`,
			});
		}
	},
} as SlashCommand<true>;
