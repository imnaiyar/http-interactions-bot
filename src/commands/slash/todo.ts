import { ContextType, IntegrationType, type SlashCommand } from "#structures";
import { ApplicationCommandOptionType, ButtonStyle, ComponentType, MessageFlags } from "@discordjs/core/http-only";
import toml from "toml";
import fs from "node:fs";
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder, time } from "@discordjs/builders";
import tomlify from "tomlify";
export default {
  data: {
    name: "todo",
    description: "manage todo list",
    options: [
      {
        name: "get",
        type: ApplicationCommandOptionType.Subcommand,
        description: "get your todo list",
        options: [
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
        description: "delete a todo",
        options: [
          {
            name: "keyword",
            description: "the todo to delete",
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
      {
        name: "create",
        type: ApplicationCommandOptionType.Subcommand,
        description: "create a todo",
        options: [
          {
            name: "description",
            description: "description of the todo",
            type: ApplicationCommandOptionType.String,
            required: true,
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
    const sub = options.getSubcommand();
    const hide = options.getBoolean("hide");

    const userId = interaction.user?.id ?? interaction.member!.user.id;
    if (!fs.existsSync("todos.toml")) fs.writeFileSync("todos.toml", tomlify({}, { delims: false }));
    const parsed: TODOs = toml.parse(fs.readFileSync("todos.toml", "utf8"));
    const data = parsed[userId];
    switch (sub) {
      case "get": {
        if (!data) {
          return void (await app.api.interactions.reply(interaction.id, interaction.token, {
            content: "Invalid: No TODOs found",
            flags: hide === null ? app.ephemeral : hide ? MessageFlags.Ephemeral : undefined,
          }));
        }

        let index = 0;

        const arr = Object.entries(data);
        const total = arr.length;
        const getList = () => {
          const list = arr.slice(index, index + 5);
          let description = "List";
          if (!list.length) description = "You do not have any TODO list, create Some!";

          const fields = list.map(([_k, todo]) => ({
            name: `[${todo.status === "Completed" ? "✓" : " "}]. ${
              todo.status === "Completed" ? `~~${todo.description}~~` : todo.description
            }`,
            value: `-# Status: ${todo.status}\n-# Created At: ${time(new Date(todo.createdAt), "d")}${
              todo.completedAt ? `\n-# Completed At: ${time(new Date(todo.completedAt), "d")}` : ""
            }`,
            inline: true,
          }));
          const embed = new EmbedBuilder()
            .setTitle(`Your TODOs`)
            .setAuthor({ name: `${interaction.user?.username ?? interaction.member?.user.username} TODOs` })
            .setDescription(description)
            .setFooter({ text: `Page ${index / 5 + 1}/${Math.ceil(total / 5)}` })
            .setColor(0x00ff00)
            .toJSON();

          if (fields.length) embed.fields = fields;

          const row = list.length
            ? new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                  new StringSelectMenuBuilder()
                    .setCustomId("mark_todo_complete")
                    .setPlaceholder("Mark Completed")
                    .setMinValues(0)
                    .setMaxValues(list.length)
                    .addOptions(
                      list.map(([k, todo]) => ({
                        label: todo.description.slice(0, 100),
                        value: k,
                        default: todo.status === "Completed",
                      })),
                    ),
                )
                .toJSON()
            : null;
          const btns = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("todo_prev")
                .setLabel("Prev")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(index <= 0),
              new ButtonBuilder()
                .setCustomId("todo_next")
                .setLabel("Next")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(index + 5 >= total),
            )
            .toJSON();
          return { embeds: [embed], components: row ? [row, btns] : [btns] };
        };
        await app.api.interactions.reply(interaction.id, interaction.token, {
          flags: hide === null ? app.ephemeral : hide ? MessageFlags.Ephemeral : undefined,
          ...getList(),
        });
        const collector = new app.collector(app, {
          idle: 60_000,
        });
        collector.on("collect", async (int) => {
          if (int.data.custom_id === "todo_next") {
            index >= total ? (index = total - 1) : (index += 5);
          } else if (int.data.custom_id === "todo_prev") {
            index <= 0 ? (index = 0) : (index -= 5);
          } else if (int.data.component_type === ComponentType.StringSelect && int.data.custom_id === "mark_todo_complete") {
            const values = int.data.values;
            for (const [k] of arr.slice(index, index + 5)) {
              if (values.includes(k)) {
                parsed[userId][k].status = "Completed";
                parsed[userId][k].completedAt = new Date().toISOString();
              } else {
                parsed[userId][k].status = "Pending";
                delete parsed[userId][k].completedAt;
              }
            }
            fs.writeFileSync("todos.toml", tomlify(parsed, { delims: false }));
          }
          await app.api.interactions.updateMessage(int.id, int.token, {
            ...getList(),
          });
        });
        break;
      }
      case "delete": {
        const keyword = options.getString("keyword", true);
        if (!data?.[keyword]) {
          return void (await app.api.interactions.reply(interaction.id, interaction.token, {
            content: "Invalid: No TODOs found",
            flags: hide === null ? app.ephemeral : hide ? MessageFlags.Ephemeral : undefined,
          }));
        }
        delete parsed[userId][keyword];
        fs.writeFileSync("todos.toml", tomlify(parsed, { delims: false }));
        return void (await app.api.interactions.reply(interaction.id, interaction.token, {
          content: "Deleted TODO",
          flags: hide === null ? app.ephemeral : hide ? MessageFlags.Ephemeral : undefined,
        }));
      }
      case "create": {
        const description = options.getString("description", true);
        const todo = {
          authorId: userId,
          description,
          createdAt: new Date().toISOString(),
          status: "Pending" as const,
        };
        parsed[userId] = { ...parsed[userId], [Math.random().toString(36).slice(2)]: todo };
        fs.writeFileSync("todos.toml", tomlify(parsed, { delims: false }));
        return void (await app.api.interactions.reply(interaction.id, interaction.token, {
          embeds: [
            {
              author: { name: "Created TODO!" },
              description: todo.description + `\n-# ${todo.status}\n-# ${time(new Date(todo.createdAt), "d")}`,
            },
          ],
          flags: hide === null ? app.ephemeral : hide ? MessageFlags.Ephemeral : undefined,
        }));
      }
    }
  },
  async autocomplete(app, int, opt) {
    const sub = opt.getSubcommand();
    if (sub !== "delete") return;
    const userId = int.user?.id ?? int.member!.user.id;
    if (!fs.existsSync("todos.toml")) fs.writeFileSync("todos.toml", tomlify({}, { delims: false }));
    const parsed: TODOs = toml.parse(fs.readFileSync("todos.toml", "utf8"));
    const data = parsed[userId];
    let choices = data
      ? Object.entries(data).map(([k, v]) => ({ name: v.description.slice(0, 50), value: k }))
      : [{ name: "No TODOs found", value: "none" }];
    if (!choices.length) choices = [{ name: "No TODOs found", value: "none" }];
    return void (await app.api.interactions.createAutocompleteResponse(int.id, int.token, {
      choices,
    }));
  },
} satisfies SlashCommand<true>;
interface TODOs {
  [key: string]: TODO;
}
interface TODO {
  [key: string]: {
    authorId: string;
    description: string;
    createdAt: string;
    status: "Pending" | "Completed";
    completedAt?: string;
  };
}
