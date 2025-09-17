import { loadContext, loadSlash } from "@/handlers";
import { REST } from "@discordjs/rest";
import type { ContextMenu, SlashCommand } from "@/structures";
import { Routes } from "@discordjs/core/http-only";

// Environment variables for Cloudflare Workers deployment
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || process.env.TOKEN || '';
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || '';

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID environment variables');
  process.exit(1);
}

const contexts = await loadContext("commands/contexts");
const slash = await loadSlash("commands/slash");

const toRegister: (SlashCommand["data"] | ContextMenu<"Message" | "User">["data"])[] = [];
slash
  .map((cmd) => ({
    name: cmd.data.name,
    description: cmd.data.description,
    type: 1,
    options: cmd.data?.options,
    integration_types: cmd.data.integration_types,
    contexts: cmd.data.contexts,
  }))
  .forEach((s) => toRegister.push(s));

contexts
  .map((cmd) => ({
    name: cmd.data.name,
    type: cmd.data.type,
    integration_types: cmd.data.integration_types,
    contexts: cmd.data.contexts,
  }))
  .forEach((s) => toRegister.push(s));

const rest = new REST().setToken(DISCORD_TOKEN);

// Deploy commands
(async () => {
  try {
    console.log(`Started refreshing ${toRegister.length} application (/) commands.`);

    const data: any = await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), { body: toRegister });

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
