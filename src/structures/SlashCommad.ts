import type {
	APIApplicationCommandOption,
	APIChatInputApplicationCommandInteraction,
	APIApplicationCommandAutocompleteInteraction,
	APICommandAutocompleteInteractionResponseCallbackData,
} from 'discord-api-types/v10';
import type { ContextType, IntegrationType } from './index';
import type { Bot } from '@/bot';
import type { InteractionOptionResolver } from '@sapphire/discord-utilities';

export interface SlashCommand<Autocomplete extends boolean = false> {
	data: {
		name: string;
		description: string;
		options?: APIApplicationCommandOption[];
		integration_types: IntegrationType[];
		contexts: ContextType[];
	};
	ownerOnly?: boolean;
	run: (app: Bot, interaction: APIChatInputApplicationCommandInteraction, options: InteractionOptionResolver) => Promise<void>;
	autocomplete?: Autocomplete extends true
		? (
				app: Bot,
				interaction: APIApplicationCommandAutocompleteInteraction,
				options: InteractionOptionResolver,
			) => Promise<APICommandAutocompleteInteractionResponseCallbackData>
		: never;
}
