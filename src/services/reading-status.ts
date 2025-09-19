import { Manga, MangaChapter } from './manga';

// D1 Reading Status Service
export interface ReadingStatus {
	user_id: string;
	manga_id: string;
	manga_name: string;
	chapter_id: string;
	chapter_name: string;
	page: number;
	updated_at: string;
}

export class ReadingStatusService {
	constructor(private db: D1Database) {}

	async setStatus(user_id: string, manga: Manga, chapter: MangaChapter, page: number) {
		await this.db
			.prepare(
				`INSERT INTO reading_status (user_id, manga_id, manga_name, chapter_name, chapter_id, page, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, manga_id) DO UPDATE SET chapter_id=excluded.chapter_id, page=excluded.page, updated_at=datetime('now')`
			)
			.bind(user_id, manga.id, manga.title, chapter.title, chapter.id, page)
			.run();
	}

	async getStatus(user_id: string, manga_id: string): Promise<ReadingStatus | null> {
		const result = await this.db
			.prepare(`SELECT * FROM reading_status WHERE user_id = ? AND manga_id = ?`)
			.bind(user_id, manga_id)
			.first<ReadingStatus>();
		return result ?? null;
	}

	async listStatus(user_id: string): Promise<ReadingStatus[]> {
		const result = await this.db
			.prepare(`SELECT * FROM reading_status WHERE user_id = ? ORDER BY updated_at DESC`)
			.bind(user_id)
			.all<ReadingStatus>();
		return result.results ?? [];
	}
}
