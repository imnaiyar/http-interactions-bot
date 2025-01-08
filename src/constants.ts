import { ApplicationCommandOptionType } from "@discordjs/core";

export const HIDE_OPTIONS = {
  name: "hide",
  description: "hide the response",
  type: ApplicationCommandOptionType.Boolean as const,
};
