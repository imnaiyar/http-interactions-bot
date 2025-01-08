import { recursiveReadDir } from "@/utils";
import { pathToFileURL } from "node:url";
import path from "node:path";
import type { ContextMenu, SlashCommand } from "@/structures";
import { Collection } from "@discordjs/collection";
export async function loadSlash(dirs: string) {
  const files = recursiveReadDir(dirs);
  const commands = new Collection<string, SlashCommand>();
  for (const file of files) {
    const fileName = path.basename(file);

    try {
      const { default: command } = (await import(pathToFileURL(file).href)) as {
        default: SlashCommand;
      };
      if (typeof command !== "object") continue;
      if (commands.has(command.data.name)) throw new Error("Command already exists");
      commands.set(command.data.name, command);
      console.log(`Loaded ${fileName}`);
    } catch (err) {
      console.error(`Failed to load ${fileName}`, err);
    }
  }
  return commands;
}
export async function loadContext(dirs: string) {
  const files = recursiveReadDir(dirs);
  const commands = new Collection<string, ContextMenu<"Message" | "User">>();
  for (const file of files) {
    const fileName = path.basename(file);

    try {
      const { default: command } = (await import(pathToFileURL(file).href)) as {
        default: ContextMenu<"Message" | "User">;
      };
      if (typeof command !== "object") continue;
      if (commands.has(command.data.name)) throw new Error("Command already exists");
      commands.set(command.data.name, command);
      console.log(`Loaded ${fileName}`);
    } catch (err) {
      console.error(`Failed to load ${fileName}`, err);
    }
  }
  return commands;
}
