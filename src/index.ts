/**
 * Welcome to Cloudflare Workers! This is your new worker, you can deploy it to the Cloudflare Edge with Wrangler.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { InteractionResponseType, verifyKey } from "discord-interactions";
import { InteractionType } from "@discordjs/core/http-only";
import type {
  APIInteraction,
  APIApplicationCommandInteraction,
  APIApplicationCommandAutocompleteInteraction,
  APIMessageComponentInteraction,
  APIModalSubmitInteraction,
} from "@discordjs/core/http-only";
import { Bot } from "./bot";

// Initialize bot instance
let botInstance: Bot | null = null;

const getBotInstance = (env: Env): Bot => {
  if (!botInstance) {
    botInstance = new Bot(env);
  }
  return botInstance;
};

async function verifyDiscordRequest(request: Request, env: Env): Promise<boolean> {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const body = await request.clone().text();

  if (!signature || !timestamp) {
    return false;
  }

  return verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
}

async function handleDiscordInteraction(request: Request, env: Env): Promise<Response> {
  // Verify the request is from Discord
  const isValid = await verifyDiscordRequest(request, env);
  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const interaction: APIInteraction = await request.json();
  const bot = getBotInstance(env);

  // Handle ping
  if (interaction.type === InteractionType.Ping) {
    console.log("Ping received!");
    return new Response(JSON.stringify({ type: InteractionResponseType.PONG }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Handle different interaction types
    if (interaction.type === InteractionType.ApplicationCommand) {
      return await bot.handleApplicationCommand(interaction as APIApplicationCommandInteraction);
    }

    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      return await bot.handleAutocomplete(interaction as APIApplicationCommandAutocompleteInteraction);
    }

    if (interaction.type === InteractionType.MessageComponent) {
      return await bot.handleMessageComponent(interaction as APIMessageComponentInteraction);
    }

    if (interaction.type === InteractionType.ModalSubmit) {
      return await bot.handleModalSubmit(interaction as APIModalSubmitInteraction);
    }

    return new Response("Unknown interaction type", { status: 400 });
  } catch (error) {
    console.error("Error handling interaction:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle Discord interactions
    if (url.pathname === "/interactions" && request.method === "POST") {
      return await handleDiscordInteraction(request, env);
    }

    // Handle health check
    if (url.pathname === "/health" && request.method === "GET") {
      return new Response("OK", { status: 200 });
    }

    // Handle other routes
    return new Response("Not found", { status: 404 });
  },

  // Scheduled handler for reminders (optional)
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const bot = getBotInstance(env);
    await bot.handleScheduledReminders();
  },
};
