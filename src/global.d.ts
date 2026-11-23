export {};
declare global {
  interface Window {
    whippin: {
      connect(payload: { token: string; guildId: string }): Promise<{ guild: { id: string; name: string; icon: string | null }; channels: DiscordChannel[]; roles: DiscordRole[] }>;
      getStructure(guildId: string): Promise<{ guild: { id: string; name: string; icon: string | null }; channels: DiscordChannel[]; roles: DiscordRole[] }>;
      getMembers(payload: { guildId: string; after?: string }): Promise<DiscordMember[]>;
      updateMember(payload: { guildId: string; userId: string; nickname?: string | null; roles?: string[]; timeoutUntil?: string | null }): Promise<DiscordMember>;
      kickMember(payload: { guildId: string; userId: string }): Promise<null>;
      banMember(payload: { guildId: string; userId: string; reason?: string }): Promise<null>;
      unbanMember(payload: { guildId: string; userId: string }): Promise<null>;
      getBans(guildId: string): Promise<{ user: DiscordUser; reason?: string }[]>;
      getMessages(payload: { channelId: string; before?: string }): Promise<DiscordMessage[]>;
      deleteMessage(payload: { channelId: string; messageId: string }): Promise<null>;
      bulkDeleteMessages(payload: { channelId: string; messageIds: string[] }): Promise<null>;
      createChannel(payload: { guildId: string; name: string; type: 'text' | 'voice' | 'category'; parentId?: string }): Promise<DiscordChannel>;
      deleteChannel(channelId: string): Promise<null>;
      updateChannel(payload: { channelId: string; name?: string; parentId?: string | null }): Promise<DiscordChannel>;
      reorderChannels(payload: { guildId: string; positions: { id: string; position: number; parent_id?: string | null }[] }): Promise<DiscordChannel[]>;
      setRolePermissions(payload: { guildId: string; roleId: string; permissions: string }): Promise<DiscordRole>;
      syncCategoryPermissions(categoryId: string): Promise<{ synced: number; failed: { id: string; message: string }[] }>;
      bulkDeleteChannels(channelIds: string[]): Promise<{ succeeded: string[]; failed: { id: string; message: string }[] }>;
      bulkUpdateChannels(payload: { channelIds: string[]; parentId?: string | null; prefix: string; suffix: string }): Promise<{ succeeded: string[]; failed: { id: string; message: string }[] }>;
      setChannelPermissions(payload: { channelId: string; roleId: string; allow: string; deny: string }): Promise<null>;
      createRole(payload: { guildId: string; name: string; color?: number }): Promise<DiscordRole>;
      deleteRole(payload: { guildId: string; roleId: string }): Promise<null>;
      disconnect(): Promise<boolean>;
      getAppVersion(): Promise<string>;
      checkForUpdates(): Promise<{ status: string; version?: string }>;
      installUpdate(): Promise<boolean>;
      onUpdateStatus(callback: (payload: { status: string; version?: string; percent?: number; message?: string }) => void): () => void;
    };
  }
  interface DiscordUser { id: string; username: string; global_name?: string | null; avatar?: string | null; }
  interface DiscordMember { user: DiscordUser; nick?: string | null; roles: string[]; joined_at?: string; communication_disabled_until?: string | null; }
  interface DiscordMessage { id: string; content: string; author: DiscordUser; timestamp: string; attachments?: { url: string }[]; }
  interface DiscordChannel { id: string; name: string; type: number; parent_id: string | null; position: number; permission_overwrites?: { id: string; type: number; allow: string; deny: string }[]; }
  interface DiscordRole { id: string; name: string; color: number; position: number; permissions: string; }
}