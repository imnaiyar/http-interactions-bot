import { loadContext, loadSlash } from '../src/handlers/loadCommands';
const commands = [...loadContext('').values(), ...loadSlash('').values()].map((cmd) => cmd.data);

(async () => {
	const res = await fetch(`https://discord.com/api/v10/applications/${process.env.DISCORD_CLIENT_ID}/commands`, {
		method: 'PUT',
		headers: {
			Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(commands),
	})
		.then((r) => r.json())
		.catch(console.error);
	console.log(`Registered ${(res as any).length} commands`);
})();
