import { loadContext, loadSlash } from '../src/handlers/loadCommands';
const commands = [...loadContext('').values(), ...loadSlash('').values()];

(async () => {
	const res = await fetch(`https://discord.com/api/v10/applications/${process.env.APP_ID}/commands`, {
		method: 'PUT',
		headers: {
			Authorization: `Bot ${process.env.TOKEN}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(commands),
	});
	console.log(`Registered ${commands.length} commands`);
})();
