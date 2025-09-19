import type { Env } from '../bot';

const GITHUB_API_BASE = 'https://api.github.com';

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
	labels: Array<{
		name: string;
		color: string;
	}>;
	created_at: string;
	updated_at: string;
	html_url: string;
	assignees: Array<{
		login: string;
		avatar_url: string;
	}>;
	milestone: {
		title: string;
		number: number;
	} | null;
}

export interface CreateIssueData {
	title: string;
	body?: string;
	assignees?: string[];
	labels?: string[];
	milestone?: number;
}

export interface EditIssueData {
	title?: string;
	body?: string;
	state?: 'open' | 'closed';
	assignees?: string[];
	labels?: string[];
	milestone?: number | null;
}

export class GitHubAPI {
	private token: string;
	private defaultOwner: string;
	private defaultRepo: string;

	constructor(env: Env) {
		this.token = env.GITHUB_TOKEN || '';
		this.defaultOwner = env.GITHUB_DEFAULT_OWNER || '';
		this.defaultRepo = env.GITHUB_DEFAULT_REPO || '';
	}

	private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
		const url = `${GITHUB_API_BASE}${endpoint}`;
		const headers: Record<string, string> = {
			'Authorization': `Bearer ${this.token}`,
			'Accept': 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
			'User-Agent': 'Discord-Bot-HTTP-Interactions',
			...(options.headers as Record<string, string>),
		};

		// Handle JSON body
		if (options.body && typeof options.body === 'string' && options.body.startsWith('{')) {
			headers['Content-Type'] = 'application/json';
		}

		const response = await fetch(url, {
			...options,
			headers,
		});

		if (!response.ok) {
			let errorMessage = `GitHub API Error: ${response.status} ${response.statusText}`;
			try {
				const errorData = await response.json() as any;
				if (errorData.message) {
					errorMessage += ` - ${errorData.message}`;
				}
			} catch {
				// Ignore JSON parsing errors
			}
			throw new Error(errorMessage);
		}

		return response;
	}

	async listIssues(owner?: string, repo?: string, state: 'open' | 'closed' | 'all' = 'open', perPage = 10): Promise<GitHubIssue[]> {
		const actualOwner = owner || this.defaultOwner;
		const actualRepo = repo || this.defaultRepo;

		if (!actualOwner || !actualRepo) {
			throw new Error('Owner and repository are required');
		}

		const response = await this.request(`/repos/${actualOwner}/${actualRepo}/issues?state=${state}&per_page=${perPage}`);
		return response.json();
	}

	async getIssue(issueNumber: number, owner?: string, repo?: string): Promise<GitHubIssue> {
		const actualOwner = owner || this.defaultOwner;
		const actualRepo = repo || this.defaultRepo;

		if (!actualOwner || !actualRepo) {
			throw new Error('Owner and repository are required');
		}

		const response = await this.request(`/repos/${actualOwner}/${actualRepo}/issues/${issueNumber}`);
		return response.json();
	}

	async createIssue(data: CreateIssueData, owner?: string, repo?: string): Promise<GitHubIssue> {
		const actualOwner = owner || this.defaultOwner;
		const actualRepo = repo || this.defaultRepo;

		if (!actualOwner || !actualRepo) {
			throw new Error('Owner and repository are required');
		}

		const response = await this.request(`/repos/${actualOwner}/${actualRepo}/issues`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
		return response.json();
	}

	async editIssue(issueNumber: number, data: EditIssueData, owner?: string, repo?: string): Promise<GitHubIssue> {
		const actualOwner = owner || this.defaultOwner;
		const actualRepo = repo || this.defaultRepo;

		if (!actualOwner || !actualRepo) {
			throw new Error('Owner and repository are required');
		}

		const response = await this.request(`/repos/${actualOwner}/${actualRepo}/issues/${issueNumber}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
		return response.json();
	}

	async closeIssue(issueNumber: number, owner?: string, repo?: string): Promise<GitHubIssue> {
		return this.editIssue(issueNumber, { state: 'closed' }, owner, repo);
	}

	async reopenIssue(issueNumber: number, owner?: string, repo?: string): Promise<GitHubIssue> {
		return this.editIssue(issueNumber, { state: 'open' }, owner, repo);
	}

	getDefaultRepo(): { owner: string; repo: string } {
		return {
			owner: this.defaultOwner,
			repo: this.defaultRepo,
		};
	}
}