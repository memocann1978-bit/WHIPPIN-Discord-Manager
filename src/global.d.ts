export {};
declare global {
  interface Window {
    whippin: {
      connect(payload: { token: string; guildId: string }): Promise<{ guild: { id: string; name: string; icon: string | null }; channels: DiscordChannel[]; roles: DiscordRole[] }>;
      getStructure(guildId: string): Promise<{ guild: { id: string; name: string; icon: string | null }; channels: DiscordChannel[]; roles: DiscordRole[] }>;
      createChannel(payload: { guildId: string; name: string; type: 'text' | 'voice' | 'category'; parentId?: string }): Promise<DiscordChannel>;
      deleteChannel(channelId: string): Promise<null>;
      setChannelPermissions(payload: { channelId: string; roleId: string; allow: string; deny: string }): Promise<null>;
      createRole(payload: { guildId: string; name: string; color?: number }): Promise<DiscordRole>;
      deleteRole(payload: { guildId: string; roleId: string }): Promise<null>;
      disconnect(): Promise<boolean>;
    };
  }
  interface DiscordChannel { id: string; name: string; type: number; parent_id: string | null; position: number; permission_overwrites?: { id: string; type: number; allow: string; deny: string }[]; }
  interface DiscordRole { id: string; name: string; color: number; position: number; permissions: string; }
}