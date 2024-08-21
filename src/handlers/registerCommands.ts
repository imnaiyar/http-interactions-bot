import { loadContext, loadSlash } from "#handlers/loadCommands";
import { REST } from "@discordjs/rest";
import type { ContextMenu, SlashCommand } from "#structures";
import { Routes } from "@discordjs/core/http-only";

const contexts = await loadContext("src/commands/contexts");
const slash = await loadSlash("src/commands/slash");

const toRegister: SlashCommand["data"] | ContextMenu<"Message" | "User">["data"][] = [];
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
const rest = new REST().setToken(process.env.TOKEN!);

// and deploy your commands!
(async () => {
  try {
    console.log(`Started refreshing ${toRegister.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data: any = await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), { body: toRegister });

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
