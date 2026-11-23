import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDown, ArrowDownUp, ArrowUp, Bell, Blocks, Bot, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, ClipboardList, Clock3, Command, Crown, Folder, Hash, Headphones,
  LayoutDashboard, LockKeyhole, Menu, MessageSquare, Plus, Search, Server,
  Settings, Shield, ShieldCheck, Sparkles, Users, Wifi, X, Zap
} from 'lucide-react';

type Page = 'Dashboard' | 'Server Structure' | 'Channels' | 'Roles' | 'Permissions' | 'Templates' | 'Bulk Actions' | 'Activity Logs' | 'Settings';
const pageLabels: Record<Page, string> = { Dashboard: 'Genel Bakış', 'Server Structure': 'Sunucu Yapısı', Channels: 'Kanallar', Roles: 'Roller', Permissions: 'İzinler', Templates: 'Şablonlar', 'Bulk Actions': 'Toplu İşlemler', 'Activity Logs': 'İşlem Geçmişi', Settings: 'Ayarlar' };
type Channel = { id?: string; name: string; type: 'text' | 'voice'; permission_overwrites?: { id: string; type: number; allow: string; deny: string }[] };
type Category = { id?: string; name: string; channels: Channel[]; permission_overwrites?: { id: string; type: number; allow: string; deny: string }[] };
type ActivityEntry = { id: number; action: string; detail: string; time: string; };
type ServerTemplate = { id: string; name: string; description: string; categories: { name: string; channels: { name: string; type: 'text' | 'voice' }[] }[] };
const serverTemplates: ServerTemplate[] = [
  { id: 'community', name: 'Community Server', description: 'Welcome, announcements, community chat and staff spaces.', categories: [
    { name: 'INFORMATION', channels: [{name:'welcome',type:'text'},{name:'announcements',type:'text'},{name:'rules',type:'text'}] },
    { name: 'COMMUNITY', channels: [{name:'general',type:'text'},{name:'media',type:'text'},{name:'voice-chat',type:'voice'}] },
    { name: 'STAFF', channels: [{name:'staff-chat',type:'text'},{name:'mod-logs',type:'text'}] }
  ]},
  { id: 'gaming', name: 'Gaming Server', description: 'Game updates, looking-for-group channels and voice rooms.', categories: [
    { name: 'SERVER INFO', channels: [{name:'welcome',type:'text'},{name:'news',type:'text'},{name:'rules',type:'text'}] },
    { name: 'GAMING', channels: [{name:'general-chat',type:'text'},{name:'looking-for-group',type:'text'},{name:'clips-and-screenshots',type:'text'},{name:'party-1',type:'voice'},{name:'party-2',type:'voice'}] },
    { name: 'TEAM', channels: [{name:'team-chat',type:'text'},{name:'team-voice',type:'voice'}] }
  ]},
  { id: 'creator', name: 'Creator Server', description: 'Creator announcements, content sharing and audience hangout.', categories: [
    { name: 'START HERE', channels: [{name:'welcome',type:'text'},{name:'announcements',type:'text'},{name:'schedule',type:'text'}] },
    { name: 'CONTENT', channels: [{name:'new-videos',type:'text'},{name:'live-chat',type:'text'},{name:'suggestions',type:'text'}] },
    { name: 'HANGOUT', channels: [{name:'general',type:'text'},{name:'voice-lounge',type:'voice'}] }
  ]}
];
const permissionBits = [
  {key:'view',label:'Kanalları görüntüle',bit:1024n},{key:'send',label:'Mesaj gönder',bit:2048n},{key:'manageMessages',label:'Mesajları yönet',bit:8192n},
  {key:'manageChannels',label:'Kanalları yönet',bit:16n},{key:'manageWebhooks',label:'Webhook yönet',bit:536870912n},{key:'createInvite',label:'Davet oluştur',bit:1n},
  {key:'embed',label:'Bağlantı önizlemeleri',bit:16384n},{key:'attach',label:'Dosya ekle',bit:32768n},{key:'history',label:'Mesaj geçmişini oku',bit:65536n},
  {key:'mention',label:'Herkesten bahset',bit:131072n},{key:'addReactions',label:'Tepki ekle',bit:64n},{key:'externalEmoji',label:'Harici emoji kullan',bit:262144n},
  {key:'connect',label:'Ses kanalına bağlan',bit:1048576n},{key:'speak',label:'Konuş',bit:2097152n},{key:'video',label:'Video kullan',bit:512n},
  {key:'mute',label:'Üyeleri sustur',bit:4194304n},{key:'deafen',label:'Üyeleri sağırlaştır',bit:8388608n},{key:'move',label:'Üyeleri taşı',bit:16777216n},{key:'priority',label:'Öncelikli konuşmacı',bit:256n}
];
const rolePermissionBits = [
  {key:'administrator',label:'Yönetici',bit:8n},{key:'manageGuild',label:'Sunucuyu yönet',bit:32n},{key:'manageRoles',label:'Rolleri yönet',bit:268435456n},
  {key:'manageChannels',label:'Kanalları yönet',bit:16n},{key:'view',label:'Kanalları görüntüle',bit:1024n},{key:'send',label:'Mesaj gönder',bit:2048n},
  {key:'manageMessages',label:'Mesajları yönet',bit:8192n},{key:'manageWebhooks',label:'Webhook yönet',bit:536870912n},{key:'kick',label:'Üyeleri at',bit:2n},
  {key:'ban',label:'Üyeleri yasakla',bit:4n},{key:'moderate',label:'Üyelere zaman aşımı uygula',bit:1099511627776n},{key:'manageNicknames',label:'Takma adları yönet',bit:134217728n},
  {key:'createInvite',label:'Davet oluştur',bit:1n},{key:'manageEvents',label:'Etkinlikleri yönet',bit:8589934592n},{key:'manageExpressions',label:'Emoji ve çıkartmaları yönet',bit:1073741824n},
  {key:'connect',label:'Ses kanalına bağlan',bit:1048576n},{key:'speak',label:'Konuş',bit:2097152n},{key:'mute',label:'Üyeleri sustur',bit:4194304n},
  {key:'deafen',label:'Üyeleri sağırlaştır',bit:8388608n},{key:'move',label:'Üyeleri taşı',bit:16777216n}
];
const navigation: { group: string; items: { label: Page; icon: typeof LayoutDashboard }[] }[] = [
  { group: 'ÇALIŞMA ALANI', items: [{ label: 'Dashboard', icon: LayoutDashboard }, { label: 'Server Structure', icon: Folder }, { label: 'Channels', icon: Hash }, { label: 'Roles', icon: ShieldCheck }, { label: 'Permissions', icon: LockKeyhole }] },
  { group: 'YÖNETİM', items: [{ label: 'Templates', icon: Blocks }, { label: 'Bulk Actions', icon: Zap }, { label: 'Activity Logs', icon: ClipboardList }] },
  { group: 'TERCİHLER', items: [{ label: 'Settings', icon: Settings }] }
];
const initialCategories: Category[] = [
  { name: 'INFORMATION', channels: [{ name: 'welcome', type: 'text' }, { name: 'announcements', type: 'text' }, { name: 'rules', type: 'text' }] },
  { name: 'COMMUNITY', channels: [{ name: 'general-chat', type: 'text' }, { name: 'media', type: 'text' }, { name: 'General Voice', type: 'voice' }] },
  { name: 'STAFF', channels: [{ name: 'staff-chat', type: 'text' }, { name: 'mod-logs', type: 'text' }] }
];
function App() {
  const [page, setPage] = useState<Page>('Dashboard');
  const [serverId, setServerId] = useState('');
  const [serverName, setServerName] = useState('Discord Sunucunuz');
  const [botToken, setBotToken] = useState('');
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [rightOpen, setRightOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [roles, setRoles] = useState(['Owner', 'Administrator', 'Moderator', 'Member', '@everyone']);
  const [roleData, setRoleData] = useState<DiscordRole[]>([]);
  const [rolePermissionRoleName, setRolePermissionRoleName] = useState('');
  const [rolePermissionValues, setRolePermissionValues] = useState<Record<string, boolean>>({});
  const [roleIds, setRoleIds] = useState<Record<string,string>>({});
  const [modal, setModal] = useState<'server' | 'channel' | 'category' | 'role' | null>(null);
  const [draft, setDraft] = useState('');
  const [channelType, setChannelType] = useState<'text' | 'voice'>('text');
  const [permissionChannelId, setPermissionChannelId] = useState('');
  const [permissionRoleName, setPermissionRoleName] = useState('');
  const [permissionValues, setPermissionValues] = useState<Record<string, 'allow' | 'deny' | 'inherit'>>({});
  const [toast, setToast] = useState('');
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkPrefix, setBulkPrefix] = useState('');
  const [bulkSuffix, setBulkSuffix] = useState('');
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [appVersion, setAppVersion] = useState('…');
  const [updateStatus, setUpdateStatus] = useState('idle');
  const [updateVersion, setUpdateVersion] = useState('');
  const [updatePercent, setUpdatePercent] = useState(0);
  const [updateMessage, setUpdateMessage] = useState('');
  const [lastUpdateCheck, setLastUpdateCheck] = useState('Henüz kontrol edilmedi');
  useEffect(() => {
    window.whippin.getAppVersion().then(setAppVersion).catch(() => setAppVersion('bilinmiyor'));
    return window.whippin.onUpdateStatus(event => {
      setUpdateStatus(event.status);
      if (event.status === 'checking') setLastUpdateCheck(new Date().toLocaleString());
      if (event.version) setUpdateVersion(event.version);
      if (typeof event.percent === 'number') setUpdatePercent(event.percent);
      if (event.message) setUpdateMessage(event.message);
    });
  }, []);
  const checkUpdates = async () => {
    setUpdateStatus('checking'); setUpdateMessage(''); setLastUpdateCheck(new Date().toLocaleString());
    try { const result = await window.whippin.checkForUpdates(); if (result.status === 'development') setUpdateStatus('development'); if (result.version) setUpdateVersion(result.version); }
    catch (error) { setUpdateStatus('error'); setUpdateMessage(error instanceof Error ? error.message : 'Güncelleme kontrolü başarısız.'); }
  };
  const logActivity = (action: string, detail: string) => setActivityEntries(old => [{ id: Date.now() + Math.random(), action, detail, time: new Date().toLocaleString() }, ...old].slice(0, 100));
  const totalChannels = useMemo(() => categories.reduce((n, c) => n + c.channels.length, 0), [categories]);
  const allChannels = useMemo(() => categories.flatMap(c => c.channels), [categories]);
  const selectedPermissionRoleId = roleIds[permissionRoleName];
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const applyStructure = (data: Awaited<ReturnType<typeof window.whippin.getStructure>>) => {
    const categoryChannels = data.channels.filter(ch => ch.type === 4).sort((a,b) => a.position-b.position);
    const next: Category[] = categoryChannels.map(cat => ({
      id: cat.id, name: cat.name, permission_overwrites: cat.permission_overwrites,
      channels: data.channels.filter(ch => ch.parent_id === cat.id && (ch.type === 0 || ch.type === 2)).sort((a,b) => a.position-b.position).map(ch => ({ id: ch.id, name: ch.name, type: ch.type === 2 ? 'voice' : 'text', permission_overwrites: ch.permission_overwrites }))
    }));
    const loose = data.channels.filter(ch => !ch.parent_id && ch.type !== 4 && (ch.type === 0 || ch.type === 2)).sort((a,b) => a.position-b.position);
    if (loose.length) next.unshift({ name: 'KATEGORİSİZ', channels: loose.map(ch => ({ id: ch.id, name: ch.name, type: ch.type === 2 ? 'voice' : 'text', permission_overwrites: ch.permission_overwrites })) });
    setCategories(next);
    setRoleData(data.roles.slice().sort((a,b) => b.position-a.position));
    setRoles(data.roles.slice().sort((a,b) => b.position-a.position).map(r => r.name));
    setRoleIds(Object.fromEntries(data.roles.map(r => [r.name,r.id])));
    setServerName(data.guild.name);
    setServerId(data.guild.id);
    setConnected(true);
  };
  const refreshStructure = async () => { const data = await window.whippin.getStructure(serverId); applyStructure(data); };
  const connectServer = async () => {
    if (!serverId.trim() || !botToken.trim()) { notify('Bot tokenini ve sunucu kimliğini girin.'); return; }
    setBusy(true);
    try { const data = await window.whippin.connect({ token: botToken.trim(), guildId: serverId.trim() }); applyStructure(data); logActivity('Server connected', `Connected to ${data.guild.name}`); setBotToken(''); setModal(null); notify('Discord sunucusu başarıyla bağlandı.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Discord bağlantısı kurulamadı.'); }
    finally { setBusy(false); }
  };
  const addChannel = async () => {
    const enteredName = draft.trim();
    const name = channelType === 'voice' ? enteredName : enteredName.toLowerCase().replace(/\s+/g, '-');
    if (!name) return;
    if (!connected) { notify('Önce Discord botunuzu bağlayın.'); return; }
    setBusy(true);
    try { await window.whippin.createChannel({ guildId: serverId, name, type: channelType }); await refreshStructure(); setDraft(''); setModal(null); logActivity('Channel created', `Created #${name}`); notify('Channel Discord üzerinde oluşturuldu.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Channel oluşturulamadı.'); }
    finally { setBusy(false); }
  };
  const addCategory = async () => {
    const name = draft.trim();
    if (!name) return;
    if (!connected) { notify('Önce Discord botunuzu bağlayın.'); return; }
    setBusy(true);
    try { await window.whippin.createChannel({ guildId: serverId, name, type: 'category' }); await refreshStructure(); setDraft(''); setModal(null); logActivity('Category created', `Created ${name} category`); notify('Category Discord üzerinde oluşturuldu.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Category oluşturulamadı.'); }
    finally { setBusy(false); }
  };
  const addRole = async () => {
    const name = draft.trim();
    if (!name) return;
    if (!connected) { notify('Önce Discord botunuzu bağlayın.'); return; }
    setBusy(true);
    try { await window.whippin.createRole({ guildId: serverId, name }); await refreshStructure(); setDraft(''); setModal(null); logActivity('Role created', `Created role ${name}`); notify('Rol Discord üzerinde oluşturuldu.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Rol oluşturulamadı.'); }
    finally { setBusy(false); }
  };
  const removeChannel = async (categoryName: string, channel: Channel) => {
    if (!channel.id) return;
    setBusy(true);
    try { await window.whippin.deleteChannel(channel.id); await refreshStructure(); logActivity('Channel deleted', `Deleted #${channel.name}`); notify('Channel Discord üzerinden silindi.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Channel could not be deleted.'); }
    finally { setBusy(false); }
  };
  const removeRole = async (name: string) => {
    const roleId = roleIds[name];
    if (!roleId || name === '@everyone') return;
    setBusy(true);
    try { await window.whippin.deleteRole({ guildId: serverId, roleId }); await refreshStructure(); logActivity('Role deleted', `Deleted role ${name}`); notify('Rol Discord üzerinden silindi.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Role could not be deleted.'); }
    finally { setBusy(false); }
  };
  const applyTemplate = async (template: ServerTemplate) => {
    if (!connected) return notify('Önce Discord botunuzu bağlayın.');
    const channelCount = template.categories.reduce((n, category) => n + category.channels.length, 0);
    if (!window.confirm(`Apply "${template.name}"? This will create ${template.categories.length} categories and ${channelCount} channels on your live Discord server. Existing channels will not be changed.`)) return;
    setBusy(true);
    let created = 0;
    try {
      for (const category of template.categories) {
        const createdCategory = await window.whippin.createChannel({ guildId: serverId, name: category.name.toLowerCase().replace(/\s+/g, '-'), type: 'category' });
        logActivity('Template category created', category.name);
        for (const channel of category.channels) {
          await window.whippin.createChannel({ guildId: serverId, name: channel.name, type: channel.type, parentId: createdCategory.id });
          created += 1;
        }
      }
      await refreshStructure();
      logActivity('Template applied', `${template.name}: ${template.categories.length} categories, ${created} channels`);
      notify(`${template.name} applied successfully.`);
    } catch (error) {
      try { await refreshStructure(); } catch {}
      logActivity('Template partially applied', `${template.name}: ${created} channels created before an error`);
      notify(error instanceof Error ? `Template stopped after ${created} channels: ${error.message}` : 'Template could not be completed.');
    } finally { setBusy(false); }
  };
  const runBulkAction = async (action: 'delete' | 'update') => {
    if (!connected) return notify('Önce Discord botunuzu bağlayın.');
    if (!bulkSelected.length) return notify('En az bir kanal seçin.');
    if (action === 'delete' && !window.confirm(`Delete ${bulkSelected.length} selected channels from Discord? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const result = action === 'delete' ? await window.whippin.bulkDeleteChannels(bulkSelected) : await window.whippin.bulkUpdateChannels({ channelIds: bulkSelected, ...(bulkCategory ? { parentId: bulkCategory } : {}), prefix: bulkPrefix, suffix: bulkSuffix });
      await refreshStructure(); setBulkSelected(result.failed.length ? result.succeeded : []); logActivity(action === 'delete' ? 'Bulk delete' : 'Bulk update', `${result.succeeded.length} succeeded, ${result.failed.length} failed`); notify(`${result.succeeded.length} successful, ${result.failed.length} failed.`);
    } catch (error) { notify(error instanceof Error ? error.message : 'Bulk action failed.'); } finally { setBusy(false); }
  };
  const getPermissionTarget = (id: string) => [...categories, ...allChannels].find(item => item.id === id);
  const choosePermissionTarget = (channelId: string, roleName: string) => {
    setPermissionChannelId(channelId); setPermissionRoleName(roleName);
    const target = getPermissionTarget(channelId);
    const overwrite = target?.permission_overwrites?.find(o => o.id === roleIds[roleName]);
    const allow = BigInt(overwrite?.allow || '0'); const deny = BigInt(overwrite?.deny || '0');
    setPermissionValues(Object.fromEntries(permissionBits.map(p => [p.key, (allow & p.bit) !== 0n ? 'allow' : (deny & p.bit) !== 0n ? 'deny' : 'inherit'])));
  };
  const savePermissions = async () => {
    if (!permissionChannelId || !selectedPermissionRoleId) return notify('Önce kategori/kanal ve rol seçin.');
    const target = getPermissionTarget(permissionChannelId);
    const existing = target?.permission_overwrites?.find(o => o.id === selectedPermissionRoleId);
    const mask = permissionBits.reduce((m,p) => m | p.bit, 0n);
    let allow = BigInt(existing?.allow || '0') & ~mask; let deny = BigInt(existing?.deny || '0') & ~mask;
    for (const p of permissionBits) { if (permissionValues[p.key] === 'allow') allow |= p.bit; if (permissionValues[p.key] === 'deny') deny |= p.bit; }
    setBusy(true);
    try { await window.whippin.setChannelPermissions({channelId:permissionChannelId,roleId:selectedPermissionRoleId,allow:allow.toString(),deny:deny.toString()}); await refreshStructure(); logActivity('İzinler güncellendi', permissionRoleName + ' → ' + (target?.name || permissionChannelId)); notify('İzinler Discord üzerine kaydedildi.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'İzinler kaydedilemedi.'); } finally { setBusy(false); }
  };
  const chooseRolePermissionTarget = (roleName: string) => {
    setRolePermissionRoleName(roleName);
    const role = roleData.find(item => item.name === roleName);
    const bits = BigInt(role?.permissions || '0');
    setRolePermissionValues(Object.fromEntries(rolePermissionBits.map(p => [p.key, (bits & p.bit) !== 0n])));
  };
  const saveRolePermissions = async () => {
    const role = roleData.find(item => item.name === rolePermissionRoleName);
    if (!role) return notify('Düzenlenecek rolü seçin.');
    const mask = rolePermissionBits.reduce((m,p) => m | p.bit, 0n);
    let permissions = BigInt(role.permissions || '0') & ~mask;
    for (const p of rolePermissionBits) if (rolePermissionValues[p.key]) permissions |= p.bit;
    setBusy(true);
    try { await window.whippin.setRolePermissions({guildId:serverId,roleId:role.id,permissions:permissions.toString()}); await refreshStructure(); chooseRolePermissionTarget(rolePermissionRoleName); logActivity('Rol izinleri güncellendi', rolePermissionRoleName); notify('Rol izinleri kaydedildi.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Rol izinleri kaydedilemedi.'); } finally { setBusy(false); }
  };
  const buildPositionPayload = (items: Category[]) => {
    const positions: { id: string; position: number; parent_id?: string | null }[] = [];
    let position = 0;
    for (const category of items) {
      if (category.id && category.name !== 'KATEGORİSİZ') positions.push({id:category.id,position:position++});
      for (const channel of category.channels) if (channel.id) positions.push({id:channel.id,position:position++,parent_id:category.id || null});
    }
    return positions;
  };
  const saveCategoryOrder = async (items: Category[], action: string) => {
    const positions = buildPositionPayload(items);
    if (!positions.length) return;
    setBusy(true);
    try { await window.whippin.reorderChannels({guildId:serverId,positions}); await refreshStructure(); logActivity('Sunucu sıralaması değişti',action); notify('Yeni sıralama Discord üzerine kaydedildi.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Sıralama kaydedilemedi.'); } finally { setBusy(false); }
  };
  const editCategory = async (category: Category) => {
    if (!category.id) return;
    const name = window.prompt('Yeni kategori adı:',category.name);
    if (!name?.trim() || name.trim() === category.name) return;
    setBusy(true);
    try { await window.whippin.updateChannel({channelId:category.id,name:name.trim()}); await refreshStructure(); logActivity('Kategori düzenlendi',name.trim()); notify('Kategori adı güncellendi.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Kategori düzenlenemedi.'); } finally { setBusy(false); }
  };
  const deleteCategory = async (category: Category) => {
    if (!category.id) return;
    if (!window.confirm('Bu kategoriyi silmek istiyor musunuz? İçindeki kanallar silinmez, kategorisiz kalır.')) return;
    setBusy(true);
    try { await window.whippin.deleteChannel(category.id); await refreshStructure(); logActivity('Kategori silindi',category.name); notify('Kategori silindi; kanallar korundu.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Kategori silinemedi.'); } finally { setBusy(false); }
  };
  const editChannel = async (channel: Channel) => {
    if (!channel.id) return;
    const name = window.prompt('Yeni kanal adı:',channel.name);
    if (!name?.trim() || name.trim() === channel.name) return;
    setBusy(true);
    try { await window.whippin.updateChannel({channelId:channel.id,name:name.trim()}); await refreshStructure(); logActivity('Kanal yeniden adlandırıldı',name.trim()); notify('Kanal adı güncellendi.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Kanal düzenlenemedi.'); } finally { setBusy(false); }
  };
  const moveChannel = async (channel: Channel, parentId: string) => {
    if (!channel.id) return;
    setBusy(true);
    try { await window.whippin.updateChannel({channelId:channel.id,parentId:parentId === 'none' ? null : parentId}); await refreshStructure(); logActivity('Kanal taşındı',channel.name); notify('Kanal yeni kategoriye taşındı.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Kanal taşınamadı.'); } finally { setBusy(false); }
  };
  const moveCategory = async (category: Category, delta: number) => {
    const list = categories.filter(c => c.id);
    const index = list.findIndex(c => c.id === category.id); const nextIndex = index + delta;
    if (index < 0 || nextIndex < 0 || nextIndex >= list.length) return;
    [list[index],list[nextIndex]] = [list[nextIndex],list[index]];
    const loose = categories.find(c => !c.id);
    await saveCategoryOrder(loose ? [loose,...list] : list,'Kategori sırası');
  };
  const moveChannelOrder = async (category: Category, channel: Channel, delta: number) => {
    const items = categories.map(c => ({...c,channels:[...c.channels]}));
    const group = items.find(c => c.id === category.id || (!c.id && c.name === category.name));
    if (!group) return;
    const index = group.channels.findIndex(ch => ch.id === channel.id); const nextIndex = index + delta;
    if (index < 0 || nextIndex < 0 || nextIndex >= group.channels.length) return;
    [group.channels[index],group.channels[nextIndex]] = [group.channels[nextIndex],group.channels[index]];
    await saveCategoryOrder(items,'Kanal sırası');
  };
  const syncCategoryPermissions = async (category: Category) => {
    if (!category.id || !window.confirm('Bu kategorinin izinlerini içindeki tüm kanallara uygulamak istiyor musunuz? Kanalların mevcut izinleri kategori izinleriyle eşitlenir.')) return;
    setBusy(true);
    try { const result = await window.whippin.syncCategoryPermissions(category.id); await refreshStructure(); notify(result.synced + ' kanal eşitlendi, ' + result.failed.length + ' hata.'); logActivity('Kategori izinleri eşitlendi',category.name); }
    catch (error) { notify(error instanceof Error ? error.message : 'İzinler eşitlenemedi.'); } finally { setBusy(false); }
  };
  const visibleCategories = categories.map(c => ({ ...c, channels: c.channels.filter(ch => ch.name.toLowerCase().includes(query.toLowerCase())) })).filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.channels.length);
  const openModal = (kind: typeof modal) => { setDraft(''); setModal(kind); };
  const title = pageLabels[page];
  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <div className="brand-row"><div className="brand-mark"><span>W</span></div><div className="brand-name">WHIPPIN<span>.</span><small>DISCORD MANAGER</small></div><button className="icon-button collapse-btn" onClick={() => setSidebarOpen(false)} title="Kenar çubuğunu daralt"><ChevronLeft size={17}/></button></div>
      <button className="server-switch" onClick={() => openModal('server')}><div className="server-avatar"><Server size={17}/></div><span><b>{connected ? serverName : 'Sunucu seç'}</b><small>{connected ? 'Sunucu çalışma alanı' : 'Bağlı sunucu yok'}</small></span><ChevronDown size={16}/></button>
      <div className="nav-scroll">{navigation.map(group => <div className="nav-group" key={group.group}><div className="nav-label">{group.group}</div>{group.items.map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => setPage(item.label)} className={`nav-item ${page === item.label ? 'active' : ''}`}><Icon size={17}/><span>{pageLabels[item.label]}</span>{item.label === 'Activity Logs' && <i className="nav-dot"/>}</button>; })}</div>)}</div>
      <div className="sidebar-bottom"><div className="connection-mini"><span className={connected ? 'status-dot online' : 'status-dot'}/><div><b>{connected ? 'Çalışma alanı hazır' : 'Bağlı değil'}</b><small>{connected ? 'Discord bot bağlantısı' : 'Discord botu bağla'}</small></div><button className="icon-button" onClick={() => openModal('server')}><ArrowDownUp size={15}/></button></div><div className="user-row"><div className="user-avatar">W</div><div><b>WHIPPIN Çalışma Alanı</b><small>Kişisel sürüm</small></div><button className="icon-button" onClick={() => setPage('Settings')}><Settings size={16}/></button></div></div>
    </aside>
    {!sidebarOpen && <button className="reopen-sidebar" onClick={() => setSidebarOpen(true)}><Menu size={18}/></button>}
    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>WHIPPIN</span><ChevronRight size={14}/><b>{pageLabels[page]}</b></div><div className="top-actions"><label className="global-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Modüllerde ara..." /><kbd>CTRL K</kbd></label><span className={connected ? 'top-status online' : 'top-status'} title={connected ? 'Bağlandı' : 'Çevrimdışı'}/><button className="support-button" onClick={() => notify('Yardım merkezi sonraki güncellemede sunulacak.')}><CircleHelp size={16}/> Destek</button><button className="icon-button notification" onClick={() => notify('Yeni bildiriminiz yok.')}><Bell size={17}/><i/></button><button className="profile-chip" onClick={() => setPage('Settings')}>W<ChevronDown size={14}/></button></div></header>
      <div className="content-scroll">
        <section className="welcome-row"><div><div className="eyebrow"><Sparkles size={13}/> SUNUCU KONTROL MERKEZİ</div><h1>{page === 'Dashboard' ? 'Welcome to WHIPPIN.' : title}</h1><p>{page === 'Dashboard' ? 'Your server. Your structure. Completely under control.' : page === 'Server Structure' ? 'Explore and organize every category and channel in one place.' : `Manage your Discord server ${page.toLowerCase()} from one workspace.`}</p></div><button className="primary-button" onClick={() => openModal('server')}><Plus size={16}/> {connected ? 'Sunucu değiştir' : 'Connect server'}</button></section>
        {page === 'Dashboard' && <>
          <section className="server-banner"><div className="server-emblem"><Bot size={25}/></div><div className="server-meta"><h2>{connected ? serverName : 'Your server workspace'}</h2><span><i className={connected ? 'status-dot online' : 'status-dot'}/>{connected ? 'BOT CONNECTION READY' : 'WAITING FOR CONNECTION'}</span></div><div className="banner-spacer"/><div className="banner-pill"><Users size={17}/><b>—</b><small>ÜYELER</small></div><div className="banner-pill"><Crown size={17}/><b>—</b><small>ROLÜNÜZ</small></div></section>
          <div className="section-heading"><div><h3>SUNUCU ÖZETİ</h3><p>Sunucu yapınıza genel bakış</p></div><button className="subtle-button" onClick={async () => { if(!connected) return notify('Connect a server first.'); try { await refreshStructure(); notify('Server data synchronized.'); } catch(e) { notify(e instanceof Error ? e.message : 'Sync failed.'); } }}><Activity size={15}/> Yenile</button></div>
          <section className="stats-grid">{[{label:'TOTAL CHANNELS',value:connected ? totalChannels : '—',icon:MessageSquare,change:'Text & voice channels'},{label:'CATEGORIES',value:connected ? categories.length : '—',icon:Folder,change:'Organized sections'},{label:'SERVER ROLES',value:connected ? roles.length : '—',icon:Shield,change:'Including @everyone'},{label:'BOT STATUS',value:connected ? 'Ready' : 'Çevrimdışı',icon:Wifi,change:connected ? 'Connection established' : 'Connect to get started',status:true}].map((s,i)=>{const Icon=s.icon;return <article className="stat-card" key={s.label}><div className="stat-top"><span>{s.label}</span><div className="stat-icon"><Icon size={17}/></div></div><strong className={s.status && connected ? 'success-text' : ''}>{s.value}</strong><small>{s.change}</small></article>})}</section>
          <section className="dashboard-grid"><article className="panel structure-panel"><div className="panel-heading"><div><h3>SUNUCU YAPISI</h3><p>Category ve kanal önizlemesi</p></div><button className="text-button" onClick={() => setPage('Server Structure')}>Tümünü gör <ChevronRight size={14}/></button></div>{connected ? <div className="structure-preview">{categories.slice(0,3).map(c=><div className="preview-category" key={c.id || c.name}><div className="preview-cat-name"><Folder size={14}/>{c.name}<span>{c.channels.length}</span></div>{c.channels.slice(0,3).map(ch=><div className="preview-channel" key={ch.id || ch.name}>{ch.type === 'voice' ? <Headphones size={14}/> : <Hash size={14}/>} {ch.name}</div>)}</div>)}</div> : <div className="empty-state"><div className="empty-icon"><Server size={23}/></div><b>Sunucunuz burada görünecek</b><span>Gerçek sunucu yapınızı yüklemek için bir Discord botu bağlayın.</span><button className="outline-button" onClick={() => openModal('server')}>Discord sunucusunu bağla</button></div>}</article>
            <article className="panel quick-panel"><div className="panel-heading"><div><h3>HIZLI İŞLEMLER</h3><p>Yönetim işlemlerine hızlıca ulaşın</p></div><Zap size={17} className="muted-icon"/></div><div className="quick-list"><button onClick={() => openModal('channel')}><div className="quick-icon"><Hash size={17}/></div><span><b>Create channel</b><small>Yeni bir yazı veya ses kanalı ekleyin</small></span><ChevronRight size={16}/></button><button onClick={() => openModal('category')}><div className="quick-icon"><Folder size={17}/></div><span><b>Create category</b><small>Sunucu düzeninizi organize edin</small></span><ChevronRight size={16}/></button><button onClick={() => openModal('role')}><div className="quick-icon"><Shield size={17}/></div><span><b>Create role</b><small>Yeni bir sunucu rolü oluşturun</small></span><ChevronRight size={16}/></button><button onClick={() => setPage('Permissions')}><div className="quick-icon"><LockKeyhole size={17}/></div><span><b>İzinleri yönet</b><small>Rol ve kanal erişimini yapılandırın</small></span><ChevronRight size={16}/></button></div></article></section>
          <section className="panel activity-panel"><div className="panel-heading"><div><h3>SON İŞLEMLER</h3><p>Çalışma alanınızdaki son işlemler</p></div><button className="text-button" onClick={() => setPage('Activity Logs')}>İşlem geçmişi <ChevronRight size={14}/></button></div><div className="activity-empty"><Clock3 size={17}/> İşlem geçmişi sonraki bir güncellemede eklenecek.</div></section>
        </>}
        {page === 'Server Structure' && <section className="panel manager-panel">
          <div className="panel-heading"><div><h3>SUNUCU YAPISI</h3><p>Kategorileri, kanalları ve sıralarını yönetin</p></div><div className="inline-actions"><button className="outline-button" onClick={() => openModal('category')}><Plus size={16}/> Kategori ekle</button><button className="primary-button small" onClick={() => openModal('channel')}><Plus size={16}/> Kanal ekle</button></div></div>
          {!connected && <div className="notice"><Shield size={18}/><span>Önizleme modu. Gerçek sunucuda değişiklik yapmak için Discord botunuzu bağlayın.</span></div>}
          {visibleCategories.map(c=><div className="manager-category" key={c.id || c.name}>
            <div className="manager-category-title">
              <Folder size={18}/><b>{c.name}</b><span>{c.channels.length} kanal</span>
              {connected && c.id && <div className="inline-actions category-tools">
                <button className="icon-button" title="Yukarı taşı" disabled={busy} onClick={()=>moveCategory(c,-1)}><ArrowUp size={16}/></button>
                <button className="icon-button" title="Aşağı taşı" disabled={busy} onClick={()=>moveCategory(c,1)}><ArrowDown size={16}/></button>
                <button className="icon-button" title="Kategori izinlerini kanallara eşitle" disabled={busy} onClick={()=>syncCategoryPermissions(c)}><ShieldCheck size={16}/></button>
                <button className="icon-button" title="Kategori adını düzenle" disabled={busy} onClick={()=>editCategory(c)}><Settings size={16}/></button>
                <button className="icon-button danger-icon" title="Kategoriyi sil" disabled={busy} onClick={()=>deleteCategory(c)}><X size={16}/></button>
              </div>}
            </div>
            {c.channels.map(ch=><div className="manager-channel channel-management-row" key={ch.id || ch.name}>
              <div className="channel-main">{ch.type === 'voice' ? <Headphones size={17}/> : <Hash size={17}/>}<span>{ch.name}</span><small>{ch.type === 'voice' ? 'SES' : 'YAZI'}</small></div>
              {connected && ch.id && <div className="inline-actions channel-tools">
                <select aria-label="Kanalı kategoriye taşı" className="move-select" value={c.id || 'none'} onChange={e=>moveChannel(ch,e.target.value)} disabled={busy}>
                  <option value="none">Kategorisiz</option>{categories.filter(cat=>cat.id).map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <button className="icon-button" title="Yukarı taşı" disabled={busy} onClick={()=>moveChannelOrder(c,ch,-1)}><ArrowUp size={15}/></button>
                <button className="icon-button" title="Aşağı taşı" disabled={busy} onClick={()=>moveChannelOrder(c,ch,1)}><ArrowDown size={15}/></button>
                <button className="icon-button" title="Kanal adını düzenle" disabled={busy} onClick={()=>editChannel(ch)}><Settings size={15}/></button>
                <button className="icon-button danger-icon" title="Kanalı sil" disabled={busy} onClick={()=>removeChannel(c.name,ch)}><X size={15}/></button>
              </div>}
            </div>)}
            {!c.channels.length && <div className="empty-category">Bu kategoride henüz kanal yok.</div>}
          </div>)}
          {connected && !visibleCategories.length && <div className="empty-state compact"><Folder size={24}/><b>Henüz kategori veya kanal yok</b><span>Yeni bir kategori ya da kanal oluşturarak başlayın.</span></div>}
        </section>}
        {page === 'Channels' && <section className="panel manager-panel"><div className="panel-heading"><div><h3>KANAL YÖNETİMİ</h3><p>Sunucu kanallarını oluşturun, düzenleyin ve yapılandırın</p></div><button className="primary-button small" onClick={() => openModal('channel')}><Plus size={15}/> Yeni kanal</button></div><div className="empty-state compact"><Hash size={25}/><b>Channel management workspace</b><span>Canlı kanalları görüntülemek ve yönetmek için Sunucu Yapısı bölümünü kullanın.</span><button className="outline-button" onClick={() => setPage('Server Structure')}>Yapı gezginini aç</button></div></section>}
        {page === 'Roles' && <section className="panel manager-panel">
          <div className="panel-heading"><div><h3>ROL YÖNETİMİ</h3><p>Rolleri oluşturun, silin ve ayrıntılı sunucu izinlerini yönetin</p></div><button className="primary-button small" onClick={() => openModal('role')}><Plus size={16}/> Yeni rol</button></div>
          {!connected && <div className="notice"><Shield size={18}/> Rol izinlerini düzenlemek için önce Discord sunucunuzu bağlayın.</div>}
          <div className="role-list">{roles.map((r,i)=><div className="role-row" key={roleIds[r] || r}><div className="role-color" style={{background:['#bd8cff','#f0b45f','#65a8e8','#65c7a2','#777181'][i%5]}}/><b>{r}</b><span>{i===0?'EN YÜKSEK':r==='@everyone'?'VARSAYILAN':'ROL'}</span>{connected && <button className="outline-button role-edit-button" onClick={()=>chooseRolePermissionTarget(r)}>İzinleri düzenle</button>}{connected && r !== '@everyone' && <button className="icon-button danger-icon" onClick={() => removeRole(r)} title="Rolü sil" disabled={busy}><X size={16}/></button>}</div>)}</div>
          {connected && rolePermissionRoleName && <div className="permission-editor">
            <div className="panel-heading"><div><h3>{rolePermissionRoleName} — ROL İZİNLERİ</h3><p>Seçili rolün sunucu genelindeki izinlerini düzenleyin</p></div><span className="coming-badge">{rolePermissionBits.filter(p=>rolePermissionValues[p.key]).length} AÇIK</span></div>
            <div className="permission-grid">{rolePermissionBits.map(p=><button type="button" key={p.key} className={'permission-toggle '+(rolePermissionValues[p.key]?'is-allowed':'')} onClick={()=>setRolePermissionValues(old=>({...old,[p.key]:!old[p.key]}))}><span className="permission-check">{rolePermissionValues[p.key]?'✓':''}</span><b>{p.label}</b><span className="permission-state">{rolePermissionValues[p.key]?'AÇIK':'KAPALI'}</span></button>)}</div>
            <div className="notice warning-notice"><Shield size={17}/><span>Yönetici izni tüm izinleri kapsar ve Discord'da tam yetki verir. Yalnızca güvendiğiniz rollere verin.</span></div>
            <div className="inline-actions editor-actions"><button className="outline-button" onClick={()=>setRolePermissionRoleName('')}>Kapat</button><button className="primary-button" disabled={busy} onClick={saveRolePermissions}>Rol izinlerini kaydet <ShieldCheck size={16}/></button></div>
          </div>}
        </section>}
        {page === 'Permissions' && <section className="panel manager-panel">
          <div className="panel-heading"><div><h3>KATEGORİ VE KANAL İZİNLERİ</h3><p>Her rol için kategori veya kanal bazında erişim kuralları belirleyin</p></div></div>
          {!connected ? <div className="empty-state compact"><LockKeyhole size={26}/><b>Discord sunucunuzu bağlayın</b><span>Canlı izin yönetimi için resmi bot bağlantısı gerekir.</span><button className="outline-button" onClick={() => openModal('server')}>Discord'u bağla</button></div> : <>
            <div className="permission-target-grid">
              <label className="field-label">KATEGORİ / KANAL
                <select value={permissionChannelId} onChange={e=>choosePermissionTarget(e.target.value,permissionRoleName)}>
                  <option value="">Bir kategori veya kanal seçin</option>
                  {categories.filter(c=>c.id).map(c=><optgroup key={c.id} label={'KATEGORİ · '+c.name}><option value={c.id}>📁 {c.name} (kategori)</option>{c.channels.filter(ch=>ch.id).map(ch=><option key={ch.id} value={ch.id}>{ch.type==='voice'?'🔊':'#'} {ch.name}</option>)}</optgroup>)}
                  {categories.filter(c=>!c.id).flatMap(c=>c.channels.filter(ch=>ch.id).map(ch=><option key={ch.id} value={ch.id}># {ch.name} (kategorisiz)</option>))}
                </select>
              </label>
              <label className="field-label">ROL
                <select value={permissionRoleName} onChange={e=>choosePermissionTarget(permissionChannelId,e.target.value)}><option value="">Bir rol seçin</option>{roles.map(r=><option key={r} value={r}>{r}</option>)}</select>
              </label>
            </div>
            <div className="notice"><Shield size={18}/><span><b>Üç durumlu izin sistemi:</b> İzin ver, engelle veya varsayılanı kullan. Varsayılan seçeneği ilgili izni bu kategori/kanal için özel olarak tanımlamaz. Diğer izin bitleri korunur.</span></div>
            {permissionChannelId && permissionRoleName ? <>
              <div className="permission-legend"><span><i className="legend-allow"/> İzin ver</span><span><i className="legend-deny"/> Engelle</span><span><i className="legend-inherit"/> Varsayılan</span></div>
              <div className="permission-grid">{permissionBits.map(p=>{
                const state=permissionValues[p.key] || 'inherit';
                const next=state==='inherit'?'allow':state==='allow'?'deny':'inherit';
                return <button type="button" key={p.key} className={'permission-toggle state-'+state} onClick={()=>setPermissionValues(old=>({...old,[p.key]:next}))}>
                  <span className="permission-check">{state==='allow'?'✓':state==='deny'?'×':'—'}</span><b>{p.label}</b><span className="permission-state">{state==='allow'?'İZİN VER':state==='deny'?'ENGELLE':'VARSAYILAN'}</span>
                </button>;
              })}</div>
              <div className="inline-actions editor-actions"><button className="outline-button" onClick={()=>setPermissionValues(Object.fromEntries(permissionBits.map(p=>[p.key,'inherit'])))}>Tümünü varsayılana al</button><button className="primary-button" disabled={busy} onClick={savePermissions}>İzinleri kaydet <ShieldCheck size={16}/></button></div>
              {categories.some(c=>c.id===permissionChannelId) && <div className="notice"><Folder size={17}/><span>Bu bir kategori. Kaydettikten sonra isterseniz kategori izinlerini altındaki tüm kanallara eşitlemek için Sunucu Yapısı bölümündeki kalkan düğmesini kullanabilirsiniz.</span></div>}
            </> : <div className="empty-state compact"><LockKeyhole size={25}/><b>Önce hedef ve rol seçin</b><span>İzinleri görmek ve değiştirmek için yukarıdan kategori/kanal ile rol seçin.</span></div>}
          </>}
        </section>}
        {page === 'Templates' && <section className="panel manager-panel">
          <div className="panel-heading"><div><h3>SERVER TEMPLATES</h3><p>Bağlı Discord sunucunuzda hazır kanal düzeni oluşturun</p></div><span className="coming-badge">3 HAZIR ŞABLON</span></div>
          <div className="notice"><Blocks size={16}/><span>Templates only add categories and channels. They never delete or overwrite your existing server structure. You can review the result in Server Structure.</span></div>
          <div className="template-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:13,marginTop:16}}>
            {serverTemplates.map(template=><article key={template.id} className="stat-card" style={{minHeight:230,display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
              <div className="stat-icon" style={{width:42,height:42}}><Blocks size={20}/></div>
              <h3 style={{fontFamily:'Space Grotesk',fontSize:15,margin:'15px 0 6px'}}>{template.name}</h3>
              <p style={{fontSize:10,color:'#92899d',lineHeight:1.6,minHeight:34,margin:0}}>{template.description}</p>
              <div style={{display:'flex',gap:7,flexWrap:'wrap',margin:'13px 0',fontSize:9,color:'#bca1df'}}><span>{template.categories.length} categories</span><span>·</span><span>{template.categories.reduce((n,c)=>n+c.channels.length,0)} channels</span></div>
              <button className="primary-button small" style={{marginTop:'auto'}} disabled={busy||!connected} onClick={()=>applyTemplate(template)}>{busy?'Uygulanıyor…':'Şablonu uygula'} <ChevronRight size={14}/></button>
            </article>)}
          </div>
          {!connected && <div className="empty-state compact"><Server size={24}/><b>Şablonları uygulamak için sunucunuzu bağlayın</b><span>Şablonları burada önizleyebilirsiniz; değişiklikler için resmi bot bağlantısı gerekir.</span><button className="outline-button" onClick={()=>openModal('server')}>Connect Discord</button></div>}
        </section>}
        {page === 'Activity Logs' && <section className="panel manager-panel">
          <div className="panel-heading"><div><h3>WORKSPACE ACTIVITY</h3><p>Bu WHIPPIN oturumunda gerçekleştirilen son işlemler</p></div><div className="inline-actions"><span className="coming-badge">{activityEntries.length} EVENTS</span><button className="outline-button" disabled={!activityEntries.length} onClick={()=>setActivityEntries([])}>Geçmişi temizle</button></div></div>
          {!activityEntries.length ? <div className="empty-state compact"><ClipboardList size={27}/><b>No activity yet</b><span>Başarılı sunucu değişiklikleri işlem adı ve saatiyle burada görünür.</span></div> : <div className="role-list">{activityEntries.map(entry=><div className="role-row" key={entry.id}><div className="role-color" style={{background:'#a879f5'}}/><div style={{flex:1,minWidth:0}}><b>{entry.action}</b><small style={{display:'block',fontSize:10,color:'#92899d',marginTop:4}}>{entry.detail}</small></div><time style={{fontSize:9,color:'#92899d',whiteSpace:'nowrap'}}>{entry.time}</time></div>)}</div>}
          <div className="notice"><Clock3 size={16}/><span>Activity history is currently kept for this app session and is cleared when the application is restarted.</span></div>
        </section>}
        {page === 'Settings' && <section className="panel manager-panel">
          <div className="panel-heading"><div><h3>APPLICATION SETTINGS</h3><p>WHIPPIN güncellemelerini ve uygulama bilgilerini yönetin</p></div><span className="coming-badge">VERSION {appVersion}</span></div>
          <div className="manager-category" style={{padding:18}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}><div className="stat-icon" style={{width:42,height:42}}><Zap size={20}/></div><div><b style={{fontSize:13}}>WHIPPIN Otomatik Güncelleme</b><div style={{fontSize:10,color:'#91889d',marginTop:4}}>Check GitHub for the latest official version and install it without downloading an installer manually.</div></div></div>
            <div className="detail-line"><span>Yüklü sürüm</span><b>v{appVersion}</b></div><div className="detail-line"><span>En son sürüm</span><b>{updateVersion ? `v${updateVersion}` : 'Henüz kontrol edilmedi'}</b></div><div className="detail-line"><span>Son kontrol</span><b>{lastUpdateCheck}</b></div>
            {updateStatus === 'downloading' && <div style={{marginTop:16}}><div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#cbb6e6',marginBottom:7}}><span>Güncelleme indiriliyor…</span><b>{updatePercent}%</b></div><div style={{height:7,background:'#292231',borderRadius:8,overflow:'hidden'}}><div style={{height:'100%',width:`${updatePercent}%`,background:'linear-gradient(90deg,#8050bd,#c49aff)',transition:'width .2s'}}/></div></div>}
            <div className="notice" style={{marginTop:16}}><Shield size={16}/><span>{updateStatus === 'checking' ? 'GitHub sürümleri kontrol ediliyor…' : updateStatus === 'available' ? `Version ${updateVersion} found. It is downloading automatically.` : updateStatus === 'downloading' ? 'Güncelleme arka planda indiriliyor. WHIPPIN’i kullanmaya devam edebilirsiniz.' : updateStatus === 'downloaded' ? `Version ${updateVersion} is ready. Restart WHIPPIN to install it.` : updateStatus === 'not-available' ? 'WHIPPIN’in en güncel sürümünü kullanıyorsunuz.' : updateStatus === 'development' ? 'Güncelleme kontrolü kurulu Windows sürümünde kullanılabilir.' : updateStatus === 'error' ? `Update error: ${updateMessage}` : 'Otomatik kontroller WHIPPIN açıldığında ve her 6 saatte bir yapılır. Güncellemeler resmi WHIPPIN GitHub sürümlerinden alınır.'}</span></div>
            <div className="inline-actions" style={{justifyContent:'flex-end',marginTop:16}}><button className="outline-button" disabled={updateStatus === 'checking' || updateStatus === 'downloading'} onClick={checkUpdates}><Activity size={14}/> Güncellemeleri kontrol et</button>{updateStatus === 'downloaded' && <button className="primary-button" onClick={() => window.whippin.installUpdate()}>Yeniden başlat ve yükle <ChevronRight size={15}/></button>}</div>
          </div><div className="notice"><LockKeyhole size={16}/><span>Only updates published by the official WHIPPIN repository are checked. Your Discord bot token remains stored locally in Windows secure storage.</span></div>
        </section>}
        {page === 'Bulk Actions' && <section className="panel manager-panel">
          <div className="panel-heading"><div><h3>BULK CHANNEL OPERATIONS</h3><p>Select channels and apply changes across your server</p></div><span className="coming-badge">{bulkSelected.length} SELECTED</span></div>
          {!connected ? <div className="empty-state compact"><Zap size={25}/><b>Connect a Discord server</b><span>Toplu işlemler resmi botunuz aracılığıyla canlı sunucunuzda gerçekleştirilir.</span><button className="outline-button" onClick={() => openModal('server')}>Connect Discord</button></div> : <>
            <div className="inline-actions" style={{marginBottom:12}}><button className="outline-button" onClick={()=>setBulkSelected(allChannels.filter(ch=>ch.id).map(ch=>ch.id!))}>Tümünü seç</button><button className="outline-button" onClick={()=>setBulkSelected([])}>Seçimi temizle</button></div>
            <div className="role-list">{categories.map(cat=><div key={cat.id||cat.name}><div className="manager-category-title"><Folder size={15}/><b>{cat.name}</b></div>{cat.channels.filter(ch=>ch.id).map(ch=><label className="manager-channel" key={ch.id} style={{justifyContent:'flex-start',gap:12,cursor:'pointer'}}><input type="checkbox" checked={bulkSelected.includes(ch.id!)} onChange={e=>setBulkSelected(old=>e.target.checked?[...old,ch.id!]:old.filter(id=>id!==ch.id))}/>{ch.type==='voice'?<Headphones size={15}/>:<Hash size={15}/>}<span>{ch.name}</span><small>{ch.type.toUpperCase()}</small></label>)}</div>)}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:18}}>
              <label className="field-label">MOVE TO CATEGORY<select value={bulkCategory} onChange={e=>setBulkCategory(e.target.value)}><option value="">Mevcut kategoriyi koru</option>{categories.filter(c=>c.id).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}<option value="none">Category yok</option></select></label><div/>
              <label className="field-label">ÖN EKLE YENİDEN ADLANDIR<input value={bulkPrefix} onChange={e=>setBulkPrefix(e.target.value)} placeholder="e.g. vip-"/></label>
              <label className="field-label">SON EKLE YENİDEN ADLANDIR<input value={bulkSuffix} onChange={e=>setBulkSuffix(e.target.value)} placeholder="e.g. -2026"/></label>
            </div>
            <div className="notice"><Shield size={16}/><span>Operations affect real Discord channels. Failed items are reported separately; bulk delete cannot be undone.</span></div>
            <div className="inline-actions" style={{justifyContent:'flex-end',marginTop:16}}><button className="outline-button" disabled={busy||!bulkSelected.length} onClick={()=>runBulkAction('delete')} style={{color:'#ff9b9b',borderColor:'#704044'}}>Seçilenleri sil</button><button className="primary-button" disabled={busy||!bulkSelected.length||(!bulkCategory&&!bulkPrefix&&!bulkSuffix)} onClick={()=>runBulkAction('update')}>{busy?'Uygulanıyor…':'Taşıma / yeniden adlandırmayı uygula'} <Zap size={15}/></button></div>
          </>}
        </section>}
        {page !== 'Dashboard' && page !== 'Server Structure' && page !== 'Channels' && page !== 'Roles' && page !== 'Permissions' && page !== 'Bulk Actions' && page !== 'Activity Logs' && page !== 'Templates' && page !== 'Settings' && <section className="panel coming-panel"><div className="coming-icon"><Command size={27}/></div><div className="eyebrow">WHIPPIN MODULE</div><h2>{page}</h2><p>Bu alanın arayüzü hazır; özellikleri sonraki geliştirme aşamasında eklenecek.</p><span className="coming-badge"><Sparkles size={13}/> Sonraki geliştirme aşamasında</span></section>}
        <footer className="app-footer"><span>WHIPPIN <b>v{appVersion}</b></span><span>SUNUCU SAHİPLERİ İÇİN <i/> GÜVENLİ TASARIM</span></footer>
      </div>
    </main>
    {rightOpen && <aside className="right-panel"><div className="right-header"><div><span className="eyebrow">CANLI ÇALIŞMA ALANI</span><h3>SUNUCU DETAYLARI</h3></div><button className="icon-button" onClick={() => setRightOpen(false)}><X size={16}/></button></div><div className="right-server-card"><div className="right-server-icon"><Server size={23}/></div><b>{connected ? serverName : 'Sunucu seçilmedi'}</b><small>{connected ? serverId : 'Başlamak için sunucu bağlayın'}</small><span className={connected ? 'connection-label online-label' : 'connection-label'}><i/> {connected ? 'BOT HAZIR' : 'BAĞLANTI YOK'}</span></div><div className="right-section-title">CONNECTION</div><div className="detail-line"><span>Bot durumu</span><b className={connected ? 'success-text' : ''}>{connected ? 'Bağlandı' : 'Çevrimdışı'}</b></div><div className="detail-line"><span>Ağ geçidi</span><b>Discord API</b></div><div className="detail-line"><span>Son eşitleme</span><b>{connected ? 'Canlı eşitleme' : '—'}</b></div><div className="right-section-title">HIZLI İSTATİSTİKLER</div><div className="right-stat"><span><Hash size={14}/> Channels</span><b>{connected ? totalChannels : '—'}</b></div><div className="right-stat"><span><Folder size={14}/> Kategoriler</span><b>{connected ? categories.length : '—'}</b></div><div className="right-stat"><span><Shield size={14}/> Roles</span><b>{connected ? roles.length : '—'}</b></div><div className="right-bottom"><div className="secure-note"><LockKeyhole size={15}/><span><b>Güvenli çalışma alanı</b><small>Resmi Discord bot entegrasyonu. Kullanıcı tokeniyle giriş yapılmaz.</small></span></div><button className="right-connect" onClick={() => openModal('server')}>{connected ? 'Sunucu değiştir' : 'Discord’u bağla'} <ChevronRight size={15}/></button></div></aside>}
    {!rightOpen && <button className="right-reopen" onClick={() => setRightOpen(true)}><ChevronLeft size={16}/></button>}
    {modal && <div className="modal-backdrop" onMouseDown={e => {if(e.target===e.currentTarget)setModal(null)}}><div className="modal-card"><div className="modal-top"><div><span className="eyebrow">WHIPPIN WORKSPACE</span><h2>{modal==='server'?'Discord sunucusuna bağlan':modal==='channel'?'Channel oluştur':modal==='category'?'Category oluştur':'Rol oluştur'}</h2></div><button className="icon-button" onClick={() => setModal(null)}><X size={18}/></button></div>{modal==='server' ? <><div className="notice"><Shield size={17}/><span>Resmi bir Discord botu kullanın. Kişisel Discord hesap tokeninizi asla girmeyin.</span></div><label className="field-label">BOT TOKEN<input type="password" value={botToken} onChange={e=>setBotToken(e.target.value)} placeholder="Paste your Discord bot token" autoComplete="off"/></label><label className="field-label">SERVER ID<input value={serverId} onChange={e=>setServerId(e.target.value)} placeholder="Enter your Discord server ID"/></label><div className="modal-hint">Create a bot in the Discord Developer Portal, invite it to your server with Manage Channels and Manage Roles, then paste its bot token here. The token is encrypted in Windows secure storage.</div><button className="primary-button full-button" disabled={busy} onClick={connectServer}>{busy ? 'Bağlanıyor…' : 'Botu bağla ve sunucuyu yükle'} <ChevronRight size={16}/></button></> : <><label className="field-label">{modal==='category'?'KATEGORİ ADI':modal==='role'?'ROL ADI':'KANAL ADI'}<input autoFocus value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(modal==='category'?addCategory():modal==='role'?addRole():addChannel())} placeholder={modal==='category'?'örn. TOPLULUK':modal==='role'?'örn. Moderatör':'örn. genel-sohbet'}/></label>{modal==='channel'&&<label className="field-label">CHANNEL TYPE<select value={channelType} onChange={e=>setChannelType(e.target.value as 'text'|'voice')}><option value="text">Yazı kanalı</option><option value="voice">Ses kanalı</option></select></label>}<div className="modal-hint">Bu işlem bağlı Discord sunucusunda gerçek bir değişiklik yapacaktır.</div><button className="primary-button full-button" disabled={busy || !connected} onClick={modal==='category'?addCategory:modal==='role'?addRole:addChannel}>{busy ? 'İşleniyor…' : `Create ${modal}`} <Plus size={16}/></button></>}</div></div>}
    {toast && <div className="toast"><Sparkles size={16}/>{toast}</div>}
  </div>;
}
export default App;
