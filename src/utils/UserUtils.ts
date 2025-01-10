import { type APIGuildMember, type APIUser, type UserAvatarFormat, type UserBannerFormat } from "@discordjs/core/http-only";
import App from "@/app";
import { calculateUserDefaultAvatarIndex } from "@discordjs/rest";

export class UserUtil {
  /**
   * Returns user's avatar url, or there default one if they have none
   * @param user API User
   * @param [format = ImageFormat.PNG] Image format
   */
  public static userAvatarURL(app: typeof App, user: APIUser, format?: UserAvatarFormat) {
    return (
      (user.avatar && app.api.rest.cdn.avatar(user.id, user.avatar, format && { extension: format })) ||
      UserUtil.defaultAvatarURL(app, user)
    );
  }

  /**
   * Get User Default Avatar
   * @param user The APIUser
   */
  public static defaultAvatarURL(app: typeof App, user: APIUser) {
    const index = user.discriminator === "0" ? calculateUserDefaultAvatarIndex(user.id) : parseInt(user.discriminator) % 5;
    return app.api.rest.cdn.defaultAvatar(index);
  }

  /**
   * Returns members guild avatar or their global/default user avatar if guild avatar is not present
   * @param member
   * @param guildId
   * @param format
   */
  public static memberAvatarURL(
    app: typeof App,
    member: APIGuildMember | Omit<APIGuildMember, "deaf" | "mute">,
    userId: string,
    guildId: string,
    format?: UserAvatarFormat,
  ) {
    if (!member.avatar) return UserUtil.userAvatarURL(app, member.user!, format);
    return app.api.rest.cdn.guildMemberAvatar(guildId, userId, member.avatar, format && { extension: format });
  }

  /**
   * Return GuildMember Banner
   */
  public static bannerURL(app: typeof App, user: APIUser, format?: UserBannerFormat) {
    return user.banner && app.api.rest.cdn.banner(user.id, user.banner, format && { extension: format });
  }
}
