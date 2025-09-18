const PROVIDER = 'mangapill';
const PROVIDER_HOST = 'https://cdn.readdetectiveconan.com/';
export interface Manga {
	id: string;
	title: string;
	image: string;
	altTitles: string[] | null;
	genres: string[] | null;
	description: string | null;
	releaseDate: string | null;
	chapters: MangaChapter[] | null;
}
export type MangaChapter = { id: string; title: string; chapter: string };
export type MangaChapterPage = { img: string; page: number; referer?: string };
export class MangaService {
	constructor(private readonly env: Env) {}
	async searchManga(query: string) {
		if (!query) return [];
		const a = await this.fetch<{ results: Pick<Manga, 'id' | 'title' | 'image'>[] }>(`/${query}`);
		return a.results || [];
	}

	async getManga<T extends Manga>(mangaId: string): Promise<T | null> {
		if (!mangaId) return null;
		const a = await this.fetch<T>(`/info?id=${mangaId}`);
		if (!a?.id) return null; // means something went wrong
		return { ...a, image: a.image?.startsWith(PROVIDER_HOST) ? this.proxifyChapterImages(a.image) : a.image };
	}

	async getChapter(chapterId: string): Promise<MangaChapterPage[] | null> {
		if (!chapterId) return null;
		const chapter = await this.fetch<MangaChapterPage[]>(`/read?chapterId=${chapterId}`);

		if (!Array.isArray(chapter)) return null;
		return chapter.map((ch) => ({ ...ch, img: this.proxifyChapterImages(ch.img) }));
	}

	async fetch<T>(path: string) {
		const res = await fetch(`${this.env.MANGA_API}/manga/mangapill${path}`, {
			cf: { cacheTtl: 1000 * 60 * 60 * 24, cacheEverything: true },
		});
		return res.json() as Promise<T>;
	}

	proxifyChapterImages(url: string): string {
		return `${this.env.MANGA_API}/manga/proxy-image?url=${encodeURIComponent(url)}`;
	}
}
