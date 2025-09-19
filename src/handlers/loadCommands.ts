import type { ContextMenu, SlashCommand } from '@/structures';
import { Collection } from '@discordjs/collection';

// Static imports for slash commands
import ping from '@/commands/slash/ping';
import facts from '@/commands/slash/facts';
import evalCommand from '@/commands/slash/eval';
import snap from '@/commands/slash/snap';
import ephemeral from '@/commands/slash/ephemeral';
import userinfo from '@/commands/slash/userinfo';
import reminders from '@/commands/slash/reminders';
import github from '@/commands/slash/github';
import register from '@/commands/slash/register';
// commands with autocomplete
/* import todo from "@/commands/slash/todo"; */
import bookmarks from '@/commands/slash/bookmarks';
import convert from '@/commands/slash/convert';
import githubIssues from '@/commands/slash/github-issues';
import githubPr from '@/commands/slash/github-pr';
import githubWorkflows from '@/commands/slash/github-workflows';
import githubFiles from '@/commands/slash/github-files';

// Static imports for context menus
import translate from '@/commands/contexts/translate';
import userinfoContext from '@/commands/contexts/userinfo';
import messageinfoContext from '@/commands/contexts/messageinfo';
import uinfoContext from '@/commands/contexts/uinfo';
import prettifyContext from '@/commands/contexts/prettify';
import bookmarkContext from '@/commands/contexts/bookmark';

export function loadSlash(_dirs: string) {
	const commands = new Collection<string, SlashCommand>();

	// Add slash commands without autocomplete
	const simpleCommands = [ping, facts, evalCommand, snap, ephemeral, userinfo, reminders, convert, github, register] as SlashCommand[];

	for (const command of simpleCommands) {
		try {
			if (typeof command !== 'object') continue;
			if (commands.has(command.data.name)) throw new Error('Command already exists');
			commands.set(command.data.name, command);
			console.log(`Loaded ${command.data.name}`);
		} catch (err) {
			console.error(`Failed to load ${command.data.name}`, err);
		}
	}

	// Add commands with autocomplete (need explicit typing)
	const autocompleteCommands: SlashCommand<true>[] = [
		bookmarks as SlashCommand<true>,
		githubIssues as SlashCommand<true>,
		githubPr as SlashCommand<true>,
		githubWorkflows as SlashCommand<true>,
		githubFiles as SlashCommand<true>,
	];

	for (const command of autocompleteCommands) {
		try {
			if (typeof command !== 'object') continue;
			if (commands.has(command.data.name)) throw new Error('Command already exists');
			commands.set(command.data.name, command as any);
			console.log(`Loaded ${command.data.name} (with autocomplete)`);
		} catch (err) {
			console.error(`Failed to load ${command.data.name}`, err);
		}
	}

	return commands;
}

export function loadContext(_dirs: string) {
	const commands = new Collection<string, ContextMenu<'Message' | 'User'>>();

	// Add all context menu commands
	const contextCommands = [translate, userinfoContext, messageinfoContext, uinfoContext, prettifyContext, bookmarkContext];

	for (const command of contextCommands) {
		try {
			if (typeof command !== 'object') continue;
			if (commands.has(command.data.name)) throw new Error('Command already exists');
			commands.set(command.data.name, command as any);
			console.log(`Loaded ${command.data.name}`);
		} catch (err) {
			console.error(`Failed to load ${command.data.name}`, err);
		}
	}

	return commands;
}
