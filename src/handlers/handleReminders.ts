import type { Reminders } from "#src/commands/slash/reminders";
import toml from "toml";
import fs from "node:fs";
import tomlify from "tomlify";
import { EmbedBuilder } from "@discordjs/builders";
import App from "#src/app";
export default async (app: typeof App) => {
  if (!fs.existsSync("reminders.toml")) return;
  const reminders: Reminders = toml.parse(fs.readFileSync("reminders.toml", "utf8"));
  const keys = Object.keys(reminders);
  for (const k of keys) {
    const { authorId: _userid, time, text, username, setAt, dmId } = reminders[k];

    if (time > Date.now()) continue;
    delete reminders[k];
    fs.writeFileSync("reminders.toml", tomlify(reminders, { delims: false }));

    // Send the reminder

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${username} Reminder` })
      .setTitle("Reminder")
      .setDescription(`You asked me to remind you about: \`${text}\``)
      .setFields({
        name: "Set on",
        value: "<t:" + Math.trunc(Number(setAt) / 1000) + ":F> (<t:" + Math.trunc(Number(setAt) / 1000) + ":R>)",
      });

    await app.api.channels
      .createMessage(dmId, {
        embeds: [embed.toJSON()],
      })
      .catch(console.error);
  }
};
