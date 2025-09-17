import type { ContextMenu, SlashCommand } from "@/structures";
import { Collection } from "@discordjs/collection";

// Static imports for slash commands
import ping from "@/commands/slash/ping";
import facts from "@/commands/slash/facts";
import eval from "@/commands/slash/eval";
import snap from "@/commands/slash/snap";
import ephemeral from "@/commands/slash/ephemeral";
import userinfo from "@/commands/slash/userinfo";
import reminders from "@/commands/slash/reminders";
import todo from "@/commands/slash/todo";
import bookmarks from "@/commands/slash/bookmarks";
import convert from "@/commands/slash/convert";

// Static imports for context menus
import translate from "@/commands/contexts/translate";
import userinfoContext from "@/commands/contexts/userinfo";
import messageinfoContext from "@/commands/contexts/messageinfo";
import uinfoContext from "@/commands/contexts/uinfo";
import prettifyContext from "@/commands/contexts/prettify";
import bookmarkContext from "@/commands/contexts/bookmark";

export async function loadSlash(dirs: string) {
  const commands = new Collection<string, SlashCommand>();
  
  // Add all slash commands
  const slashCommands = [
    ping,
    facts,
    eval,
    snap,
    ephemeral,
    userinfo,
    reminders,
    todo,
    bookmarks,
    convert,
  ];

  for (const command of slashCommands) {
    try {
      if (typeof command !== "object") continue;
      if (commands.has(command.data.name)) throw new Error("Command already exists");
      commands.set(command.data.name, command);
      console.log(`Loaded ${command.data.name}`);
    } catch (err) {
      console.error(`Failed to load ${command.data.name}`, err);
    }
  }
  
  return commands;
}

export async function loadContext(dirs: string) {
  const commands = new Collection<string, ContextMenu<"Message" | "User">>();
  
  // Add all context menu commands
  const contextCommands = [
    translate,
    userinfoContext,
    messageinfoContext,
    uinfoContext,
    prettifyContext,
    bookmarkContext,
  ];

  for (const command of contextCommands) {
    try {
      if (typeof command !== "object") continue;
      if (commands.has(command.data.name)) throw new Error("Command already exists");
      commands.set(command.data.name, command);
      console.log(`Loaded ${command.data.name}`);
    } catch (err) {
      console.error(`Failed to load ${command.data.name}`, err);
    }
  }
  
  return commands;
}
