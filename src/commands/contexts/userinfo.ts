import { formatUserInfo } from "@/utils";
import type { ContextMenu } from "@/structures";
import { ApplicationCommandType } from "discord-api-types/v10";
export default {
  data: {
    name: "Author Info",
    type: ApplicationCommandType.Message,
    integration_types: [1],
    contexts: [0, 1, 2],
  },
  async run(app, interaction, options) {
    await app.api.deferInteraction(interaction.id, interaction.token, { flags: app.ephemeral });
    const message = options.getTargetMessage();
    const targetUser = await app.api.getUser(message.author.id);
    // prettier-ignore
    const member = interaction.guild_id && (await app.api.getGuildMember(interaction.guild_id, message.author.id).catch(() => {}))
    const embed = formatUserInfo((member && member) || undefined, targetUser, interaction, app);
    await app.api.editInteractionReply(interaction.application_id, interaction.token, {
      embeds: [embed.toJSON() as any],
      flags: app.ephemeral,
    });
  },
} satisfies ContextMenu<"Message">;
