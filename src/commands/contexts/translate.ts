import { IntegrationType, type ContextMenu } from "@/structures";
import { ApplicationCommandType, type APIEmbed } from "@discordjs/core";
import { translate } from "@vitalets/google-translate-api";
import ISO6391 from "iso-639-1";
export default {
  data: {
    name: "Translate",
    integration_types: [IntegrationType.Users],
    contexts: [0, 1, 2],
    type: ApplicationCommandType.Message,
  },
  async run(app, interaction, options) {
    const message = options.getTargetMessage();
    await app.api.interactions.defer(interaction.id, interaction.token, {
      flags: app.ephemeral,
    });
    const output = await translate(message.content, { to: "en" });
    const inputLang = ISO6391.getName(output.raw.src);
    if (inputLang === ISO6391.getName("en")) {
      return void (await app.api.interactions.editReply(interaction.application_id, interaction.token, {
        content: `The message is already in English.`,
      }));
    }
    const embed: APIEmbed = {
      title: `Translation from ${inputLang} to English`,
      description: output.text,
      fields: [
        {
          name: "Original Message",
          value: message.content,
        },
      ],
    };
    await app.api.interactions.editReply(interaction.application_id, interaction.token, {
      embeds: [embed],
    });
  },
} satisfies ContextMenu<"Message">;
