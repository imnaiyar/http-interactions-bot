import type { ContextMenu, SlashCommand } from "@/structures";
import { Collection } from "@discordjs/collection";

// Static imports for slash commands
import ping from "@/commands/slash/ping";
import facts from "@/commands/slash/facts";
import evalCommand from "@/commands/slash/eval";
import snap from "@/commands/slash/snap";
import ephemeral from "@/commands/slash/ephemeral";
import userinfo from "@/commands/slash/userinfo";
import reminders from "@/commands/slash/reminders";
// Commands with autocomplete need special handling
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

export async function loadSlash(_dirs: string) {
  const commands = new Collection<string, SlashCommand>();
  
  // Add slash commands without autocomplete
  const simpleCommands = [
    ping,
    facts,
    evalCommand,
    snap,
    ephemeral,
    userinfo,
    reminders,
    convert,
  ];

  for (const command of simpleCommands) {
    try {
      if (typeof command !== "object") continue;
      if (commands.has(command.data.name)) throw new Error("Command already exists");
      commands.set(command.data.name, command);
      console.log(`Loaded ${command.data.name}`);
    } catch (err) {
      console.error(`Failed to load ${command.data.name}`, err);
    }
  }

  // Add commands with autocomplete (need explicit typing)
  const autocompleteCommands: SlashCommand<true>[] = [
    todo as SlashCommand<true>,
    bookmarks as SlashCommand<true>,
  ];

  for (const command of autocompleteCommands) {
    try {
      if (typeof command !== "object") continue;
      if (commands.has(command.data.name)) throw new Error("Command already exists");
      commands.set(command.data.name, command as any);
      console.log(`Loaded ${command.data.name} (with autocomplete)`);
    } catch (err) {
      console.error(`Failed to load ${command.data.name}`, err);
    }
  }
  
  return commands;
}

export async function loadContext(_dirs: string) {
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
      commands.set(command.data.name, command as any);
      console.log(`Loaded ${command.data.name}`);
    } catch (err) {
      console.error(`Failed to load ${command.data.name}`, err);
    }
  }
  
  return commands;
}
