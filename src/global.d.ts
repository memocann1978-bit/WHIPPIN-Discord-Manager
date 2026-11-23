export {};
declare global {
  interface Window {
    whippin: {
      connect(payload: { token: string; guildId: string }): Promise<{ guild: { id: string; name: string; icon: string | null }; channels: DiscordChannel[]; roles: DiscordRole[] }>;
      getStructure(guildId: string): Promise<{ guild: { id: string; name: string; icon: string | null }; channels: DiscordChannel[]; roles: DiscordRole[] }>;
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
  interface DiscordChannel { id: string; name: string; type: number; parent_id: string | null; position: number; permission_overwrites?: { id: string; type: number; allow: string; deny: string }[]; }
  interface DiscordRole { id: string; name: string; color: number; position: number; permissions: string; }
}