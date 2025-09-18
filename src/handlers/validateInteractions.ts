import { MessageFlags, type APIApplicationCommandInteraction } from "discord-api-types/v10";
import type { ContextMenu, SlashCommand } from "@/structures";
import type { Bot } from "@/bot";

export const validate = (
  app: Bot,
  interaction: APIApplicationCommandInteraction,
  command: SlashCommand | ContextMenu<"Message" | "User"> | undefined,
) => {
  if (!command) {
    app.api.replyToInteraction(interaction.id, interaction.token, {
      content: "Command not found, something went wrong",
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }
  if (command.ownerOnly && !app.config.OWNERS.includes(interaction.user?.id ?? interaction.member!.user.id)) {
    app.api.replyToInteraction(interaction.id, interaction.token, {
      content: "This command is for owners only",
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }
  return true;
};
