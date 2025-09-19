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
		name: 'github-files',
		description: 'Manage GitHub repository files',
		options: [
			{
				name: 'view',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'View file content',
				options: [
					{
						name: 'path',
						type: ApplicationCommandOptionType.String,
						description: 'File path in repository',
						required: true,
						autocomplete: true,
					},
					{
						name: 'ref',
						type: ApplicationCommandOptionType.String,
						description: 'Branch, tag, or commit SHA (default: main/master)',
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
				name: 'list',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'List directory contents',
				options: [
					{
						name: 'path',
						type: ApplicationCommandOptionType.String,
						description: 'Directory path (leave empty for root)',
						required: false,
						autocomplete: true,
					},
					{
						name: 'ref',
						type: ApplicationCommandOptionType.String,
						description: 'Branch, tag, or commit SHA (default: main/master)',
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
				name: 'search',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'Search for files',
				options: [
					{
						name: 'filename',
						type: ApplicationCommandOptionType.String,
						description: 'Filename or pattern to search for',
						required: true,
					},
					{
						name: 'extension',
						type: ApplicationCommandOptionType.String,
						description: 'File extension filter (e.g., .js, .py)',
						required: false,
					},
					{
						name: 'path',
						type: ApplicationCommandOptionType.String,
						description: 'Search within specific path',
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
				description: 'Create a new file',
				options: [
					{
						name: 'path',
						type: ApplicationCommandOptionType.String,
						description: 'File path to create',
						required: true,
					},
					{
						name: 'content',
						type: ApplicationCommandOptionType.String,
						description: 'File content',
						required: true,
					},
					{
						name: 'message',
						type: ApplicationCommandOptionType.String,
						description: 'Commit message',
						required: true,
					},
					{
						name: 'branch',
						type: ApplicationCommandOptionType.String,
						description: 'Branch to create file in (default: main/master)',
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
				name: 'update',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'Update an existing file',
				options: [
					{
						name: 'path',
						type: ApplicationCommandOptionType.String,
						description: 'File path to update',
						required: true,
						autocomplete: true,
					},
					{
						name: 'content',
						type: ApplicationCommandOptionType.String,
						description: 'New file content',
						required: true,
					},
					{
						name: 'message',
						type: ApplicationCommandOptionType.String,
						description: 'Commit message',
						required: true,
					},
					{
						name: 'branch',
						type: ApplicationCommandOptionType.String,
						description: 'Branch to update file in (default: main/master)',
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
				name: 'delete',
				type: ApplicationCommandOptionType.Subcommand,
				description: 'Delete a file',
				options: [
					{
						name: 'path',
						type: ApplicationCommandOptionType.String,
						description: 'File path to delete',
						required: true,
						autocomplete: true,
					},
					{
						name: 'message',
						type: ApplicationCommandOptionType.String,
						description: 'Commit message',
						required: true,
					},
					{
						name: 'branch',
						type: ApplicationCommandOptionType.String,
						description: 'Branch to delete file from (default: main/master)',
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

		if (!focusedOption || focusedOption.name !== 'path') {
			return { choices: [] };
		}

		const repository = options.getString('repository');
		const token = options.getString('token');

		try {
			const octokit = await githubService.getOctokit(userId, token);
			const repoInfo = await githubService.getRepoInfo(userId, repository);

			const searchPath = focusedOption.value ? String(focusedOption.value) : '';
			const pathParts = searchPath
				.replace(/^(📁|📄)\s*/, '')
				.trim()
				.split('/');
			const dirPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
			const searchTerm = pathParts[pathParts.length - 1].toLowerCase();

			const contents = await githubService.getRepositoryContents(octokit, repoInfo.owner, repoInfo.repo, dirPath);

			if (!contents || !Array.isArray(contents)) {
				return { choices: [] };
			}

			const choices = contents
				.filter((item) => item.name.toLowerCase().includes(searchTerm))
				.map((item) => ({
					name: `${item.type === 'dir' ? '📁' : '📄'} ${item.path}`,
					value: item.path,
				}))
				.slice(0, 25);

			return { choices };
		} catch (error) {
			console.error('Error in files autocomplete:', error);
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

			if (subcommand === 'view') {
				const path = options.getString('path', true);
				const ref = options.getString('ref');

				const { data: file } = await octokit.rest.repos.getContent({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					path,
					ref: ref || undefined,
				});

				if (Array.isArray(file) || file.type !== 'file') {
					return app.editReply(interaction, {
						content: '❌ The specified path is not a file.',
					});
				}

				const content = file.encoding === 'base64' ? atob(file.content.replace(/\n/g, '')) : file.content;
				const fileSize = file.size;
				const maxSize = 1900; // Discord embed limit minus some buffer

				const embed = new EmbedBuilder()
					.setTitle(`📄 ${file.name}`)
					.setURL(file.html_url)
					.setColor(0x0366d6)
					.addFields(
						{ name: 'Path', value: `\`${file.path}\``, inline: true },
						{ name: 'Size', value: `${fileSize} bytes`, inline: true },
						{ name: 'Repository', value: `${repoInfo.owner}/${repoInfo.repo}`, inline: true },
					)
					.setTimestamp();

				if (ref) {
					embed.addFields({ name: 'Reference', value: ref, inline: true });
				}

				// Detect file type for syntax highlighting
				const extension = file.name.split('.').pop()?.toLowerCase();
				let language = '';
				switch (extension) {
					case 'js':
					case 'jsx':
						language = 'javascript';
						break;
					case 'ts':
					case 'tsx':
						language = 'typescript';
						break;
					case 'py':
						language = 'python';
						break;
					case 'java':
						language = 'java';
						break;
					case 'cpp':
					case 'cc':
					case 'cxx':
						language = 'cpp';
						break;
					case 'c':
						language = 'c';
						break;
					case 'cs':
						language = 'csharp';
						break;
					case 'php':
						language = 'php';
						break;
					case 'rb':
						language = 'ruby';
						break;
					case 'go':
						language = 'go';
						break;
					case 'rs':
						language = 'rust';
						break;
					case 'sh':
					case 'bash':
						language = 'bash';
						break;
					case 'json':
						language = 'json';
						break;
					case 'xml':
					case 'html':
						language = 'xml';
						break;
					case 'css':
						language = 'css';
						break;
					case 'sql':
						language = 'sql';
						break;
					case 'yaml':
					case 'yml':
						language = 'yaml';
						break;
					case 'md':
						language = 'markdown';
						break;
				}

				if (content.length <= maxSize) {
					embed.setDescription(`\`\`\`${language}\n${content}\n\`\`\``);
				} else {
					const truncated = content.slice(0, maxSize - 100);
					embed.setDescription(`\`\`\`${language}\n${truncated}\n... (truncated)\n\`\`\``);
					embed.setFooter({ text: 'File content truncated. View full content on GitHub.' });
				}

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}

			if (subcommand === 'list') {
				const path = options.getString('path') || '';
				const ref = options.getString('ref');

				const contents = await githubService.getRepositoryContents(octokit, repoInfo.owner, repoInfo.repo, path);

				if (!contents) {
					return app.editReply(interaction, {
						content: '❌ Path not found.',
						flags: MessageFlags.Ephemeral,
					});
				}

				const embed = new EmbedBuilder()
					.setTitle(`📁 ${path || 'Repository Root'}`)
					.setColor(0x0366d6)
					.addFields({ name: 'Repository', value: `${repoInfo.owner}/${repoInfo.repo}`, inline: true })
					.setTimestamp();

				if (ref) {
					embed.addFields({ name: 'Reference', value: ref, inline: true });
				}

				if (Array.isArray(contents)) {
					const dirs = contents.filter((item) => item.type === 'dir');
					const files = contents.filter((item) => item.type === 'file');

					let description = '';

					if (dirs.length > 0) {
						description += '**📁 Directories:**\n';
						description += dirs.map((dir) => `📁 \`${dir.name}\``).join('\n');
						description += '\n\n';
					}

					if (files.length > 0) {
						description += '**📄 Files:**\n';
						description += files.map((file) => `📄 \`${file.name}\` (${file.size} bytes)`).join('\n');
					}

					if (description.length > 4000) {
						description = description.slice(0, 4000) + '\n... (truncated)';
					}

					embed.setDescription(description || 'Empty directory');
					embed.setFooter({ text: `${dirs.length} directories, ${files.length} files` });
				} else {
					embed.setDescription('This path points to a single file. Use `/github-files view` to see its content.');
				}

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}

			if (subcommand === 'search') {
				const filename = options.getString('filename', true);
				const extension = options.getString('extension');
				const path = options.getString('path');

				let searchQuery = filename;
				if (extension) {
					searchQuery += ` extension:${extension.replace('.', '')}`;
				}
				if (path) {
					searchQuery += ` path:${path}`;
				}

				const files = await githubService.searchFiles(octokit, repoInfo.owner, repoInfo.repo, searchQuery, 25);

				const embed = new EmbedBuilder()
					.setTitle(`🔍 File Search Results`)
					.setColor(0x0366d6)
					.addFields({ name: 'Repository', value: `${repoInfo.owner}/${repoInfo.repo}`, inline: true })
					.setTimestamp();

				if (files.length === 0) {
					embed.setDescription('No files found matching the search criteria.');
				} else {
					const filesList = files.map((file) => `📄 [\`${file.path}\`](${file.html_url})`).join('\n');

					embed.setDescription(filesList);
					embed.setFooter({ text: `Found ${files.length} file(s)` });
				}

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}

			if (subcommand === 'create') {
				const path = options.getString('path', true);
				const content = options.getString('content', true);
				const message = options.getString('message', true);
				const branch = options.getString('branch');

				const { data: result } = await octokit.rest.repos.createOrUpdateFileContents({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					path,
					message,
					content: btoa(content), // Base64 encode
					branch: branch || undefined,
				});

				const embed = new EmbedBuilder()
					.setTitle('✅ File Created')
					.setURL(result.content?.html_url || null)
					.setColor(0x28a745)
					.addFields(
						{ name: 'File', value: `\`${path}\``, inline: true },
						{ name: 'Repository', value: `${repoInfo.owner}/${repoInfo.repo}`, inline: true },
						{ name: 'Branch', value: branch || 'default', inline: true },
						{ name: 'Commit SHA', value: result.commit.sha?.slice(0, 7) || 'Unknown', inline: true },
					)
					.setDescription(`**Commit Message:** ${message}`)
					.setTimestamp();

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}

			if (subcommand === 'update') {
				const path = options.getString('path', true);
				const content = options.getString('content', true);
				const message = options.getString('message', true);
				const branch = options.getString('branch');

				// Get current file to obtain SHA
				const { data: currentFile } = await octokit.rest.repos.getContent({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					path,
					ref: branch || undefined,
				});

				if (Array.isArray(currentFile) || currentFile.type !== 'file') {
					return app.editReply(interaction, {
						content: '❌ The specified path is not a file.',
					});
				}

				const { data: result } = await octokit.rest.repos.createOrUpdateFileContents({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					path,
					message,
					content: btoa(content), // Base64 encode
					sha: currentFile.sha,
					branch: branch || undefined,
				});

				const embed = new EmbedBuilder()
					.setTitle('✅ File Updated')
					.setURL(result.content?.html_url || null)
					.setColor(0x0366d6)
					.addFields(
						{ name: 'File', value: `\`${path}\``, inline: true },
						{ name: 'Repository', value: `${repoInfo.owner}/${repoInfo.repo}`, inline: true },
						{ name: 'Branch', value: branch || 'default', inline: true },
						{ name: 'Commit SHA', value: result.commit.sha?.slice(0, 7) || 'Unknown', inline: true },
					)
					.setDescription(`**Commit Message:** ${message}`)
					.setTimestamp();

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}

			if (subcommand === 'delete') {
				const path = options.getString('path', true);
				const message = options.getString('message', true);
				const branch = options.getString('branch');

				// Get current file to obtain SHA
				const { data: currentFile } = await octokit.rest.repos.getContent({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					path,
					ref: branch || undefined,
				});

				if (Array.isArray(currentFile) || currentFile.type !== 'file') {
					return app.editReply(interaction, {
						content: '❌ The specified path is not a file.',
					});
				}

				const { data: result } = await octokit.rest.repos.deleteFile({
					owner: repoInfo.owner,
					repo: repoInfo.repo,
					path,
					message,
					sha: currentFile.sha,
					branch: branch || undefined,
				});

				const embed = new EmbedBuilder()
					.setTitle('🗑️ File Deleted')
					.setColor(0xff6b35)
					.addFields(
						{ name: 'File', value: `\`${path}\``, inline: true },
						{ name: 'Repository', value: `${repoInfo.owner}/${repoInfo.repo}`, inline: true },
						{ name: 'Branch', value: branch || 'default', inline: true },
						{ name: 'Commit SHA', value: result.commit.sha?.slice(0, 7) || 'Unknown', inline: true },
					)
					.setDescription(`**Commit Message:** ${message}`)
					.setTimestamp();

				return app.editReply(interaction, {
					embeds: [embed.toJSON()],
				});
			}
		} catch (error) {
			console.error('Error in GitHub files command:', error);
			let errorMessage = 'An error occurred while processing your request.';

			if (error instanceof Error) {
				if (error.message.includes('token')) {
					errorMessage = 'GitHub token error. Please check your token with `/github config`.';
				} else if (error.message.includes('repository')) {
					errorMessage = 'Repository error. Please check the repository name or set a default with `/github config`.';
				} else if (error.message.includes('Not Found')) {
					errorMessage = 'File or directory not found.';
				} else if (error.message.includes('sha')) {
					errorMessage = 'File has been modified. Please try again.';
				}
			}

			return app.editReply(interaction, {
				content: `❌ ${errorMessage}`,
			});
		}
	},
} as SlashCommand<true>;
