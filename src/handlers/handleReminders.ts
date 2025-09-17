import type { Bot } from "@/bot";

export default async (_app: Bot) => {
  // For now, reminders functionality is disabled in Workers
  // TODO: Implement KV storage for reminders
  // const kv = app.env.REMINDERS;
  // if (!kv) return;
  
  console.log("Reminder handler called - KV implementation needed");
  return;
  
  // Future KV implementation:
  /*
  try {
    const remindersData = await kv.get("reminders", "json");
    if (!remindersData) return;
    
    const reminders: Reminders = remindersData;
    const keys = Object.keys(reminders);
    
    for (const k of keys) {
      const { authorId: _userid, time, text, username, setAt, dmId } = reminders[k];

      if (time > Date.now()) continue;
      delete reminders[k];
      
      // Update KV storage
      await kv.put("reminders", JSON.stringify(reminders));

      // Send the reminder
      const embed = new EmbedBuilder()
        .setAuthor({ name: `${username} Reminder` })
        .setTitle("Reminder")
        .setDescription(`You asked me to remind you about: \`${text}\``)
        .setFields({
          name: "Set on",
          value: "<t:" + Math.trunc(Number(setAt) / 1000) + ":F> (<t:" + Math.trunc(Number(setAt) / 1000) + ":R>)",
        });

      await app.api.channels
        .createMessage(dmId, {
          embeds: [embed.toJSON() as any],
        })
        .catch(console.error);
    }
  } catch (error) {
    console.error("Error handling reminders:", error);
  }
  */
};
