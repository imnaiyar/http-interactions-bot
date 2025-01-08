import { HIDE_OPTIONS } from "@/constants";
import { IntegrationType, type SlashCommand } from "@/structures";
import { ApplicationCommandOptionType, MessageFlags } from "@discordjs/core";
import puppeteer from "puppeteer";
const devicesDimensions: Record<string, { width: number; height: number; isMobile?: boolean; isLandscape?: boolean }> = {
  "iphone-14-pro-max": { width: 430, height: 932, isMobile: true },
  "s24-ultra": { width: 500, height: 915, isMobile: true },
  "ipad-pro": { width: 1024, height: 1366, isMobile: true, isLandscape: true },
  desktop: { width: 1280, height: 720 },
  "desktop-xs": { width: 1440, height: 900 },
};

// TODO: Handle puppeteer errors
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
    const url = options.getString("url", true);
    const viewport = options.getString("viewport");
    const waitFor = options.getNumber("wait-for");
    if (!/^https?:\/\/.+/.test(url)) {
      return void (await app.api.interactions.reply(interaction.id, interaction.token, {
        content: "Not a valid url",
        flags: 64, // ephemeral
      }));
    }
    await app.api.interactions.defer(interaction.id, interaction.token, {
      flags: hide === null ? app.ephemeral : hide ? MessageFlags.Ephemeral : undefined,
    });
    const start = performance.now();
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();

    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);

    // Set viewport size
    await page.setViewport(viewport ? devicesDimensions[viewport] : { width: 1280, height: 720 });

    // Navigate to the provided URL
    await page.goto(url);

    if (waitFor) await Bun.sleep(waitFor * 1000);

    // Take a screenshot
    const screenshotBuffer = await page.screenshot();
    await browser.close();
    const end = performance.now();
    return void (await app.api.interactions.editReply(interaction.application_id, interaction.token, {
      content: `Took: \`${((end - start) / 1000).toFixed(2)}s\``,
      files: [
        {
          name: "screenshot.png",
          data: screenshotBuffer,
        },
      ],
    }));
  },
} satisfies SlashCommand;
