import { MessageFlags, type APIApplicationCommandInteraction } from "@discordjs/core/http-only";
import type { ContextMenu, SlashCommand } from "#structures";
import type App from "#src/app";
export const validate = (
  app: typeof App,
  interaction: APIApplicationCommandInteraction,
  command: SlashCommand | ContextMenu | undefined,
) => {
  if (!command) {
    app.api.interactions.reply(interaction.id, interaction.token, {
      content: "Command not found, something went wrong",
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }
  if (command.ownerOnly && !app.config.OWNERS.includes(interaction.user?.id ?? interaction.member!.user.id)) {
    app.api.interactions.reply(interaction.id, interaction.token, {
      content: "This command is for owners only",
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }
  return true;
};
