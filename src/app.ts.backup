import "dotenv/config";
import express, { type Response } from "express";
import { InteractionResponseType, verifyKeyMiddleware } from "discord-interactions";
import { handleReminders, loadContext, loadSlash, validate } from "@/handlers";
import { EventEmitter } from "node:events";
import { REST, type RawFile } from "@discordjs/rest";
import config from "@/config";
import {
  API,
  InteractionType,
  type APIInteraction,
  type APIApplicationCommandAutocompleteInteraction,
  type APIApplicationCommandInteraction,
  ApplicationCommandType,
  type APIChatInputApplicationCommandInteraction,
  type APIContextMenuInteraction,
  MessageFlags,
  type APIChannel,
  type APIDMChannel,
  type APIPingInteraction,
  type APIInteractionResponseCallbackData,
  type Snowflake,
  type APIMessageComponentInteraction,
  type APIModalSubmitInteraction,
} from "@discordjs/core/http-only";
import { Collection } from "@discordjs/collection";
import type { ContextMenu, SlashCommand } from "@/structures";
import { InteractionOptionResolver } from "@sapphire/discord-utilities";
import { Collector } from "@/utils/index";
type RepliableInteractions = Exclude<APIInteraction, APIApplicationCommandAutocompleteInteraction | APIPingInteraction>;
export default new (class App extends EventEmitter {
  public server = express();
  public slash: Collection<string, SlashCommand> = new Collection();
  public contexts: Collection<string, ContextMenu<"User" | "Message">> = new Collection();
  public collector = Collector;
  public config = config;
  public channels = new Collection<string, APIChannel | APIDMChannel>();
  public api = new API(new REST().setToken(process.env.TOKEN!));
  public ephemeral: MessageFlags | undefined = MessageFlags.Ephemeral;
  constructor() {
    super();
    this.init();
  }
  async init() {
    const sCommands = await loadSlash("src/commands/slash");
    const contexts = await loadContext("src/commands/contexts");
    this.slash = sCommands;
    this.contexts = contexts;
    this.server.post("/interactions", verifyKeyMiddleware(process.env.PUBLIC_KEY!), async (req, res) => {
      const interaction: APIInteraction = req.body;
      if (interaction.type === InteractionType.Ping) {
        console.log("Ping Recieved!");
        return res.send({ type: InteractionResponseType.PONG });
      }
      this.emit("interaction", interaction);
      if (interaction.type === InteractionType.ApplicationCommand) {
        return await this.handleApplication(interaction);
      }
      if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        return await this.handleAutocomplete(interaction as APIApplicationCommandAutocompleteInteraction, res);
      }
      if (interaction.type === InteractionType.MessageComponent) {
        const userId = interaction.data.custom_id.split(";")[1];
        if (!userId) return;
        if (userId !== (interaction.member?.user || interaction.user!).id) {
          return this.reply(interaction, {
            content: "This is not your interaction. Nice try tho Haha!!",
            flags: 64,
          });
        }
      }
    });
    this.server.listen(this.config.PORT, () => {
      console.log(`Server is running on port ${this.config.PORT}`);
      this.api.users.get(process.env.CLIENT_ID!).then((u) => console.log("Logged in as " + u.username));
    });
    setInterval(() => {
      handleReminders(this);
    }, 1_000);
  }
  private async handleApplication(interaction: APIApplicationCommandInteraction) {
    // @ts-ignore
    const options = new InteractionOptionResolver(interaction);
    if (interaction.data.type === ApplicationCommandType.ChatInput) {
      const commandName = interaction.data.name;
      const command = this.slash.get(commandName);
      const isValid = validate(this, interaction, command);
      if (!isValid) return;
      try {
        await command!.run(this, interaction as unknown as APIChatInputApplicationCommandInteraction, options);
      } catch (err) {
        console.error(err);
      }
    }
    if (interaction.data.type === ApplicationCommandType.Message || interaction.data.type === ApplicationCommandType.User) {
      const command = this.contexts.get(interaction.data.name);
      const isValid = validate(this, interaction, command);
      if (!isValid) return;
      try {
        await command!.run(this, interaction as unknown as APIContextMenuInteraction, options);
      } catch (err) {
        console.error(err);
      }
    }
  }
  private async handleAutocomplete(interaction: APIApplicationCommandAutocompleteInteraction, res: Response) {
    const command = this.slash.get(interaction.data.name) as unknown as SlashCommand<true>;
    if (!command) {
      res.send({
        type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
        data: { choices: [{ name: "No command found! SOmething went wrong", value: null }] },
      });
    }
    // @ts-ignore
    const options = new InteractionOptionResolver(interaction);
    try {
      const run = command.autocomplete!;
      await run(this, interaction, options);
    } catch (err) {
      console.error(err);
    }
  }

  /** Reply to the given interaction */
  public reply(interaction: RepliableInteractions, data: APIInteractionResponseCallbackData & { files?: RawFile[] }) {
    return this.api.interactions.reply(interaction.id, interaction.token, data);
  }

  /** Edit the reply to the given interaction */
  public editReply(
    interaction: RepliableInteractions,
    data: APIInteractionResponseCallbackData & { files?: RawFile[] },
    messageId: Snowflake = "@original",
  ) {
    return this.api.interactions.editReply(interaction.application_id, interaction.token, data, messageId);
  }

  /** Update this interactions Message */
  public update(
    interaction: APIMessageComponentInteraction | APIModalSubmitInteraction,
    data: APIInteractionResponseCallbackData & { files?: RawFile[] },
  ) {
    return this.api.interactions.updateMessage(interaction.id, interaction.token, data);
  }

  /** Delete the reply to this interaction */
  public deleteReply(interaction: RepliableInteractions, messageId: Snowflake = "@original") {
    return this.api.interactions.deleteReply(interaction.application_id, interaction.token, messageId);
  }

  /** Create a follow up response to this interaction */
  public followUp(interaction: RepliableInteractions, data: APIInteractionResponseCallbackData & { files?: RawFile[] }) {
    return this.api.interactions.followUp(interaction.application_id, interaction.token, data);
  }
})();

process.on("uncaughtException", console.log);
process.on("unhandledRejection", console.log);
