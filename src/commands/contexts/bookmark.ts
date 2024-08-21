import { ContextType, IntegrationType, type ContextMenu } from "#structures";
import { ApplicationCommandType } from "@discordjs/core/http-only";
import fs from "node:fs";
import toml from "toml";
import tomlify from "tomlify";
import { messageLink } from "@discordjs/formatters";
export default {
  data: {
    name: "Bookmark",
    type: ApplicationCommandType.Message,
    integration_types: [IntegrationType.Users],
    contexts: [ContextType.BotDM, ContextType.Guild, ContextType.PrivateChannels],
  },
  async run(app, interaction, options) {
    let bookmarks: any = {};
    if (fs.existsSync("bookmarks.toml")) {
      const tomlString = fs.readFileSync("bookmarks.toml", "utf8");
      bookmarks = toml.parse(tomlString);
    }
    const message = options.getTargetMessage();
    const content = message.content;
    const authorId = interaction.member?.user.id ?? interaction.user!.id;
    const username = message.author.username;
    const guildId = interaction.guild_id;
    const url = messageLink(message.channel_id, message.id, interaction.guild_id ?? "@me");
    if (!bookmarks[authorId]) bookmarks[authorId] = {};
    if (bookmarks[authorId][message.id]) {
      await app.api.interactions.reply(interaction.id, interaction.token, {
        content: "This message is already bookmarked",
        flags: app.ephemeral,
      });
      return;
    }
    bookmarks[authorId][message.id] = {
      content,
      authorId,
      username,
      url,
      messageId: message.id,
      ...(guildId && { guildId }),
    };
    fs.writeFileSync("bookmarks.toml", tomlify(bookmarks, { delims: false }));
    await app.api.interactions.reply(interaction.id, interaction.token, {
      content: "Bookmark saved!",
      flags: app.ephemeral,
    });
  },
} satisfies ContextMenu<"Message">;
