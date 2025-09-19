const GITHUB_BASE_API = 'https://api.github.com';

export interface GitHubConfig {
	token?: string;
	owner?: string;
	repo?: string;
}

export interface GitHubIssue {
	id: number;
	number: number;
	title: string;
	body: string | null;
	state: 'open' | 'closed';
	user: {
		login: string;
		avatar_url: string;
	};
	created_at: string;
	updated_at: string;
	html_url: string;
}

export interface GitHubPullRequest {
	id: number;
	number: number;
	title: string;
	body: string | null;
	state: 'open' | 'closed' | 'merged';
	user: {
		login: string;
		avatar_url: string;
	};
	head: {
		ref: string;
		sha: string;
	};
	base: {
		ref: string;
		sha: string;
	};
	mergeable: boolean | null;
	merged: boolean;
	created_at: string;
	updated_at: string;
	html_url: string;
}

export interface GitHubFile {
	name: string;
	path: string;
	sha: string;
	size: number;
	type: 'file' | 'dir';
	download_url: string | null;
	html_url: string;
}

export interface GitHubWorkflow {
	id: number;
	name: string;
	path: string;
	state: 'active' | 'deleted' | 'disabled_fork' | 'disabled_inactivity' | 'disabled_manually';
	created_at: string;
	updated_at: string;
	html_url: string;
}

export interface GitHubWorkflowRun {
	id: number;
	name: string;
	status: 'queued' | 'in_progress' | 'completed';
	conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
	workflow_id: number;
	head_branch: string;
	head_sha: string;
	event: string;
	created_at: string;
	updated_at: string;
	html_url: string;
}

export class GitHubAPI {
	private defaultConfig: GitHubConfig;

	constructor(private env: Env) {
		this.defaultConfig = {
			token: env.GITHUB_TOKEN,
			owner: env.GITHUB_DEFAULT_OWNER || 'imnaiyar',
			repo: env.GITHUB_DEFAULT_REPO || 'http-interactions-bot',
		};
	}

	private async request(endpoint: string, config: GitHubConfig, options: RequestInit = {}) {
		const token = config.token || this.defaultConfig.token;
		if (!token) {
			throw new Error('GitHub token is required');
		}

		const headers: Record<string, string> = {
			Authorization: `Bearer ${token}`,
			Accept: 'application/vnd.github.v3+json',
			'User-Agent': 'HTTP-Interactions-Bot',
			...(options.headers as Record<string, string>),
		};

		if (options.body) {
			headers['Content-Type'] = 'application/json';
		}

		const response = await fetch(`${GITHUB_BASE_API}${endpoint}`, {
			...options,
			headers,
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${error}`);
		}

		return response;
	}

	// Issue operations
	async listIssues(config: GitHubConfig, params: { state?: 'open' | 'closed' | 'all'; per_page?: number; page?: number } = {}): Promise<GitHubIssue[]> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;
		
		const queryParams = new URLSearchParams({
			state: params.state || 'open',
			per_page: (params.per_page || 30).toString(),
			page: (params.page || 1).toString(),
		});

		const response = await this.request(`/repos/${owner}/${repo}/issues?${queryParams}`, config);
		return response.json();
	}

	async getIssue(config: GitHubConfig, issueNumber: number): Promise<GitHubIssue> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;

		const response = await this.request(`/repos/${owner}/${repo}/issues/${issueNumber}`, config);
		return response.json();
	}

	async createIssue(config: GitHubConfig, data: { title: string; body?: string; labels?: string[]; assignees?: string[] }): Promise<GitHubIssue> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;

		const response = await this.request(`/repos/${owner}/${repo}/issues`, config, {
			method: 'POST',
			body: JSON.stringify(data),
		});
		return response.json();
	}

	async updateIssue(config: GitHubConfig, issueNumber: number, data: { title?: string; body?: string; state?: 'open' | 'closed'; labels?: string[]; assignees?: string[] }): Promise<GitHubIssue> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;

		const response = await this.request(`/repos/${owner}/${repo}/issues/${issueNumber}`, config, {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
		return response.json();
	}

	// Pull Request operations
	async listPullRequests(config: GitHubConfig, params: { state?: 'open' | 'closed' | 'all'; per_page?: number; page?: number } = {}): Promise<GitHubPullRequest[]> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;
		
		const queryParams = new URLSearchParams({
			state: params.state || 'open',
			per_page: (params.per_page || 30).toString(),
			page: (params.page || 1).toString(),
		});

		const response = await this.request(`/repos/${owner}/${repo}/pulls?${queryParams}`, config);
		return response.json();
	}

	async getPullRequest(config: GitHubConfig, prNumber: number): Promise<GitHubPullRequest> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;

		const response = await this.request(`/repos/${owner}/${repo}/pulls/${prNumber}`, config);
		return response.json();
	}

	async createPullRequest(config: GitHubConfig, data: { title: string; head: string; base: string; body?: string; draft?: boolean }): Promise<GitHubPullRequest> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;

		const response = await this.request(`/repos/${owner}/${repo}/pulls`, config, {
			method: 'POST',
			body: JSON.stringify(data),
		});
		return response.json();
	}

	async updatePullRequest(config: GitHubConfig, prNumber: number, data: { title?: string; body?: string; state?: 'open' | 'closed'; base?: string }): Promise<GitHubPullRequest> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;

		const response = await this.request(`/repos/${owner}/${repo}/pulls/${prNumber}`, config, {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
		return response.json();
	}

	async mergePullRequest(config: GitHubConfig, prNumber: number, data: { commit_title?: string; commit_message?: string; merge_method?: 'merge' | 'squash' | 'rebase' } = {}): Promise<{ sha: string; merged: boolean; message: string }> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;

		const response = await this.request(`/repos/${owner}/${repo}/pulls/${prNumber}/merge`, config, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
		return response.json();
	}

	// File operations
	async getContents(config: GitHubConfig, path: string, ref?: string): Promise<GitHubFile[]> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;
		
		const queryParams = ref ? `?ref=${ref}` : '';
		const response = await this.request(`/repos/${owner}/${repo}/contents/${path}${queryParams}`, config);
		const data = await response.json();
		
		// Handle both single file and directory listings
		return Array.isArray(data) ? data : [data];
	}

	async getFileContent(config: GitHubConfig, path: string, ref?: string): Promise<{ content: string; encoding: string; sha: string }> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;
		
		const queryParams = ref ? `?ref=${ref}` : '';
		const response = await this.request(`/repos/${owner}/${repo}/contents/${path}${queryParams}`, config);
		const data = await response.json();
		
		if (data.type !== 'file') {
			throw new Error('Path does not point to a file');
		}
		
		return {
			content: data.encoding === 'base64' ? atob(data.content.replace(/\s/g, '')) : data.content,
			encoding: data.encoding,
			sha: data.sha,
		};
	}

	async createFile(config: GitHubConfig, path: string, data: { message: string; content: string; branch?: string }): Promise<{ commit: { sha: string; html_url: string } }> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;

		const fileData = {
			message: data.message,
			content: btoa(data.content),
			...(data.branch && { branch: data.branch }),
		};

		const response = await this.request(`/repos/${owner}/${repo}/contents/${path}`, config, {
			method: 'PUT',
			body: JSON.stringify(fileData),
		});
		return response.json();
	}

	async updateFile(config: GitHubConfig, path: string, data: { message: string; content: string; sha: string; branch?: string }): Promise<{ commit: { sha: string; html_url: string } }> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;

		const fileData = {
			message: data.message,
			content: btoa(data.content),
			sha: data.sha,
			...(data.branch && { branch: data.branch }),
		};

		const response = await this.request(`/repos/${owner}/${repo}/contents/${path}`, config, {
			method: 'PUT',
			body: JSON.stringify(fileData),
		});
		return response.json();
	}

	async deleteFile(config: GitHubConfig, path: string, data: { message: string; sha: string; branch?: string }): Promise<{ commit: { sha: string; html_url: string } }> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;

		const fileData = {
			message: data.message,
			sha: data.sha,
			...(data.branch && { branch: data.branch }),
		};

		const response = await this.request(`/repos/${owner}/${repo}/contents/${path}`, config, {
			method: 'DELETE',
			body: JSON.stringify(fileData),
		});
		return response.json();
	}

	// Workflow operations
	async listWorkflows(config: GitHubConfig, params: { per_page?: number; page?: number } = {}): Promise<{ workflows: GitHubWorkflow[] }> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;
		
		const queryParams = new URLSearchParams({
			per_page: (params.per_page || 30).toString(),
			page: (params.page || 1).toString(),
		});

		const response = await this.request(`/repos/${owner}/${repo}/actions/workflows?${queryParams}`, config);
		return response.json();
	}

	async getWorkflow(config: GitHubConfig, workflowId: number | string): Promise<GitHubWorkflow> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;

		const response = await this.request(`/repos/${owner}/${repo}/actions/workflows/${workflowId}`, config);
		return response.json();
	}

	async listWorkflowRuns(config: GitHubConfig, workflowId: number | string, params: { status?: string; per_page?: number; page?: number } = {}): Promise<{ workflow_runs: GitHubWorkflowRun[] }> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;
		
		const queryParams = new URLSearchParams({
			per_page: (params.per_page || 30).toString(),
			page: (params.page || 1).toString(),
			...(params.status && { status: params.status }),
		});

		const response = await this.request(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs?${queryParams}`, config);
		return response.json();
	}

	async triggerWorkflow(config: GitHubConfig, workflowId: number | string, data: { ref: string; inputs?: Record<string, any> }): Promise<void> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;

		await this.request(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, config, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async getWorkflowRun(config: GitHubConfig, runId: number): Promise<GitHubWorkflowRun> {
		const owner = config.owner || this.defaultConfig.owner;
		const repo = config.repo || this.defaultConfig.repo;

		const response = await this.request(`/repos/${owner}/${repo}/actions/runs/${runId}`, config);
		return response.json();
	}
}