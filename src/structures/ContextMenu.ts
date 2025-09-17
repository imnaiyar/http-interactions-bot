import type {
  APIMessageApplicationCommandInteraction,
  APIUserApplicationCommandInteraction,
  ApplicationCommandType,
} from "@discordjs/core/http-only";
import type { ContextType, IntegrationType } from "./index";
import type { Bot } from "@/bot";
import type { InteractionOptionResolver } from "@sapphire/discord-utilities";

export interface ContextMenu<T extends "User" | "Message"> {
  data: {
    name: string;
    type: T extends "User" ? typeof ApplicationCommandType.User : typeof ApplicationCommandType.Message;
    integration_types: IntegrationType[];
    contexts: ContextType[];
  };
  ownerOnly?: boolean;
  run: (
    app: Bot,
    interaction: T extends "User" ? APIUserApplicationCommandInteraction : APIMessageApplicationCommandInteraction,
    options: InteractionOptionResolver,
  ) => Promise<void>;
}
