import { ContextType, IntegrationType, type SlashCommand } from "#structures";
import { MessageFlags } from "@discordjs/core";
import { ApplicationCommandOptionType } from "@discordjs/core/http-only";
export default {
    data: {
        name: "ephemeral",
        description: "change ephemeral state of replies",
        options: [
            {
                name: "ephemeral",
                description: "the ephemeral state",
                type: ApplicationCommandOptionType.Boolean,
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
        const hide = options.getBoolean("ephemeral");
        app.ephemeral = hide ? MessageFlags.Ephemeral : undefined;
        await app.api.interactions.reply(interaction.id, interaction.token, {
            content: `Ephemeral state changed to \`${hide}\``,
            flags: app.ephemeral
        });
    }
} satisfies SlashCommand;
