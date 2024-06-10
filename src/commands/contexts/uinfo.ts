import { formatUserInfo } from "#libs";
import type { ContextMenu } from "#structures";
import { ApplicationCommandType } from "@discordjs/core/http-only";
export default {
  data: {
    name: "Info",
    type: ApplicationCommandType.User,
    integration_types: [1],
    contexts: [0, 1, 2],
  },
  async run(app, interaction, options) {
    await app.api.interactions.defer(interaction.id, interaction.token, { flags: app.ephemeral });
    const targetUser = await app.api.users.get(interaction.data.target_id);
    const member = options.getTargetMember();
    // prettier-ignore
    const embed = formatUserInfo( member ?? undefined , targetUser, interaction, app);
    await app.api.interactions.editReply(interaction.application_id, interaction.token, {
      embeds: [embed.toJSON()],
      flags: app.ephemeral,
    });
  },
} satisfies ContextMenu<"User">;
