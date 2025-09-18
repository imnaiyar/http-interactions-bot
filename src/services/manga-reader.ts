import { ButtonBuilder, ContainerBuilder, StringSelectMenuBuilder } from '@discordjs/builders';
import { MangaChapter } from './manga';

export interface MangaPage {
	page: number;
	img: string;
}

export interface MangaInfo {
	id: string;
	title: string;
	image?: string;
}

export interface MangaReaderOptions {
	manga: MangaInfo;
	chapter: MangaChapter;
	pages: MangaPage[];
	currentPage: number;
}

export function createMangaReaderComponents({ manga, chapter, pages, currentPage }: MangaReaderOptions) {
	const container = new ContainerBuilder()
		.addTextDisplayComponents((ts) =>
			ts.setContent(`-# Reading: ${manga.title} | ${chapter.title}\n### Page ${currentPage} of ${pages.length}`)
		)
		.addSeparatorComponents()
		.addActionRowComponents((ac) =>
			ac.addComponents(
				new StringSelectMenuBuilder().setCustomId(`manga-read-select:${manga.id};${chapter.id}`).setOptions(
					pages.map((p) => ({
						label: `Page ${p.page}`,
						value: `${p.page}`,
						default: p.page === currentPage,
					}))
				)
			)
		)
		.addMediaGalleryComponents((m) => {
			const currentPageData = pages.find((p) => p.page === currentPage) || pages[0];
			return m.addItems({ media: { url: currentPageData.img } });
		})
		.addActionRowComponents((ac) => {
			const prevPage = Math.max(1, currentPage - 1);
			const nextPage = Math.min(pages.length, currentPage + 1);

			ac.addComponents(
				new ButtonBuilder({
					style: 2,
					custom_id: `manga-prev:${manga.id};${chapter.id};${prevPage}`,
					label: 'Prev',
					disabled: currentPage === 1,
				}),
				new ButtonBuilder({
					style: 2,
					custom_id: `manga-next:${manga.id};${chapter.id};${nextPage}`,
					label: 'Next',
					disabled: currentPage === pages.length,
				})
			);
			return ac;
		});

	return container.toJSON();
}

export function parseMangaButtonId(customId: string): {
	action: 'prev' | 'next';
	mangaId: string;
	chapter: string;
	page: number;
} {
	// Format: manga-prev:mangaId;chapter;page or manga-next:mangaId;chapter;page
	const [actionPart, dataPart] = customId.split(':');
	const action = actionPart.split('-')[1] as 'prev' | 'next';
	const [mangaId, chapter, pageStr] = dataPart.split(';');

	return {
		action,
		mangaId,
		chapter,
		page: parseInt(pageStr, 10),
	};
}

export function parseMangaSelectId(customId: string): {
	mangaId: string;
	chapter: string;
} {
	// Format: manga-read-select:mangaId;chapter
	const [, dataPart] = customId.split(':');
	const [mangaId, chapter] = dataPart.split(';');

	return { mangaId, chapter };
}
