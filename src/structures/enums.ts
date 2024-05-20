export enum IntegrationType {
  /** Command is for guild */
  Guilds = 0,

  /** Command is for User apps */
  Users = 1,
}
export enum ContextType {
  /** Command can be used in guilds */
  Guild = 0,

  /** Command can be used in Bot's DM */
  BotDM = 1,

  /** Command can be used in other's DMs (Group DMs, DMs) */
  PrivateChannels = 2,
}
