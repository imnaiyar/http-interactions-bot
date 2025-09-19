import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { GitHubAPI, type GitHubConfig } from '@/services/github';
import { UserPreferencesService } from '@/services/userPreferences';

// Common option definitions
export const commonGitHubOptions = {
	repo: {
		name: 'repo',
		description: 'Repository name (owner/repo) - overrides your saved preference',
		type: ApplicationCommandOptionType.String,
		required: false,
	},
	token: {
		name: 'token',
		description: 'GitHub token - overrides your saved preference',
		type: ApplicationCommandOptionType.String,
		required: false,
	},
	ref: {
		name: 'ref',
		description: 'Branch/tag/commit reference',
		type: ApplicationCommandOptionType.String,
		required: false,
	},
	branch: {
		name: 'branch',
		description: 'Branch to commit to',
		type: ApplicationCommandOptionType.String,
		required: false,
	},
	state: {
		name: 'state',
		description: 'Filter by state',
		type: ApplicationCommandOptionType.String,
		choices: [
			{ name: 'Open', value: 'open' },
			{ name: 'Closed', value: 'closed' },
			{ name: 'All', value: 'all' },
		],
		required: false,
	},
	query: {
		name: 'query',
		description: 'Search query for filtering',
		type: ApplicationCommandOptionType.String,
		required: false,
		autocomplete: true,
	},
} as const;

// Helper function to parse repository configuration
export async function parseGitHubConfig(
	env: Env,
	userId: string,
	repoParam?: string | null,
	tokenParam?: string | null
): Promise<GitHubConfig> {
	const preferencesService = new UserPreferencesService(env.db);
	const userPrefs = await preferencesService.getUserPreferences(userId);
	
	const config: GitHubConfig = {};
	
	// Use provided token or user preference or environment default
	config.token = tokenParam || userPrefs?.githubToken || env.GITHUB_TOKEN;
	
	if (repoParam) {
		const parts = repoParam.split('/');
		if (parts.length === 2) {
			config.owner = parts[0];
			config.repo = parts[1];
		}
	} else if (userPrefs?.defaultOwner && userPrefs?.defaultRepo) {
		config.owner = userPrefs.defaultOwner;
		config.repo = userPrefs.defaultRepo;
	} else {
		config.owner = env.GITHUB_DEFAULT_OWNER || 'imnaiyar';
		config.repo = env.GITHUB_DEFAULT_REPO || 'http-interactions-bot';
	}
	
	return config;
}

// Issue autocomplete handler
export async function handleIssueAutocomplete(
	github: GitHubAPI,
	config: GitHubConfig,
	query: string,
	state: 'open' | 'closed' | 'all' = 'open'
) {
	try {
		const issues = await github.listIssues(config, { state, per_page: 25 });
		
		return issues
			.filter(issue => 
				issue.title.toLowerCase().includes(query.toLowerCase()) ||
				issue.number.toString().includes(query) ||
				issue.user.login.toLowerCase().includes(query.toLowerCase())
			)
			.slice(0, 25)
			.map(issue => ({
				name: `#${issue.number}: ${issue.title.slice(0, 80)}${issue.title.length > 80 ? '...' : ''}`,
				value: issue.number.toString(),
			}));
	} catch (error) {
		console.error('Issue autocomplete error:', error);
		return [{ name: 'Error loading issues', value: '0' }];
	}
}

// PR autocomplete handler
export async function handlePRAutocomplete(
	github: GitHubAPI,
	config: GitHubConfig,
	query: string,
	state: 'open' | 'closed' | 'all' = 'open'
) {
	try {
		const prs = await github.listPullRequests(config, { state, per_page: 25 });
		
		return prs
			.filter(pr => 
				pr.title.toLowerCase().includes(query.toLowerCase()) ||
				pr.number.toString().includes(query) ||
				pr.user.login.toLowerCase().includes(query.toLowerCase())
			)
			.slice(0, 25)
			.map(pr => ({
				name: `#${pr.number}: ${pr.title.slice(0, 80)}${pr.title.length > 80 ? '...' : ''}`,
				value: pr.number.toString(),
			}));
	} catch (error) {
		console.error('PR autocomplete error:', error);
		return [{ name: 'Error loading pull requests', value: '0' }];
	}
}

// Workflow autocomplete handler
export async function handleWorkflowAutocomplete(
	github: GitHubAPI,
	config: GitHubConfig,
	query: string
) {
	try {
		const result = await github.listWorkflows(config, { per_page: 100 });
		
		return result.workflows
			.filter(workflow => 
				workflow.name.toLowerCase().includes(query.toLowerCase()) ||
				workflow.path.toLowerCase().includes(query.toLowerCase())
			)
			.slice(0, 25)
			.map(workflow => ({
				name: `${workflow.name} (${workflow.state})`,
				value: workflow.id.toString(),
			}));
	} catch (error) {
		console.error('Workflow autocomplete error:', error);
		return [{ name: 'Error loading workflows', value: '0' }];
	}
}

// File path autocomplete handler
export async function handleFileAutocomplete(
	github: GitHubAPI,
	config: GitHubConfig,
	query: string,
	ref?: string
) {
	try {
		// Get the directory path from the query
		const lastSlash = query.lastIndexOf('/');
		const directory = lastSlash >= 0 ? query.substring(0, lastSlash) : '';
		const filename = lastSlash >= 0 ? query.substring(lastSlash + 1) : query;
		
		const files = await github.getContents(config, directory, ref);
		
		return files
			.filter(file => 
				file.name.toLowerCase().includes(filename.toLowerCase())
			)
			.slice(0, 25)
			.map(file => ({
				name: `${file.type === 'dir' ? '📁' : '📄'} ${file.name}`,
				value: directory ? `${directory}/${file.name}` : file.name,
			}));
	} catch (error) {
		console.error('File autocomplete error:', error);
		return [{ name: 'Error loading files', value: '' }];
	}
}