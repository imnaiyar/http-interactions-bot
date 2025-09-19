import type { Bot } from '@/bot';
import { Reminder } from '@/commands/slash/reminders';
import { EmbedBuilder } from '@discordjs/builders';

export default async (_app: Bot) => {
	// For now, reminders functionality is disabled in Workers
	// TODO: Implement KV storage for reminders
	const kv = _app.env.REMINDERS;

	// Future KV implementation:

	try {
		const remindersData = (await kv.list<Reminder>().then((l) => l.keys.map((k) => [k.name, k.metadata]))).filter(Boolean) as [
			string,
			Reminder,
		][];

		for (const [key, reminder] of remindersData) {
			const { authorId: _userid, time, text, username, setAt, dmId } = reminder;

			if (time > Date.now()) continue;

			await kv.delete(key);

			// Send the reminder
			const embed = new EmbedBuilder()
				.setAuthor({ name: `${username} Reminder` })
				.setTitle('Reminder')
				.setDescription(`You asked me to remind you about: \`${text}\``)
				.setFields({
					name: 'Set on',
					value: '<t:' + Math.trunc(Number(setAt) / 1000) + ':F> (<t:' + Math.trunc(Number(setAt) / 1000) + ':R>)',
				});

			await _app.api.createMessage(dmId, {
				embeds: [embed.toJSON() as any],
			})
			.catch(console.error);
		}
	} catch (error) {
		console.error('Error handling reminders:', error);
	}
};
