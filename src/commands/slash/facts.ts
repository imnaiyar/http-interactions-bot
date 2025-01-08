import { ContextType, IntegrationType, type SlashCommand } from "@/structures";
import { MessageFlags } from "@discordjs/core";
import { ApplicationCommandOptionType } from "@discordjs/core/http-only";

export default {
  data: {
    name: "facts",
    description: "get a random useless fact",
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
    const hide = options.getBoolean("hide");
    await app.api.interactions.defer(interaction.id, interaction.token, {
      flags: hide === null ? app.ephemeral : hide ? MessageFlags.Ephemeral : undefined,
    });
    const response = await fetch("https://thefact.space/random");
    const { text, source } = await response.json();
    await app.api.interactions.editReply(interaction.application_id, interaction.token, {
      content: `**Random Fact**\n> ${text}\n-# [Source](<${source}>)`,
    });
  },
} satisfies SlashCommand;
