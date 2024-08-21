import { EmbedBuilder, roleMention, time } from "@discordjs/builders";
import { ImageFormat, type APIGuildMember, type APIInteraction, type APIUser } from "@discordjs/core/http-only";
import { UserUtil as utils } from "#src/utils/index";
import App from "#src/app";
import { DiscordSnowflake } from "@sapphire/snowflake";

export function formatUserInfo(
  member: Omit<APIGuildMember, "deaf" | "mute"> | undefined,
  targetUser: APIUser | undefined,
  interaction: APIInteraction,
  app: typeof App,
) {
  const createdAt = targetUser && time(Math.floor(DiscordSnowflake.timestampFrom(targetUser.id) / 1000), "F");
  const embed = new EmbedBuilder().setDescription(
    `**Account Type**: ${targetUser?.bot ? "Bot" : "User"}\n**Username**: ${targetUser?.username}\n**Account CreatedAt**: ${createdAt}\n${member ? `**Joined GuildAt**: ${time(new Date(member.joined_at), "F")}` : ""}`,
  );
  if (member && member.roles.length) {
    embed.addFields({
      name: "Roles",
      value: member.roles.map((role) => roleMention(role)).join(", "),
    });
  }

  const title = (member && member.nick) || targetUser?.global_name || targetUser?.username;
  const avatarUrl =
    (member?.avatar && targetUser && utils.memberAvatarURL(app, member, targetUser.id, interaction.guild_id!)) ||
    (targetUser && utils.userAvatarURL(app, targetUser, ImageFormat.PNG));
  const banner = targetUser && targetUser.banner && utils.bannerURL(app, targetUser);
  embed
    .setAuthor({ name: `${title} Info`, iconURL: avatarUrl })
    .setTitle(title + " Info")
    .setFooter({
      text: `Requested by ${interaction.user?.username || interaction.member!.user.username}`,
      iconURL: interaction.member
        ? utils.memberAvatarURL(app, interaction.member, interaction.member.user.id, interaction.guild_id!)
        : utils.userAvatarURL(app, interaction.user!),
    });
  if (avatarUrl) embed.setThumbnail(avatarUrl);
  if (banner) embed.setImage(banner);
  return embed;
}
