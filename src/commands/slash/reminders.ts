import { ContextType, IntegrationType, type SlashCommand } from "#structures";
import { ApplicationCommandOptionType } from "@discordjs/core/http-only";
import { EmbedBuilder, time } from "@discordjs/builders";
import fs from "node:fs";
import toml from "toml";
import tomlify from "tomlify";
export default {
  data: {
    name: "reminders",
    description: "set a reminder",
    options: [
      {
        name: "text",
        description: "description of the reminder",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "months",
        description: "months until the reminder",
        min_value: 1,
        max_value: 6,
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
      {
        name: "days",
        description: "days until the reminder",
        min_value: 1,
        max_value: 100,
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
      {
        name: "hours",
        description: "hours until the reminder",
        min_value: 1,
        max_value: 500,
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
      {
        name: "minutes",
        description: "minutes until the reminder",
        min_value: 1,
        max_value: 1000,
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
      {
        name: "seconds",
        description: "seconds until the reminder",
        type: ApplicationCommandOptionType.Integer,
        min_value: 5,
        max_value: 1000000,
        required: false,
      },
    ],
    integration_types: [IntegrationType.Users],
    contexts: [ContextType.BotDM, ContextType.Guild, ContextType.PrivateChannels],
  },
  async run(app, interaction, options) {
    await app.api.interactions.defer(interaction.id, interaction.token, { flags: app.ephemeral });
    const text = options.getString("text", true);
    const months = options.getInteger("months", false);
    const days = options.getInteger("days", false);
    const hours = options.getInteger("hours", false);
    const minutes = options.getInteger("minutes", false);
    const seconds = options.getInteger("seconds", false);
    if (!months && !days && !hours && !minutes && !seconds) {
      return void (await app.api.interactions.editReply(interaction.id, interaction.token, {
        content: "You must provide at least one time options.",
      }));
    }
    const dur =
      Date.now() +
      (months || 0) * 30 * 24 * 60 * 60_000 +
      (days || 0) * 24 * 60 * 60_000 +
      (hours || 0) * 60 * 60_000 +
      (minutes || 0) * 60_000 +
      (seconds || 0) * 1_000;

    const embed = new EmbedBuilder()
      .setTitle("Reminders")
      .setDescription(
        `Reminders saved\nText: \`${text}\`\n\nIn: ${time(Math.trunc(dur / 1000), "F")} (${time(Math.trunc(dur / 1000), "R")})`,
      )
      .setColor(0x3cff2e);

    // Handle saving the reminders
    let reminders: Reminders = {};
    if (fs.existsSync("reminders.toml")) {
      const tomlString = fs.readFileSync("reminders.toml", "utf8");
      reminders = toml.parse(tomlString);
    }
    let dmChannel = app.channels.get(interaction.user?.id ?? interaction.member!.user.id);
    if (!dmChannel) {
      dmChannel = await app.api.users.createDM(interaction.user?.id ?? interaction.member!.user.id).then((c) => {
        app.channels.set(interaction.user?.id ?? interaction.member!.user.id, c);
        return c;
      });
    }
    if (!dmChannel) throw new Error("Could not find or create DM channel");
    reminders[interaction.id] = {
      authorId: interaction.user?.id ?? interaction.member!.user.id,
      text,
      time: dur,
      username: interaction.user?.id ?? interaction.member!.user.id,
      setAt: Date.now(),
      dmId: dmChannel.id,
    };
    fs.writeFileSync("reminders.toml", tomlify(reminders, { delims: false }));
    await app.api.interactions.editReply(interaction.application_id, interaction.token, {
      embeds: [embed.toJSON()],
      flags: app.ephemeral,
    });
  },
} satisfies SlashCommand;

export interface Reminders {
  [key: string]: Reminder;
}
export interface Reminder {
  authorId: string;
  text: string;
  time: number;
  username: string;
  setAt: number;
  dmId: string;
}
