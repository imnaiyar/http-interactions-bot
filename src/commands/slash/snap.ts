import { HIDE_OPTIONS } from "@/constants";
import { IntegrationType, type SlashCommand } from "@/structures";
import { ApplicationCommandOptionType, MessageFlags } from "discord-api-types/v10";

// Note: Puppeteer is not available in Cloudflare Workers
// This command is temporarily disabled until we implement a Workers-compatible screenshot service

const devicesDimensions: Record<string, { width: number; height: number; isMobile?: boolean; isLandscape?: boolean }> = {
  "iphone-14-pro-max": { width: 430, height: 932, isMobile: true },
  "s24-ultra": { width: 500, height: 915, isMobile: true },
  "ipad-pro": { width: 1024, height: 1366, isMobile: true, isLandscape: true },
  desktop: { width: 1280, height: 720 },
  "desktop-xs": { width: 1440, height: 900 },
};

export default {
  data: {
    name: "snap",
    description: "Take a snapshot of a given website",
    options: [
      {
        name: "url",
        description: "Url of the website",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "viewport",
        description: "viewport of the screen to capture",
        required: false,
        type: ApplicationCommandOptionType.String,
        choices: Object.entries(devicesDimensions).map(([k]) => ({
          name: k
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1, w.length))
            .join(" "),
          value: k,
        })),
      },
      {
        name: "wait-for",
        description: "Wait for this number of seconds before taking a snap",
        type: ApplicationCommandOptionType.Number,
        required: false,
      },
      HIDE_OPTIONS,
    ],
    integration_types: [IntegrationType.Users],
    contexts: [0, 1, 2],
  },
  async run(app, interaction, options) {
    const hide = options.getBoolean("hide");
    
    await app.api.replyToInteraction(interaction.id, interaction.token, {
      content: "❌ Screenshot functionality is temporarily disabled in the Cloudflare Workers version. This feature requires browser automation that's not available in the Workers runtime.",
      flags: hide === null ? app.ephemeral : hide ? MessageFlags.Ephemeral : undefined,
    });
  },
} satisfies SlashCommand;
