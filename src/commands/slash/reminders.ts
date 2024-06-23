import { ContextType, IntegrationType, type SlashCommand } from "#structures";
import { MessageFlags } from "@discordjs/core";
import { ApplicationCommandOptionType } from "@discordjs/core/http-only";
import { EmbedBuilder } from "@discrodjs/builders";

export default {
    data: {
        name: "reminders",
        description: "set a reminder",
        options: [
            {
                name: "text",
                description: "description of the reminder",
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: "duration",
                description: "hide the response",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ],
        integration_types: [IntegrationType.Users],
        contexts: [
            ContextType.BotDM,
            ContextType.Guild,
            ContextType.PrivateChannels
        ]
    },
    async run(app, interaction, options) {
        const dur = options.getString("duration", true);
        const text = options.getString("text", true);
        const embed = new EmbedBuilder()
            .setTitle("Reminders")
            .setDescription(`Reminders saved \`${text}\`, in \`${duration}\``);
        await app.api.interactions.reply(interaction.id, interaction.token, {
            embeds: [embed.toJSON()],
            flags: app.ephemeral
        });
    }
} satisfies SlashCommand;
