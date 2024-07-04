import { formatUserInfo } from "#utils";
import type { ContextMenu } from "#structures";
import { ApplicationCommandType } from "@discordjs/core/http-only";
export default {
  data: {
    name: "Author Info",
    type: ApplicationCommandType.Message,
    integration_types: [1],
    contexts: [0, 1, 2],
  },
  async run(app, interaction, options) {
    await app.api.interactions.defer(interaction.id, interaction.token, { flags: app.ephemeral });
    const message = options.getTargetMessage();
    const targetUser = await app.api.users.get(message.author.id);
    // prettier-ignore
    const member = interaction.guild_id && (await app.api.guilds.getMember(interaction.guild_id, message.author.id).catch(() => {}))
    const embed = formatUserInfo((member && member) || undefined, targetUser, interaction, app);
    await app.api.interactions.editReply(interaction.application_id, interaction.token, {
      embeds: [embed.toJSON()],
      flags: app.ephemeral,
    });
  },
} satisfies ContextMenu<"Message">;
