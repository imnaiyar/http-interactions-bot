import { formatUserInfo } from "#src/utils/index";
import type { SlashCommand } from "#structures";
import { ApplicationCommandOptionType } from "@discordjs/core";
export default {
  data: {
    name: "userinfo",
    description: "info about a user",
    options: [
      {
        name: "user",
        description: "the user",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
    integration_types: [1],
    contexts: [0, 1, 2],
  },
  async run(app, interaction, options) {
    await app.api.interactions.defer(interaction.id, interaction.token, { flags: app.ephemeral });
    const member = options.getMember("user");
    const targetUser = options.getUser("user")!;
    // prettier-ignore
    const embed = formatUserInfo( member ?? undefined, targetUser, interaction, app);
    await app.api.interactions.editReply(interaction.application_id, interaction.token, {
      embeds: [embed.toJSON()],
      flags: app.ephemeral,
    });
  },
} satisfies SlashCommand;
