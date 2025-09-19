import { ContextType, IntegrationType, type SlashCommand } from "@/structures";
import { MessageFlags } from "discord-api-types/v10";
import { ApplicationCommandOptionType } from "discord-api-types/v10";
import { DiscordSnowflake as Snowflake } from "@sapphire/snowflake";

export default {
  data: {
    name: "ping",
    description: "replies with simple ping",
    options: [
      {
        name: "hide",
        description: "hide the response",
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
    ],
    integration_types: [IntegrationType.Users],
    contexts: [ContextType.BotDM, ContextType.Guild, ContextType.PrivateChannels],
  },
  async run(app, interaction, options) {
    const timestamp = Snowflake.timestampFrom(interaction.id);
    const hide = options.getBoolean("hide");
    await app.api.replyToInteraction(interaction.id, interaction.token, {
      content: `Pong! ${Date.now() - timestamp}ms`,
      ...(hide && {
        flags: MessageFlags.Ephemeral,
      }),
    });
  },
} satisfies SlashCommand;
