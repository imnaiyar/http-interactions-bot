import type {
  APIMessageApplicationCommandInteraction,
  APIUserApplicationCommandInteraction,
  APIContextMenuInteraction,
  ApplicationCommandType,
} from "@discordjs/core/http-only";
import type { ContextType, IntegrationType } from "#structures";
import App from "#src/app";
import type { InteractionOptionResolver } from "@sapphire/discord-utilities";
export interface ContextMenu<T extends "User" | "Message" | null = null> {
  data: {
    name: string;
    type: T extends "User" ? typeof ApplicationCommandType.User : typeof ApplicationCommandType.Message;
    integration_types: IntegrationType[];
    contexts: ContextType[];
  };
  ownerOnly?: boolean;
  run: (
    app: typeof App,
    interaction: T extends "User"
      ? APIUserApplicationCommandInteraction
      : T extends "Message"
        ? APIMessageApplicationCommandInteraction
        : APIContextMenuInteraction,
    options: InteractionOptionResolver,
  ) => Promise<void>;
}
