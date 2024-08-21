import { formatUserInfo } from "#utils";
import type { ContextMenu } from "#structures";
import { ApplicationCommandType } from "@discordjs/core/http-only";
import { formatWithOptions } from "node:util";
export default {
  data: {
    name: "Message Info",
    type: ApplicationCommandType.Message,
    integration_types: [1],
    contexts: [0, 1, 2],
  },
  async run(app, interaction, options) {
    const target = options.getTargetMessage();
    await app.api.interactions.reply(interaction.id, interaction.token, {
      content: `\`\`\`js\n${formatWithOptions({ depth: 5 }, "%O", targetMessage).slice(0, 1990)}\`\`\``,
      flags: app.ephemeral,
    });
  },
} satisfies ContextMenu<"Message">;
