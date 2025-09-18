import { type APIGuildMember, type APIUser, type UserAvatarFormat, type UserBannerFormat } from "discord-api-types/v10";
import { type Bot } from "@/bot";
import { calculateUserDefaultAvatarIndex } from "@discordjs/rest";

export class UserUtil {
  /**
   * Returns user's avatar url, or there default one if they have none
   * @param user API User
   * @param [format = ImageFormat.PNG] Image format
   */
  public static userAvatarURL(app: Bot, user: APIUser, format?: UserAvatarFormat) {
    return (
      (user.avatar && `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${format || 'png'}`) ||
      UserUtil.defaultAvatarURL(app, user)
    );
  }

  /**
   * Get User Default Avatar
   * @param user The APIUser
   */
  public static defaultAvatarURL(app: Bot, user: APIUser) {
    const index = user.discriminator === "0" ? calculateUserDefaultAvatarIndex(user.id) : parseInt(user.discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }

  /**
   * Returns members guild avatar or their global/default user avatar if guild avatar is not present
   * @param member
   * @param guildId
   * @param format
   */
  public static memberAvatarURL(
    app: Bot,
    member: APIGuildMember | Omit<APIGuildMember, "deaf" | "mute">,
    userId: string,
    guildId: string,
    format?: UserAvatarFormat,
  ) {
    if (!member.avatar) return UserUtil.userAvatarURL(app, member.user!, format);
    return `https://cdn.discordapp.com/guilds/${guildId}/users/${userId}/avatars/${member.avatar}.${format || 'png'}`;
  }

  /**
   * Return GuildMember Banner
   */
  public static bannerURL(app: Bot, user: APIUser, format?: UserBannerFormat) {
    return user.banner && `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${format || 'png'}`;
  }
}
