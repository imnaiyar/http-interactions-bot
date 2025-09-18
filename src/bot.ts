import {
  type APIInteraction,
  type APIApplicationCommandAutocompleteInteraction,
  type APIApplicationCommandInteraction,
  ApplicationCommandType,
  type APIChatInputApplicationCommandInteraction,
  type APIContextMenuInteraction,
  MessageFlags,
  type APIChannel,
  type APIDMChannel,
  type APIInteractionResponseCallbackData,
  type Snowflake,
  type APIMessageComponentInteraction,
  type APIModalSubmitInteraction,
} from "discord-api-types/v10";
import { Collection } from "@discordjs/collection";
import { InteractionOptionResolver } from "@sapphire/discord-utilities";
import { InteractionResponseType } from "discord-interactions";
import { EventEmitter } from "node:events";

import type { ContextMenu, SlashCommand } from "@/structures";
import { loadSlash, loadContext, validate } from "@/handlers";
import { handleReminders } from "@/handlers";
import { Collector } from "@/utils/index";
import config from "@/config";
import { DiscordAPI, type RawFile } from "@/services/discord";

type RepliableInteractions = Exclude<APIInteraction, APIApplicationCommandAutocompleteInteraction>;

export class Bot extends EventEmitter {
  public slash: Collection<string, SlashCommand> = new Collection();
  public contexts: Collection<string, ContextMenu<"User" | "Message">> = new Collection();
  public collector = Collector;
  public config = config;
  public channels = new Collection<string, APIChannel | APIDMChannel>();
  public api: DiscordAPI;
  public ephemeral: MessageFlags | undefined = MessageFlags.Ephemeral;
  public env: Env;

  constructor(env: Env) {
    super();
    this.env = env;
    this.api = new DiscordAPI(env);
    this.init();
  }

  private async init() {
    try {
      // Load commands - we'll need to modify this for Workers
      const sCommands = await loadSlash("commands/slash");
      const contexts = await loadContext("commands/contexts");
      this.slash = sCommands;
      this.contexts = contexts;

      // Log bot user
      const user = await this.api.getUser(this.env.DISCORD_CLIENT_ID);
      console.log("Bot initialized as:", user.username);
    } catch (error) {
      console.error("Failed to initialize bot:", error);
    }
  }

  async handleApplicationCommand(interaction: APIApplicationCommandInteraction): Promise<Response> {
    const options = new InteractionOptionResolver(interaction as any);

    if (interaction.data.type === ApplicationCommandType.ChatInput) {
      const commandName = interaction.data.name;
      const command = this.slash.get(commandName);
      const isValid = validate(this, interaction, command);
      if (!isValid) {
        return new Response("Unauthorized", { status: 403 });
      }

      try {
        await command!.run(this, interaction as unknown as APIChatInputApplicationCommandInteraction, options);
        // Return empty response since Discord API calls handle the response
        return new Response(null, { status: 200 });
      } catch (err) {
        console.error("Command execution error:", err);
        return new Response("Internal error", { status: 500 });
      }
    }

    if (interaction.data.type === ApplicationCommandType.Message || interaction.data.type === ApplicationCommandType.User) {
      const command = this.contexts.get(interaction.data.name);
      const isValid = validate(this, interaction, command);
      if (!isValid) {
        return new Response("Unauthorized", { status: 403 });
      }

      try {
        await command!.run(this, interaction as unknown as APIContextMenuInteraction, options);
        return new Response(null, { status: 200 });
      } catch (err) {
        console.error("Context command execution error:", err);
        return new Response("Internal error", { status: 500 });
      }
    }

    return new Response("Unknown command type", { status: 400 });
  }

  async handleAutocomplete(interaction: APIApplicationCommandAutocompleteInteraction): Promise<Response> {
    const command = this.slash.get(interaction.data.name) as unknown as SlashCommand<true>;
    if (!command) {
      return new Response(
        JSON.stringify({
          type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
          data: { choices: [{ name: "No command found! Something went wrong", value: null }] },
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const options = new InteractionOptionResolver(interaction as any);
    try {
      const run = command.autocomplete!;
      await run(this, interaction, options);
      return new Response(null, { status: 200 });
    } catch (err) {
      console.error("Autocomplete error:", err);
      return new Response("Internal error", { status: 500 });
    }
  }

  async handleMessageComponent(interaction: APIMessageComponentInteraction): Promise<Response> {
    const userId = interaction.data.custom_id.split(";")[1];
    if (!userId) {
      return new Response("Invalid component", { status: 400 });
    }

    if (userId !== (interaction.member?.user || interaction.user!).id) {
      await this.reply(interaction, {
        content: "This is not your interaction. Nice try tho Haha!!",
        flags: 64,
      });
    }

    return new Response(null, { status: 200 });
  }

  async handleModalSubmit(interaction: APIModalSubmitInteraction): Promise<Response> {
    // Handle modal submissions here
    console.log("Modal submit received:", interaction.data.custom_id);
    return new Response(null, { status: 200 });
  }

  async handleScheduledReminders(): Promise<void> {
    try {
      await handleReminders(this);
    } catch (error) {
      console.error("Error handling scheduled reminders:", error);
    }
  }

  /** Reply to the given interaction */
  public reply(interaction: RepliableInteractions, data: APIInteractionResponseCallbackData & { files?: RawFile[] }) {
    return this.api.replyToInteraction(interaction.id, interaction.token, data);
  }

  /** Edit the reply to the given interaction */
  public editReply(
    interaction: RepliableInteractions,
    data: APIInteractionResponseCallbackData & { files?: RawFile[] },
    messageId: Snowflake = "@original",
  ) {
    return this.api.editInteractionReply(interaction.application_id, interaction.token, data, messageId);
  }

  /** Update this interactions Message */
  public update(
    interaction: APIMessageComponentInteraction | APIModalSubmitInteraction,
    data: APIInteractionResponseCallbackData & { files?: RawFile[] },
  ) {
    return this.api.updateInteractionMessage(interaction.id, interaction.token, data);
  }

  /** Delete the reply to this interaction */
  public deleteReply(interaction: RepliableInteractions, messageId: Snowflake = "@original") {
    return this.api.deleteInteractionReply(interaction.application_id, interaction.token, messageId);
  }

  /** Create a follow up response to this interaction */
  public followUp(interaction: RepliableInteractions, data: APIInteractionResponseCallbackData & { files?: RawFile[] }) {
    return this.api.followUpInteraction(interaction.application_id, interaction.token, data);
  }
}
