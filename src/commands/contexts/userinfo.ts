import { UserUtil as utils } from "#libs";
import type { ContextMenu } from "#structures";
import { EmbedBuilder, roleMention, time } from "@discordjs/builders";
import { ApplicationCommandType, ImageFormat } from "@discordjs/core/http-only";
import { DiscordSnowflake } from "@sapphire/snowflake";
export default {
  data: {
    name: "Author Info",
    type: ApplicationCommandType.Message,
    integration_types: [1],
    contexts: [0, 1, 2],
  },
  async run(app, interaction, options) {
    await app.api.interactions.defer(interaction.id, interaction.token, { flags: app.ephemeral });
    const message = options.getTargetMessage();
    const targetUser = await app.api.users.get(message.author.id);
    // prettier-ignore
    const member = interaction.guild_id && (await app.api.guilds.getMember(interaction.guild_id, message.author.id).catch(() => {}))
    const createdAt = time(Math.floor(DiscordSnowflake.timestampFrom(targetUser.id) / 1000), "F");
    const embed = new EmbedBuilder().setDescription(
      `**Account Type**: ${targetUser.bot ? "Bot" : "User"}\n**Username**: ${targetUser.username}\n**Account CreatedAt**: ${createdAt}\n ${member ? `**Joined GuildAt: ${time(new Date(member.joined_at), "F")}` : ""}`,
    );
    if (member) {
      const roles = await app.api.guilds.getRoles(interaction.guild_id!);
      const memberRoles = roles.filter((role) => member.roles.includes(role.id));
      embed.addFields({
        name: "Roles",
        value: memberRoles.map((role) => roleMention(role.id)).join(", "),
      });
    }

    const title = (member && member.nick) || targetUser.global_name || targetUser.username;
    const avatarUrl =
      (member && utils.memberAvatarURL(app, member, targetUser.id, interaction.guild_id!)) ||
      utils.userAvatarURL(app, targetUser, ImageFormat.PNG);
    const banner = targetUser.banner && utils.bannerURL(app, targetUser);
    embed
      .setAuthor({ name: `${title} Info`, iconURL: avatarUrl })
      .setTitle(title + " Info")
      .setFooter({
        text: `Requested by ${interaction.user?.username || interaction.member!.user.username}`,
        iconURL: interaction.member
          ? utils.memberAvatarURL(app, interaction.member, interaction.member.user.id, interaction.guild_id!)
          : utils.userAvatarURL(app, interaction.user!),
      })
      .setThumbnail(avatarUrl);

    if (banner) embed.setImage(banner);
    await app.api.interactions.editReply(interaction.application_id, interaction.token, {
      embeds: [embed.toJSON()],
    });
  },
} satisfies ContextMenu<"Message">;
