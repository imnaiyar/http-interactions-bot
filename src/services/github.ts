import { Octokit } from '@octokit/rest';

export interface GitHubUserPreferences {
	user_id: string;
	default_repo?: string;
	github_token?: string;
	created_at: string;
	updated_at: string;
}

export interface RepoInfo {
	owner: string;
	repo: string;
}

export class GitHubService {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	/**
	 * Get user's GitHub preferences from the database
	 */
	async getUserPreferences(userId: string): Promise<GitHubUserPreferences | null> {
		const query = 'SELECT * FROM github_user_preferences WHERE user_id = ?';
		const result = await this.env.db.prepare(query).bind(userId).first<GitHubUserPreferences>();
		return result || null;
	}

	/**
	 * Save or update user's GitHub preferences
	 */
	async saveUserPreferences(userId: string, defaultRepo?: string | null, githubToken?: string | null): Promise<void> {
		const existing = await this.getUserPreferences(userId);

		if (existing) {
			// Update existing preferences
			const updateQuery = `
				UPDATE github_user_preferences 
				SET default_repo = COALESCE(?, default_repo),
					github_token = COALESCE(?, github_token),
					updated_at = CURRENT_TIMESTAMP
				WHERE user_id = ?
			`;
			await this.env.db.prepare(updateQuery).bind(defaultRepo, githubToken, userId).run();
		} else {
			// Insert new preferences
			const insertQuery = `
				INSERT INTO github_user_preferences (user_id, default_repo, github_token)
				VALUES (?, ?, ?)
			`;
			await this.env.db.prepare(insertQuery).bind(userId, defaultRepo, githubToken).run();
		}
	}

	/**
	 * Parse repository string into owner/repo format
	 */
	parseRepo(repoString: string): RepoInfo {
		const parts = repoString.split('/');
		if (parts.length !== 2) {
			throw new Error('Repository must be in format "owner/repo"');
		}
		return {
			owner: parts[0],
			repo: parts[1],
		};
	}

	/**
	 * Get Octokit instance with user's token or throw error if no token
	 */
	async getOctokit(userId: string, overrideToken?: string | null): Promise<Octokit> {
		let token = overrideToken;

		if (!token) {
			const preferences = await this.getUserPreferences(userId);
			token = preferences?.github_token;
		}

		if (!token) {
			throw new Error('No GitHub token found. Please set your token with `/github config`');
		}

		return new Octokit({
			auth: token,
		});
	}

	/**
	 * Get repository info (owner/repo) from user preferences or override
	 */
	async getRepoInfo(userId: string, overrideRepo?: string | null): Promise<RepoInfo> {
		let repoString = overrideRepo;

		if (!repoString) {
			const preferences = await this.getUserPreferences(userId);
			repoString = preferences?.default_repo;
		}

		if (!repoString) {
			throw new Error('No repository specified. Please provide a repository or set a default with `/github config`');
		}

		return this.parseRepo(repoString);
	}

	/**
	 * Validate that a repository exists and user has access
	 */
	async validateRepository(octokit: Octokit, owner: string, repo: string): Promise<boolean> {
		try {
			await octokit.rest.repos.get({ owner, repo });
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Search for issues with autocomplete support
	 */
	async searchIssues(octokit: Octokit, owner: string, repo: string, query: string = '', limit: number = 25) {
		try {
			const searchQuery = `repo:${owner}/${repo}  is:issue  ${query}`.trim();
			const response = await octokit.rest.search.issuesAndPullRequests({
				q: searchQuery,
				per_page: limit,
				sort: 'updated',
				order: 'desc',
				advanced_search: 'true',
			});

			return response.data.items.filter((item) => !item.pull_request);
		} catch (error) {
			console.error('Error searching issues:', error);
			return [];
		}
	}

	/**
	 * Search for pull requests with autocomplete support
	 */
	async searchPullRequests(octokit: Octokit, owner: string, repo: string, query: string = '', limit: number = 25) {
		try {
			const searchQuery = `repo:${owner}/${repo} is:pr ${query}`.trim();
			const response = await octokit.rest.search.issuesAndPullRequests({
				q: searchQuery,
				per_page: limit,
				sort: 'updated',
				order: 'desc',
				advanced_search: 'true',
			});

			return response.data.items.filter((item) => item.pull_request);
		} catch (error) {
			console.error('Error searching pull requests:', error);
			return [];
		}
	}

	/**
	 * Get repository workflows
	 */
	async getWorkflows(octokit: Octokit, owner: string, repo: string) {
		try {
			const response = await octokit.rest.actions.listRepoWorkflows({
				owner,
				repo,
			});
			return response.data.workflows;
		} catch (error) {
			console.error('Error fetching workflows:', error);
			return [];
		}
	}

	/**
	 * Get workflow runs for a specific workflow
	 */
	async getWorkflowRuns(octokit: Octokit, owner: string, repo: string, workflowId: string | number, limit: number = 25) {
		try {
			const response = await octokit.rest.actions.listWorkflowRuns({
				owner,
				repo,
				workflow_id: workflowId,
				per_page: limit,
			});
			return response.data.workflow_runs;
		} catch (error) {
			console.error('Error fetching workflow runs:', error);
			return [];
		}
	}

	/**
	 * Get repository contents (files/directories)
	 */
	async getRepositoryContents(octokit: Octokit, owner: string, repo: string, path: string = '') {
		try {
			const response = await octokit.rest.repos.getContent({
				owner,
				repo,
				path,
			});
			return response.data;
		} catch (error) {
			console.error('Error fetching repository contents:', error);
			return null;
		}
	}

	/**
	 * Search repository files
	 */
	async searchFiles(octokit: Octokit, owner: string, repo: string, filename: string, limit: number = 25) {
		try {
			const searchQuery = `repo:${owner}/${repo} filename:${filename}`;
			const response = await octokit.rest.search.code({
				q: searchQuery,
				per_page: limit,
			});
			return response.data.items;
		} catch (error) {
			console.error('Error searching files:', error);
			return [];
		}
	}
}
