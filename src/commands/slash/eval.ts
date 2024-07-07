import { IntegrationType, type SlashCommand } from "#structures";
import { codeBlock, EmbedBuilder } from "@discordjs/builders";
import { ApplicationCommandOptionType, MessageFlags } from "@discordjs/core";
import { Stopwatch } from "@sapphire/stopwatch";
import { postToHaste } from "#src/utils/index";
import util from "node:util";
export default {
  data: {
    name: "eval",
    description: "evaluate",
    options: [
      {
        name: "exp",
        description: "expression to evaluate",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "async",
        description: "eval an async expression",
        type: ApplicationCommandOptionType.Boolean,
      },
      {
        name: "haste",
        description: "paste the result to haste",
        type: ApplicationCommandOptionType.Boolean,
      },
      {
        name: "depth",
        description: "depth of the output",
        type: ApplicationCommandOptionType.String,
      },
      {
        name: "hide",
        description: "hide the response",
        type: ApplicationCommandOptionType.Boolean,
      },
    ],
    integration_types: [IntegrationType.Users],
    contexts: [1, 0, 2],
  },
  ownerOnly: true,
  async run(app, interaction, options) {
    let code = options.getString("exp")!;
    const async = options.getBoolean("async");
    const haste = options.getBoolean("haste") || false;
    const hide = options.getBoolean("hide");
    await app.api.interactions.defer(interaction.id, interaction.token, {
        flags: hide ? MessageFlags.Ephemeral : app.ephemeral,
       });
    if (async) code = `(async () => { ${code} })()`;
    const dp = options.getString("depth") || "0";
    const regex = /^\d+$|^Infinity$|^null$/;

    const match = dp.match(regex);
    if (code.includes("process.env")) {
      return void (await app.api.interactions.editReply(interaction.application_id, interaction.token, {
        content: "You cannot evaluate an expression that may expose secrets",
      }));
    }
    if (!match) {
      return void (await app.api.interactions.reply(interaction.id, interaction.token, {
        content: `${dp} is not a valid depth`,
      }));
    }
    let result;
    try {
      const time = new Stopwatch().start();
      const output = await eval(code);
      time.stop();
      result = await buildSuccessResponse(output, time.toString(), haste, parseInt(dp), code);
    } catch (err) {
      console.error(err);
      result = buildErrorResponse(err);
    }
    await app.api.interactions.editReply(interaction.application_id, interaction.token, result);
  },
} satisfies SlashCommand;

const buildSuccessResponse = async (output: any, time: string, haste: boolean, depth: number, input: any) => {
  // Token protection
  output = util
    .inspect(output, { depth: depth })
    .replaceAll(process.env.TOKEN!, "~~REDACTED~~")
    .replaceAll(/token:\s*'.*?'/g, "token: '~~REDACTED--'");
  let embOutput;

  if (!haste && output.length <= 2048) {
    embOutput = codeBlock("js", output);
  } else {
    embOutput = await postToHaste(output);
  }
  const embed = new EmbedBuilder()
    .setAuthor({ name: "📤 Output" })
    .setDescription(`**Input**\n\n` + codeBlock(input) + "\n**Output**\n\n" + embOutput)
    .setColor(0x2c9438)
    .setFooter({
      text: `⏱️ Took ${time}`,
    })
    .setTimestamp(Date.now());

  return { embeds: [embed.toJSON()] };
};

const buildErrorResponse = (err: any) => {
  const embed = new EmbedBuilder()
    .setAuthor({ name: "📤 Error" })
    .setDescription("```js\n" + (err.length > 4096 ? `${err.substr(0, 4000)}...` : err) + "\n```")
    .setColor(0xff0000)
    .setTimestamp();

  return { embeds: [embed.toJSON()] };
};
