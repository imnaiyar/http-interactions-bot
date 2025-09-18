import { postToHaste } from "@/utils";
import type { ContextMenu } from "@/structures";
import { ApplicationCommandType } from "discord-api-types/v10";
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
    await app.api.deferInteraction(interaction.id, interaction.token, {
      flags: app.ephemeral,
    });
    const formatted = formatWithOptions({ depth: 5 }, "%O", target);
    let toRespond = `\`\`\`js\n${formatted}\`\`\``;
    if (formatted.length >= 2000) {
      toRespond = await postToHaste(formatted);
    }
    await app.api.editInteractionReply(interaction.application_id, interaction.token, {
      content: toRespond,
    });
  },
} satisfies ContextMenu<"Message">;
