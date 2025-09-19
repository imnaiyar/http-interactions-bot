export interface UserGitHubPreferences {
	userId: string;
	defaultRepo?: string;
	defaultOwner?: string;
	githubToken?: string;
	createdAt: string;
	updatedAt: string;
}

export class UserPreferencesService {
	constructor(private db: D1Database) {}

	async getUserPreferences(userId: string): Promise<UserGitHubPreferences | null> {
		const result = await this.db
			.prepare('SELECT * FROM user_github_preferences WHERE userId = ?')
			.bind(userId)
			.first<UserGitHubPreferences>();
		
		return result || null;
	}

	async setUserPreferences(preferences: Omit<UserGitHubPreferences, 'createdAt' | 'updatedAt'>): Promise<void> {
		const now = new Date().toISOString();
		
		await this.db
			.prepare(`
				INSERT OR REPLACE INTO user_github_preferences 
				(userId, defaultRepo, defaultOwner, githubToken, createdAt, updatedAt)
				VALUES (?, ?, ?, ?, COALESCE((SELECT createdAt FROM user_github_preferences WHERE userId = ?), ?), ?)
			`)
			.bind(
				preferences.userId,
				preferences.defaultRepo || null,
				preferences.defaultOwner || null,
				preferences.githubToken || null,
				preferences.userId, // for COALESCE check
				now, // for new records
				now // updatedAt
			)
			.run();
	}

	async deleteUserPreferences(userId: string): Promise<void> {
		await this.db
			.prepare('DELETE FROM user_github_preferences WHERE userId = ?')
			.bind(userId)
			.run();
	}

	async initializeDatabase(): Promise<void> {
		await this.db
			.prepare(`
				CREATE TABLE IF NOT EXISTS user_github_preferences (
					userId TEXT PRIMARY KEY,
					defaultRepo TEXT,
					defaultOwner TEXT,
					githubToken TEXT,
					createdAt TEXT NOT NULL,
					updatedAt TEXT NOT NULL
				)
			`)
			.run();
	}
}