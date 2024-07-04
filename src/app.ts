import "dotenv/config";
import express, { type Response } from "express";
import { InteractionResponseType, verifyKeyMiddleware } from "discord-interactions";
import { loadContext, loadSlash, validate } from "#handlers";
import { EventEmitter } from "node:events";
import { REST } from "@discordjs/rest";
import config from "#src/config";
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
} from "@discordjs/core/http-only";
import { Collection } from "@discordjs/collection";
import type { ContextMenu, SlashCommand } from "#structures";
import { InteractionOptionResolver } from "@sapphire/discord-utilities";
import { Collector } from "#src/utils/index";

export default new (class App extends EventEmitter {
  public server = express();
  public slash: Collection<string, SlashCommand> = new Collection();
  public contexts: Collection<string, ContextMenu<"User" | "Message">> = new Collection();
  public collector = Collector;
  public config = config;
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
    });
    this.server.listen(this.config.PORT, () => {
      console.log(`Server is running on port ${this.config.PORT}`);
    });
  }
  async handleApplication(interaction: APIApplicationCommandInteraction) {
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
  async handleAutocomplete(interaction: APIApplicationCommandAutocompleteInteraction, res: Response) {
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
})();

process.on("uncaughtException", console.log);
process.on("unhandledRejection", console.log);
