import type {
  APIApplicationCommandOption,
  APIChatInputApplicationCommandInteraction,
  APIApplicationCommandAutocompleteInteraction,
} from "@discordjs/core/http-only";
import type { ContextType, IntegrationType } from "#structures";
import App from "#src/app";
import type { InteractionOptionResolver } from "@sapphire/discord-utilities";

export interface SlashCommand<Autocomplete extends boolean = false> {
  data: {
    name: string;
    description: string;
    options?: APIApplicationCommandOption[];
    integration_types: IntegrationType[];
    contexts: ContextType[];
  };
  ownerOnly?: boolean;
  run: (
    app: typeof App,
    interaction: APIChatInputApplicationCommandInteraction,
    options: InteractionOptionResolver,
  ) => Promise<void>;
  autocomplete?: Autocomplete extends true
    ? (
        app: typeof App,
        interaction: APIApplicationCommandAutocompleteInteraction,
        options: InteractionOptionResolver,
      ) => Promise<void>
    : never;
}
