import type { ContextMenu } from "#structures";
import { ApplicationCommandType } from "@discordjs/core/http-only";
import { format } from "prettier";
import { truncate } from "#utils";
import { codeBlock } from "@discordjs/formatters";

const NO_CODE_RESPONSE = {
  content: "There is no code to format here.",
} as const;

const DISCORD_MAX_LENGTH_MESSAGE = 2_000 as const;

export default {
  data: {
    name: "Prettify",
    type: ApplicationCommandType.Message,
    contexts: [0, 1, 2],
    integration_types: [0, 1],
  },
  async run(app, interaction, options) {
    const message = options.getTargetMessage();
    await app.api.interactions.defer(interaction.id, interaction.token, { flags: app.ephemeral });
    const content = message.content;
    if (!content) {
      await app.api.interactions.editReply(interaction.application_id, interaction.token, NO_CODE_RESPONSE);
      return;
    }

    const matches = content.matchAll(/```(?<lang>\w*)\n?(?<code>.+?)\n?```/gs);
    const results: { code: string; lang?: string }[] = [];

    for (const match of matches) {
      const code = match.groups?.code;
      if (!code) {
        continue;
      }

      try {
        const lang = match.groups?.lang ?? "ts";
        const formattedCode = await format(code, {
          printWidth: 120,
          useTabs: true,
          quoteProps: "as-needed",
          trailingComma: "all",
          endOfLine: "lf",
          semi: true,
          singleQuote: true,
          filepath: `code.${lang}`,
        });
        results.push({ code: formattedCode, lang });
      } catch (_error) {
        const error = _error as Error;
        results.push({ code: error.message });
      }
    }

    if (!results.length) {
      await app.api.interactions.editReply(interaction.application_id, interaction.token, NO_CODE_RESPONSE);
      return;
    }

    const shortened = truncate(
      results.map(({ code, lang }) => codeBlock(lang ?? "", code)).join(""),
      DISCORD_MAX_LENGTH_MESSAGE - 12,
    );
    const suffixCodeBlockLength = shortened
      .slice(-3)
      .split("")
      .filter((char) => char === "`").length;

    await app.api.interactions.editReply(interaction.application_id, interaction.token, {
      content: `${shortened}${"`".repeat(3 - suffixCodeBlockLength)}`,
    });
  },
} satisfies ContextMenu<"Message">;
