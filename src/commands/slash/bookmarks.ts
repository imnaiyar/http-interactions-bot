import { ContextType, IntegrationType, type SlashCommand } from "#structures";
import { ApplicationCommandOptionType, ButtonStyle, MessageFlags } from "@discordjs/core/http-only";
import toml from "toml";
import fs from "node:fs";
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from "@discordjs/builders";
import tomlify from "tomlify";
export default {
  data: {
    name: "bookmarks",
    description: "get yor bookmarks",
    options: [
      {
        name: "get",
        type: ApplicationCommandOptionType.Subcommand,
        description: "get your bookmarks",
        options: [
          {
            name: "keyword",
            description: "bookmark keywords",
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true,
          },
          {
            name: "hide",
            description: "hides the response",
            type: ApplicationCommandOptionType.Boolean,
            required: false,
          },
        ],
      },
      {
        name: "delete",
        type: ApplicationCommandOptionType.Subcommand,
        description: "get your bookmarks",
        options: [
          {
            name: "keyword",
            description: "bookmark keywords",
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true,
          },
          {
            name: "hide",
            description: "hides the response",
            type: ApplicationCommandOptionType.Boolean,
          },
        ],
      },
    ],
    integration_types: [IntegrationType.Users],
    contexts: [ContextType.BotDM, ContextType.Guild, ContextType.PrivateChannels],
  },
  async run(app, interaction, options) {
    const value = options.getString("keyword");
    const sub = options.getSubcommand();
    if (!value || value === "null") {
      return void (await app.api.interactions.reply(interaction.id, interaction.token, {
        content: "Invalid Keyword: No bookmarks found with that keyword",
        flags:
                hide === null
                    ? app.ephemeral
                    : hide
                    ? MessageFlags.Ephemeral
                    : undefined
      }));
    }
    const hide = options.getBoolean("hide");
    const userId = interaction.user?.id ?? interaction.member!.user.id;
    const parsed: Bookmarks = toml.parse(fs.readFileSync("bookmarks.toml", "utf8"));
    switch (sub) {
      case "get": {
        const data = parsed[userId][value];
        if (!data) {
          return void (await app.api.interactions.reply(interaction.id, interaction.token, {
            content: "Invalid Keyword: No bookmarks found with that keyword",
            flags:
                hide === null
                    ? app.ephemeral
                    : hide
                    ? MessageFlags.Ephemeral
                    : undefined
          }));
        }
        const embed = new EmbedBuilder()
          .setTitle(`${data.username} Message`)
          .setDescription(`${data.content}`)
          .setFooter({ text: `Requested by ${interaction.member?.user.id ?? interaction.user!.id}` });
        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Link").setURL(data.url),
        );
        await app.api.interactions.reply(interaction.id, interaction.token, {
          embeds: [embed.toJSON()],
          components: [buttons.toJSON()],
          flags:
                hide === null
                    ? app.ephemeral
                    : hide
                    ? MessageFlags.Ephemeral
                    : undefined
        });
        break;
      }
      case "delete": {
        if (!parsed[userId][value]) {
          return void (await app.api.interactions.reply(interaction.id, interaction.token, {
            content: "Invalid Keyword: No bookmark found with that keyword",
            flags: MessageFlags.Ephemeral,
          }));
        }
        const embed = new EmbedBuilder()
          .setTitle(`Are you sure you want to delete this?`)
          .setDescription(
            `**Message**\n${parsed[userId][value].content.substring(0, 2000)}\n\nAuthor: ${parsed[userId][value].username}`,
          )
          .setColor(0xff0000)
          .toJSON();
        const buttons = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder().setCustomId("yes").setLabel("Yes").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("no").setLabel("No").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setLabel("Message Link").setStyle(ButtonStyle.Link).setURL(parsed[userId][value].url),
          )
          .toJSON();
        app.api.interactions.reply(interaction.id, interaction.token, {
          embeds: [embed],
          components: [buttons],
          flags:
                hide === null
                    ? app.ephemeral
                    : hide
                    ? MessageFlags.Ephemeral
                    : undefined
        });
        const collector = new app.collector(app, {
          filter: (init) =>
            ((init.user?.id ?? init.member!.user.id) === userId && init.data.custom_id === "yes") || init.data.custom_id === "no",
          timeout: 60_000,
          max: 1,
        });
        collector.on("collect", async (int) => {
          const id = int.data.custom_id;
          switch (id) {
            case "yes": {
              delete parsed[userId][value];
              fs.writeFileSync("bookmarks.toml", tomlify(parsed, { delims: false }));
              app.api.interactions.updateMessage(int.id, int.token, {
                content: "Bookmark Deleted",
                embeds: [],
                components: [],
              });
              break;
            }
            case "no": {
              app.api.interactions.updateMessage(int.id, int.token, {
                content: "Canceled deletion",
                components: [],
              });
            }
          }
        });
        collector.on("end", async (_collected, reason) => {
          if (reason === "timeout") {
            app.api.interactions.editReply(interaction.application_id, interaction.token, {
              content: "Canceled! Timed Out.",
              embeds: [],
              components: [],
            });
          }
        });
      }
    }
  },
  async autocomplete(app, interaction, options) {
    try {
      const op = options.getFocusedOption();
      const value = op.value as string;
      if (!fs.existsSync("bookmarks.toml")) return;
      const tomlString = fs.readFileSync("bookmarks.toml", "utf8");
      const str = toml.parse(tomlString);
      const parsed: Bookmark = str[interaction.member?.user.id ?? interaction.user!.id];

      if (!parsed) {
        await app.api.interactions.createAutocompleteResponse(interaction.id, interaction.token, {
          choices: [
            {
              name: "No saved bookmarks",
              value: "null",
            },
          ],
        });
        return;
      }
      let data = Object.values(parsed)
        .filter(
          (v) =>
            v.authorId.toLocaleLowerCase().includes(value.toLocaleLowerCase()) ||
            v.content.toLocaleLowerCase().includes(value.toLocaleLowerCase()) ||
            v.url.toLocaleLowerCase().includes(value.toLocaleLowerCase()) ||
            v.username.toLocaleLowerCase().includes(value.toLocaleLowerCase()) ||
            v.messageId.toLocaleLowerCase().includes(value.toLocaleLowerCase()),
        )
        .map((v) => ({
          name: `${v.username}: ${v.content.substring(0, 40)}...`,
          value: v.messageId.toString(),
        }));
      app.api.interactions.createAutocompleteResponse(interaction.id, interaction.token, {
        choices: data,
      });
    } catch (err) {
      app.api.interactions.createAutocompleteResponse(interaction.id, interaction.token, {
        choices: [{ name: "Something went wrong", value: "wrong" }],
      });
      console.error(err);
    }
  },
} satisfies SlashCommand<true>;
interface Bookmarks {
  [key: string]: Bookmark;
}
interface Bookmark {
  [key: string]: {
    authorId: string;
    content: string;
    url: string;
    username: string;
    messageId: string;
    guildId?: string;
  };
}
