import { formatUserInfo } from "#utils";
import type { ContextMenu } from "#structures";
import { postToHaste } from "#src/utils/index";
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
    await app.api.interactions.defer(interaction.id, interaction.token, {
      flags: app.ephemeral
    });
    const formatted = formatWithOptions({ depth: 5 }, "%O", target);
    let toRespond = `\`\`\`js\n${formatted}\`\`\``
    if (formatted.length >= 2000) {
      toRespond = await postToHaste(formatted);
    }
    await app.api.interactions.editReply(interaction.application_id, interaction.token, {
      content: toRespond,
    });
  },
} satisfies ContextMenu<"Message">;
