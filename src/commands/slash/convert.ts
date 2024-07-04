import { EmbedBuilder } from "@discordjs/builders";
import { type SlashCommand } from "#structures";
import { formatString } from "#utils";
import { ApplicationCommandOptionType } from "@discordjs/core";

interface Quantity {
  readonly name: string;
  readonly short: string[];
  readonly value: number;
  readonly numeratorQuantity?: string;
  readonly denominatorQuantity?: string;
}

interface StandardQuantity extends Quantity {
  readonly tempMath?: undefined;
}

interface TemperatureQuantity extends Quantity {
  readonly tempMath: {
    readonly toSelf: (absolute: number) => number;
    readonly toBase: (amount: number) => number;
  };
}

type CombinedQuantity = StandardQuantity | TemperatureQuantity;

const quantities: Record<string, CombinedQuantity[]> = {
  storage: [
    { name: "bit", value: 1, short: ["bit", "bits"] },
    { name: "kilobit", value: 1_000, short: ["Kbit", "kilobits"] },
    { name: "megabit", value: 1_000_000, short: ["Mbit", "megabits"] },
    { name: "gigabit", value: 1_000_000_000, short: ["Gbit", "gigabits"] },
    { name: "terabit", value: 1_000_000_000_000, short: ["Tbit", "terabits"] },
    { name: "byte", value: 8, short: ["byte", "bytes"] },
    { name: "kilobyte", value: 8_000, short: ["KB", "kilobytes"] },
    { name: "megabyte", value: 8_000_000, short: ["MB", "megabytes"] },
    { name: "gigabyte", value: 8_000_000_000, short: ["GB", "gigabytes"] },
    { name: "terabyte", value: 8_000_000_000_000, short: ["TB", "terabytes"] },
  ],
  space: [
    { name: "metre", value: 1, short: ["m", "meter"] },
    { name: "centimetre", value: 0.01, short: ["cm", "centimeter"] },
    { name: "millimetre", value: 0.001, short: ["mm", "millimeter"] },
    { name: "kilometre", value: 1_000, short: ["km", "kilometer"] },
    { name: "mile", value: 1_609.344, short: ["mi", "miles"] },
    { name: "yard", value: 0.9144, short: ["yd", "yards"] },
    { name: "foot", value: 0.3048, short: ["ft", "feet", '"'] },
    { name: "inch", value: 0.0254, short: ["in", "inches", '"'] },
    { name: "light-year", value: 9_460_528_400_000_000, short: ["ly", "lightyear"] },
    { name: "astronomical unit", value: 149_597_870_700, short: ["au"] },
  ],
  currency: [
    { name: "Euro :flag_eu:", value: 1, short: ["EUR", "€"] },
    { name: "US Dollar :flag_us:", value: 0.92, short: ["USD", "$"] },
    { name: "Pound Sterling :flag_gb:", value: 1.17, short: ["GBP", "£"] },
    { name: "Turkish Lira :flag_tr:", value: 0.029, short: ["TRY", "TL", "₺"] },
    { name: "Russian Ruble :flag_ru:", value: 0.01, short: ["RUB", "₽"] },
    { name: "Canadian Dollar :flag_ca:", value: 0.68, short: ["CAD"] },
    { name: "Australian Dollar :flag_au:", value: 0.6, short: ["AUD"] },
    { name: "Japanese Yen :flag_jp:", value: 0.0061, short: ["JPY", "¥", "yen", "jy"] },
    { name: "New Zealand Dollar :flag_nz:", value: 0.56, short: ["NZD"] },
    { name: "Indonesian Rupiah :flag_id:", value: 0.000059, short: ["IDR", "Rp"] },
    { name: "Chinese Yuan Renminbi :flag_cn:", value: 0.13, short: ["CN¥", "CNY", "RMB", "元"] },
    { name: "Swedish krona :flag_se:", value: 0.089, short: ["SEK", "kr"] },
    { name: "Norwegian krone :flag_no:", value: 0.088, short: ["NOK"] },
    { name: "Danish krone :flag_dk:", value: 0.13, short: ["DKK"] },
    { name: "Icelandic króna :flag_is:", value: 0.0067, short: ["ISK"] },
    { name: "Czech koruna :flag_cz:", value: 0.039, short: ["CZK", "Kč"] },
    { name: "Swiss franc :flag_ch:", value: 1.04, short: ["CFH", "fr"] },
    { name: "Ukrainian hryvnia :flag_ua:", value: 0.024, short: ["UAH", "₴", "грн"] },
    { name: "Indian rupee :flag_in:", value: 0.011, short: ["INR", "₹"] },
    { name: "United Arab Emirates dirham :flag_ae:", value: 0.25, short: ["AED", "د.إ"] },
    { name: "Sri Lankan Rupee :flag_lk:", value: 0.003, short: ["LKR", "රු", "ரூ"] },
    { name: "Hungarian Forint :flag_hu:", value: 0.0025, short: ["HUF"] },
    { name: "Among Us ඞ:red_square:", value: NaN, short: ["SUS"] },
  ],
  mass: [
    { name: "gram", value: 1, short: ["g"] },
    { name: "kilogram", value: 1000, short: ["kg", "kgs"] },
    { name: "pound", value: 453.59237, short: ["lbs", "b"] },
    { name: "ounce", value: 28.3495231, short: ["oz"] },
  ],
  volume: [
    { name: "metre cubed", value: 1, short: ["m^3", "m3", "meter cubed"] },
    { name: "centimetre cubed", value: 0.000001, short: ["cm^3", "cm3", "centimeter cubed"] },
    { name: "US fluid ounce", value: 0.0000295735296, short: ["fl oz", "floz"] },
    { name: "litre", value: 0.001, short: ["l", "liter"] },
    { name: "desilitre", value: 0.0001, short: ["dl", "desiliter"] },
    { name: "millilitre", value: 0.000001, short: ["ml", "milliliter"] },
    { name: "US gallon", value: 0.00378541, short: ["gal"] },
  ],
  temperature: [
    {
      name: "kelvin",
      short: ["K"],
      tempMath: {
        toSelf: (absolute) => absolute,
        toBase: (amount) => amount,
      },
      value: 0,
    },
    {
      name: "celsius",
      short: ["°C", "c"],
      tempMath: {
        toSelf: (absolute) => absolute - 273.15,
        toBase: (amount) => amount + 273.15,
      },
      value: 0,
    },
    {
      name: "fahrenheit",
      short: ["°F", "fh", "f"],
      tempMath: {
        toSelf: (absolute) => (9 / 5) * (absolute - 273.15) + 32,
        toBase: (amount) => (5 / 9) * (amount - 32) + 273.15,
      },
      value: 0,
    },
  ],
  time: [
    { name: "millisecond", value: 0.001, short: ["ms"] },
    { name: "second", value: 1, short: ["sec", "seconds"] },
    { name: "minute", value: 60, short: ["min", "minutes"] },
    { name: "hour", value: 3_600, short: ["hr", "hours"] },
    { name: "day", value: 86_400, short: ["d", "days"] },
    { name: "week", value: 604_800, short: ["w", "weeks"] },
    { name: "month", value: 2_592_000, short: ["mo", "months"] },
    { name: "year", value: 31_556_952, short: ["y", "yr", "years"] },
  ],
  force: [
    { name: "newton", value: 1, short: ["N"] },
    { name: "kilonewton", value: 1_000, short: ["kN"] },
    { name: "dyne", value: 100_000, short: ["dyn"] },
    { name: "pound-force", value: 4.448222, short: ["lbf"] },
    { name: "poundal", value: 0.138255, short: ["pdl"] },
    { name: "kip", value: 4448.22, short: ["kip"] },
    { name: "kilogram-force", value: 9.80665, short: ["kgf"] },
  ],
  energy: [
    { name: "joule", value: 1, short: ["J"] },
    { name: "kilowatt-hour", value: 3600000, short: ["kWh"] },
    { name: "calorie", value: 4.184, short: ["cal"] },
    { name: "electronvolt", value: 0.0000000000000000001602176634, short: ["eV"] },
    { name: "foot-pound force", value: 1.355818, short: ["ft⋅lbf", "ftlbf", "ftlb"] },
  ],
};

const quantityKeys = Object.keys(quantities);
const quantityValues = Object.values(quantities);

function areTempQuantities(quantities: { unit?: CombinedQuantity }[]): quantities is {
  quantity: string;
  unit: TemperatureQuantity;
  amount: number;
}[] {
  return quantities.every((quantity) => quantity.unit?.tempMath);
}

function areValidStarters(starters: (Record<string, any> | undefined)[]): starters is {
  amount: number;
  quantity: string;
  unit: CombinedQuantity;
}[] {
  return starters.every((x) => x);
}

function findUnit(unitNameQuery: string) {
  // Short search
  for (let i = 0; i < quantityValues.length; i++) {
    const unit = quantityValues[i].find((x) => x.short.some((y) => y.toLowerCase() === unitNameQuery.toLowerCase()));

    if (unit) return { quantity: quantityKeys[i], unit };
  }

  // Name identical search
  for (let i = 0; i < quantityValues.length; i++) {
    const unit = quantityValues[i].find((x) => x.name.toLowerCase() === unitNameQuery.toLowerCase());

    if (unit) return { quantity: quantityKeys[i], unit };
  }

  // Name inclusive search
  for (let i = 0; i < quantityValues.length; i++) {
    const unit = quantityValues[i].find((x) => x.name.toLowerCase().includes(unitNameQuery.toLowerCase()));

    if (unit) return { quantity: quantityKeys[i], unit };
  }
}

export default {
  async run(app, interaction, options) {
    if (options.getSubcommand() === "help") {
      const chosenQuantity = options.getString("quantity", false);

      if (chosenQuantity) {
        const units = quantities[chosenQuantity];

        return await app.api.interactions.reply(interaction.id, interaction.token, {
          embeds: [
            new EmbedBuilder()
              .setTitle(`Convert help: ${chosenQuantity}`)
              .setDescription(
                `This quantity comprises ${units.length} units, which are:\n\n${units
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((unit) => `**${formatString(unit.name)}** (${unit.short.map((x) => `\`${x}\``).join(", ")})`)
                  .join("\n")}`,
              )
              .setColor(4203516)
              .toJSON(),
          ],
          flags: app.ephemeral,
        });
      }

      return await app.api.interactions.reply(interaction.id, interaction.token, {
        embeds: [
          new EmbedBuilder()
            .setTitle("Convert help")
            .setColor(4203516)
            .setDescription(
              "To convert something, you add **amount** and **unit** combinations to your starter(s). The syntax for an amount and unit combination is `[amount][unit symbol]`. Amount and unit combinations are called **arguments**. Arguments are divided into **starters** and a **target unit**. Starters are the starting values that you want to convert to the target unit. A conversion command can consist of one or more starters, separated with a comma (`,`) in case there are many. After starters comes the target unit as the second option. The target must not include an amount. It is just a **unit symbol**. Because you cannot convert fruits into lengths, all starters and the target unit must be of the same **quantity**, e.g. `1meter` to `centimeter`.",
            )
            .addFields(
              {
                name: "Supported Quantities",
                value: `${quantityKeys.map(formatString).join(", ")}\n\nTo learn more about a quantity and its units and unit symbols,\nuse \`/convert help\` with a specified quantity option.`,
              },
              {
                name: "Examples",
                value: [
                  'An amount: "5", "1200300", "1.99"',
                  "A unit: metre, kelvin, Euro",
                  'A unit symbol: "fh", "cm^3", "$", "fl oz"',
                  'An argument: "180cm", "12.99€", "5km", "16fl oz"',
                  'A target unit: "km", "c", "m2"',
                  "Complete conversion examples:",
                  "`/convert convert` `5ft, 8in` & `cm`",
                  "`/convert convert` `300kelvin` & `celsius`",
                  "`/convert convert` `57mm, 3.3cm, 0.4m` & `cm`",
                ].join("\n"),
              },
            )
            .toJSON(),
        ],
        flags: app.ephemeral,
      });
    }

    const starters = options
      .getString("starter", true)
      .split(",")
      .map((starter) => {
        starter = starter.trim();

        const stMtch = starter.match(/[0-9,.-]*/gi)!;
        const unitSymbol = starter.slice(stMtch[0].length).trim();
        const unit = findUnit(
          unitSymbol.endsWith("s") && unitSymbol.length > 3 ? unitSymbol.slice(0, unitSymbol.length - 1) : unitSymbol,
        );

        if (!unit) return;

        return { ...unit, amount: parseFloat(starter) };
      });

    if (!areValidStarters(starters))
      return await app.api.interactions.reply(interaction.id, interaction.token, {
        content: "You must convert *something;* Your message has 0 starters.",
        flags: app.ephemeral,
      });

    const targetPortion = options.getString("target", true);

    const target = findUnit(
      targetPortion.endsWith("s") && targetPortion.length > 3 ? targetPortion.slice(0, targetPortion.length - 1) : targetPortion,
    );

    if (!target)
      return await app.api.interactions.reply(interaction.id, interaction.token, {
        content: "You must convert *to* something; Your message doesn't have a (valid) target unit.",
        flags: app.ephemeral,
      });

    // Check that all starters and target are the same quantity
    const usedQuantities = new Set([target.quantity, ...starters.map((x) => x.quantity)]);
    const numeratorQuantities = new Set([target.unit.numeratorQuantity, ...starters.map((x) => x.unit.numeratorQuantity)]);
    const denominatorQuantities = new Set([target.unit.denominatorQuantity, ...starters.map((x) => x.unit.denominatorQuantity)]);

    if (usedQuantities.size > 1 || numeratorQuantities.size > 1 || denominatorQuantities.size > 1)
      return await app.api.interactions.reply(interaction.id, interaction.token, {
        content: `All starting units and the target unit must be of the same quantity; The quantities you used were \`${[...usedQuantities, ...numeratorQuantities, ...denominatorQuantities].filter((x) => x)}\``,
        flags: app.ephemeral,
      });

    const quantity = [...usedQuantities][0];

    // Get absolute value: sum of all starters (starter amount * starter unit value)
    const absolute = areTempQuantities(starters)
      ? starters.map((starter) => starter.unit.tempMath.toBase(starter.amount)).reduce((a, b) => a + b, 0)
      : starters.map((starter) => (starter.amount ?? 0) * (starter.unit.value ?? 0)).reduce((a, b) => a + b, 0);

    // Multiply absolute by the value of the target unit
    const amountInTarget = target.unit.tempMath ? target.unit.tempMath.toSelf(absolute) : absolute / target.unit.value;

    // Display amount and target unit symbol
    return await app.api.interactions.reply(interaction.id, interaction.token, {
      embeds: [
        new EmbedBuilder()
          .setTitle(`${formatString(quantity)} conversion`)
          .setColor(4203516)
          .addFields(
            {
              name: "Starting amount",
              value: starters.map((x) => `${x.amount.toLocaleString("en-US")} ${x.unit.short[0]}`).join(", "),
              inline: true,
            },
            {
              name: "Converted amount",
              value: amountInTarget.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + target.unit.short[0],
              inline: true,
            },
          )
          .toJSON(),
      ],
      flags: app.ephemeral,
    });
  },
  data: {
    name: "convert",
    description: "Quantity conversion",
    options: [
      {
        name: "help",
        description: "show how to use the command",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "quantity",
            description: "The quantity to get info on",
            type: ApplicationCommandOptionType.String,
            choices: [...quantityKeys.map((x) => ({ name: formatString(x), value: x }))],
            required: false,
          },
        ],
      },
      {
        name: "convert",
        description: "Convert one quantity to another",
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: "starter",
            description: "The starting quantity(s)",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
          {
            name: "target",
            description: "The target quantity",
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
    integration_types: [1],
    contexts: [0, 1, 2],
  },
} satisfies SlashCommand;
