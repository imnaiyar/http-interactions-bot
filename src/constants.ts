import { ApplicationCommandOptionType } from 'discord-api-types/v10';

export const HIDE_OPTIONS = {
	name: 'hide',
	description: 'hide the response',
	type: ApplicationCommandOptionType.Boolean,
} as const;
