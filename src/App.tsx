import { useMemo, useState } from 'react';
import {
  Activity, ArrowDownUp, Bell, Blocks, Bot, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, ClipboardList, Clock3, Command, Crown, Folder, Hash, Headphones,
  LayoutDashboard, LockKeyhole, Menu, MessageSquare, Plus, Search, Server,
  Settings, Shield, ShieldCheck, Sparkles, Users, Wifi, X, Zap
} from 'lucide-react';

type Page = 'Dashboard' | 'Server Structure' | 'Channels' | 'Roles' | 'Permissions' | 'Templates' | 'Bulk Actions' | 'Activity Logs' | 'Settings';
type Channel = { id?: string; name: string; type: 'text' | 'voice'; permission_overwrites?: { id: string; type: number; allow: string; deny: string }[] };
type Category = { id?: string; name: string; channels: Channel[] };
type ActivityEntry = { id: number; action: string; detail: string; time: string; };
const permissionBits = [{key:'view',label:'View channel',bit:1024n},{key:'send',label:'Send messages',bit:2048n},{key:'manageMessages',label:'Manage messages',bit:8192n},{key:'manageChannels',label:'Manage channels',bit:16n},{key:'connect',label:'Connect to voice',bit:1048576n},{key:'speak',label:'Speak in voice',bit:2097152n}];
const navigation: { group: string; items: { label: Page; icon: typeof LayoutDashboard }[] }[] = [
  { group: 'WORKSPACE', items: [{ label: 'Dashboard', icon: LayoutDashboard }, { label: 'Server Structure', icon: Folder }, { label: 'Channels', icon: Hash }, { label: 'Roles', icon: ShieldCheck }, { label: 'Permissions', icon: LockKeyhole }] },
  { group: 'MANAGEMENT', items: [{ label: 'Templates', icon: Blocks }, { label: 'Bulk Actions', icon: Zap }, { label: 'Activity Logs', icon: ClipboardList }] },
  { group: 'PREFERENCES', items: [{ label: 'Settings', icon: Settings }] }
];
const initialCategories: Category[] = [
  { name: 'INFORMATION', channels: [{ name: 'welcome', type: 'text' }, { name: 'announcements', type: 'text' }, { name: 'rules', type: 'text' }] },
  { name: 'COMMUNITY', channels: [{ name: 'general-chat', type: 'text' }, { name: 'media', type: 'text' }, { name: 'General Voice', type: 'voice' }] },
  { name: 'STAFF', channels: [{ name: 'staff-chat', type: 'text' }, { name: 'mod-logs', type: 'text' }] }
];
function App() {
  const [page, setPage] = useState<Page>('Dashboard');
  const [serverId, setServerId] = useState('');
  const [serverName, setServerName] = useState('Your Discord Server');
  const [botToken, setBotToken] = useState('');
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [rightOpen, setRightOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [roles, setRoles] = useState(['Owner', 'Administrator', 'Moderator', 'Member', '@everyone']);
  const [roleIds, setRoleIds] = useState<Record<string,string>>({});
  const [modal, setModal] = useState<'server' | 'channel' | 'category' | 'role' | null>(null);
  const [draft, setDraft] = useState('');
  const [channelType, setChannelType] = useState<'text' | 'voice'>('text');
  const [permissionChannelId, setPermissionChannelId] = useState('');
  const [permissionRoleName, setPermissionRoleName] = useState('');
  const [permissionValues, setPermissionValues] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState('');
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkPrefix, setBulkPrefix] = useState('');
  const [bulkSuffix, setBulkSuffix] = useState('');
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const logActivity = (action: string, detail: string) => setActivityEntries(old => [{ id: Date.now() + Math.random(), action, detail, time: new Date().toLocaleString() }, ...old].slice(0, 100));
  const totalChannels = useMemo(() => categories.reduce((n, c) => n + c.channels.length, 0), [categories]);
  const allChannels = useMemo(() => categories.flatMap(c => c.channels), [categories]);
  const selectedPermissionRoleId = roleIds[permissionRoleName];
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const applyStructure = (data: Awaited<ReturnType<typeof window.whippin.getStructure>>) => {
    const categoryChannels = data.channels.filter(ch => ch.type === 4).sort((a,b) => a.position-b.position);
    const next: Category[] = categoryChannels.map(cat => ({
      id: cat.id, name: cat.name.toUpperCase(),
      channels: data.channels.filter(ch => ch.parent_id === cat.id && (ch.type === 0 || ch.type === 2)).sort((a,b) => a.position-b.position).map(ch => ({ id: ch.id, name: ch.name, type: ch.type === 2 ? 'voice' : 'text', permission_overwrites: ch.permission_overwrites }))
    }));
    const loose = data.channels.filter(ch => !ch.parent_id && ch.type !== 4 && (ch.type === 0 || ch.type === 2)).sort((a,b) => a.position-b.position);
    if (loose.length) next.unshift({ name: 'UNCATEGORIZED', channels: loose.map(ch => ({ id: ch.id, name: ch.name, type: ch.type === 2 ? 'voice' : 'text', permission_overwrites: ch.permission_overwrites })) });
    setCategories(next);
    setRoles(data.roles.slice().sort((a,b) => b.position-a.position).map(r => r.name));
    setRoleIds(Object.fromEntries(data.roles.map(r => [r.name,r.id])));
    setServerName(data.guild.name);
    setServerId(data.guild.id);
    setConnected(true);
    logActivity('Server connected', `Connected to ${data.guild.name}`);
  };
  const refreshStructure = async () => { const data = await window.whippin.getStructure(serverId); applyStructure(data); };
  const connectServer = async () => {
    if (!serverId.trim() || !botToken.trim()) { notify('Enter both the bot token and server ID.'); return; }
    setBusy(true);
    try { const data = await window.whippin.connect({ token: botToken.trim(), guildId: serverId.trim() }); applyStructure(data); setBotToken(''); setModal(null); notify('Discord server connected successfully.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Could not connect to Discord.'); }
    finally { setBusy(false); }
  };
  const addChannel = async () => {
    const name = draft.trim().toLowerCase().replace(/\s+/g, '-');
    if (!name) return;
    if (!connected) { notify('Connect your Discord bot first.'); return; }
    setBusy(true);
    try { await window.whippin.createChannel({ guildId: serverId, name, type: channelType }); await refreshStructure(); setDraft(''); setModal(null); logActivity('Channel created', `Created #${name}`); notify('Channel created on Discord.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Channel could not be created.'); }
    finally { setBusy(false); }
  };
  const addCategory = async () => {
    const name = draft.trim().toUpperCase();
    if (!name) return;
    if (!connected) { notify('Connect your Discord bot first.'); return; }
    setBusy(true);
    try { await window.whippin.createChannel({ guildId: serverId, name: name.toLowerCase().replace(/\s+/g, '-') , type: 'category' }); await refreshStructure(); setDraft(''); setModal(null); logActivity('Category created', `Created ${name} category`); notify('Category created on Discord.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Category could not be created.'); }
    finally { setBusy(false); }
  };
  const addRole = async () => {
    const name = draft.trim();
    if (!name) return;
    if (!connected) { notify('Connect your Discord bot first.'); return; }
    setBusy(true);
    try { await window.whippin.createRole({ guildId: serverId, name }); await refreshStructure(); setDraft(''); setModal(null); logActivity('Role created', `Created role ${name}`); notify('Role created on Discord.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Role could not be created.'); }
    finally { setBusy(false); }
  };
  const removeChannel = async (categoryName: string, channel: Channel) => {
    if (!channel.id) return;
    setBusy(true);
    try { await window.whippin.deleteChannel(channel.id); await refreshStructure(); logActivity('Channel deleted', `Deleted #${channel.name}`); notify('Channel deleted from Discord.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Channel could not be deleted.'); }
    finally { setBusy(false); }
  };
  const removeRole = async (name: string) => {
    const roleId = roleIds[name];
    if (!roleId || name === '@everyone') return;
    setBusy(true);
    try { await window.whippin.deleteRole({ guildId: serverId, roleId }); await refreshStructure(); logActivity('Role deleted', `Deleted role ${name}`); notify('Role deleted from Discord.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Role could not be deleted.'); }
    finally { setBusy(false); }
  };
  const runBulkAction = async (action: 'delete' | 'update') => {
    if (!connected) return notify('Connect your Discord bot first.');
    if (!bulkSelected.length) return notify('Select at least one channel.');
    if (action === 'delete' && !window.confirm(`Delete ${bulkSelected.length} selected channels from Discord? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const result = action === 'delete' ? await window.whippin.bulkDeleteChannels(bulkSelected) : await window.whippin.bulkUpdateChannels({ channelIds: bulkSelected, ...(bulkCategory ? { parentId: bulkCategory } : {}), prefix: bulkPrefix, suffix: bulkSuffix });
      await refreshStructure(); setBulkSelected(result.failed.length ? result.succeeded : []); logActivity(action === 'delete' ? 'Bulk delete' : 'Bulk update', `${result.succeeded.length} succeeded, ${result.failed.length} failed`); notify(`${result.succeeded.length} successful, ${result.failed.length} failed.`);
    } catch (error) { notify(error instanceof Error ? error.message : 'Bulk action failed.'); } finally { setBusy(false); }
  };
  const choosePermissionTarget = (channelId: string, roleName: string) => {
    setPermissionChannelId(channelId); setPermissionRoleName(roleName);
    const channel = allChannels.find(ch => ch.id === channelId) as (Channel & { permission_overwrites?: { id: string; allow: string; deny: string }[] }) | undefined;
    const roleId = roleIds[roleName]; const overwrite = channel?.permission_overwrites?.find(o => o.id === roleId);
    const allow = BigInt(overwrite?.allow || '0'); const deny = BigInt(overwrite?.deny || '0');
    setPermissionValues(Object.fromEntries(permissionBits.map(p => [p.key, (allow & p.bit) !== 0n && (deny & p.bit) === 0n])));
  };
  const savePermissions = async () => {
    if (!permissionChannelId || !selectedPermissionRoleId) return notify('Select a channel and role first.');
    const channel = allChannels.find(ch => ch.id === permissionChannelId) as (Channel & { permission_overwrites?: { id: string; allow: string; deny: string }[] }) | undefined;
    const existing = channel?.permission_overwrites?.find(o => o.id === selectedPermissionRoleId);
    const mask = permissionBits.reduce((m,p) => m | p.bit, 0n); let allow = BigInt(existing?.allow || '0') & ~mask; let deny = BigInt(existing?.deny || '0') & ~mask;
    for (const p of permissionBits) { if (permissionValues[p.key]) allow |= p.bit; else deny |= p.bit; }
    setBusy(true); try { await window.whippin.setChannelPermissions({channelId:permissionChannelId,roleId:selectedPermissionRoleId,allow:allow.toString(),deny:deny.toString()}); await refreshStructure(); logActivity('Permissions updated', `Updated ${permissionRoleName} overrides on #${channel?.name || permissionChannelId}`); notify('Channel permissions saved to Discord.'); }
    catch (error) { notify(error instanceof Error ? error.message : 'Permissions could not be saved.'); } finally { setBusy(false); }
  };
  const visibleCategories = categories.map(c => ({ ...c, channels: c.channels.filter(ch => ch.name.toLowerCase().includes(query.toLowerCase())) })).filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.channels.length);
  const openModal = (kind: typeof modal) => { setDraft(''); setModal(kind); };
  const title = page === 'Server Structure' ? 'Server Structure' : page;
  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <div className="brand-row"><div className="brand-mark"><span>W</span></div><div className="brand-name">WHIPPIN<span>.</span><small>DISCORD MANAGER</small></div><button className="icon-button collapse-btn" onClick={() => setSidebarOpen(false)} title="Collapse sidebar"><ChevronLeft size={17}/></button></div>
      <button className="server-switch" onClick={() => openModal('server')}><div className="server-avatar"><Server size={17}/></div><span><b>{connected ? serverName : 'Select a server'}</b><small>{connected ? 'Server workspace' : 'No server connected'}</small></span><ChevronDown size={16}/></button>
      <div className="nav-scroll">{navigation.map(group => <div className="nav-group" key={group.group}><div className="nav-label">{group.group}</div>{group.items.map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => setPage(item.label)} className={`nav-item ${page === item.label ? 'active' : ''}`}><Icon size={17}/><span>{item.label}</span>{item.label === 'Activity Logs' && <i className="nav-dot"/>}</button>; })}</div>)}</div>
      <div className="sidebar-bottom"><div className="connection-mini"><span className={connected ? 'status-dot online' : 'status-dot'}/><div><b>{connected ? 'Workspace ready' : 'Not connected'}</b><small>{connected ? 'Discord bot connection' : 'Connect a Discord bot'}</small></div><button className="icon-button" onClick={() => openModal('server')}><ArrowDownUp size={15}/></button></div><div className="user-row"><div className="user-avatar">W</div><div><b>WHIPPIN Workspace</b><small>Personal edition</small></div><button className="icon-button" onClick={() => setPage('Settings')}><Settings size={16}/></button></div></div>
    </aside>
    {!sidebarOpen && <button className="reopen-sidebar" onClick={() => setSidebarOpen(true)}><Menu size={18}/></button>}
    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>WHIPPIN</span><ChevronRight size={14}/><b>{page}</b></div><div className="top-actions"><label className="global-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search modules..." /><kbd>CTRL K</kbd></label><span className={connected ? 'top-status online' : 'top-status'} title={connected ? 'Connected' : 'Offline'}/><button className="support-button" onClick={() => notify('Help center will be available in a future update.')}><CircleHelp size={16}/> Support</button><button className="icon-button notification" onClick={() => notify('You are all caught up.')}><Bell size={17}/><i/></button><button className="profile-chip" onClick={() => setPage('Settings')}>W<ChevronDown size={14}/></button></div></header>
      <div className="content-scroll">
        <section className="welcome-row"><div><div className="eyebrow"><Sparkles size={13}/> SERVER CONTROL CENTER</div><h1>{page === 'Dashboard' ? 'Welcome to WHIPPIN.' : title}</h1><p>{page === 'Dashboard' ? 'Your server. Your structure. Completely under control.' : page === 'Server Structure' ? 'Explore and organize every category and channel in one place.' : `Manage your Discord server ${page.toLowerCase()} from one workspace.`}</p></div><button className="primary-button" onClick={() => openModal('server')}><Plus size={16}/> {connected ? 'Switch server' : 'Connect server'}</button></section>
        {page === 'Dashboard' && <>
          <section className="server-banner"><div className="server-emblem"><Bot size={25}/></div><div className="server-meta"><h2>{connected ? serverName : 'Your server workspace'}</h2><span><i className={connected ? 'status-dot online' : 'status-dot'}/>{connected ? 'BOT CONNECTION READY' : 'WAITING FOR CONNECTION'}</span></div><div className="banner-spacer"/><div className="banner-pill"><Users size={17}/><b>—</b><small>MEMBERS</small></div><div className="banner-pill"><Crown size={17}/><b>—</b><small>YOUR ROLE</small></div></section>
          <div className="section-heading"><div><h3>SERVER OVERVIEW</h3><p>A quick look at your server structure</p></div><button className="subtle-button" onClick={async () => { if(!connected) return notify('Connect a server first.'); try { await refreshStructure(); notify('Server data synchronized.'); } catch(e) { notify(e instanceof Error ? e.message : 'Sync failed.'); } }}><Activity size={15}/> Refresh</button></div>
          <section className="stats-grid">{[{label:'TOTAL CHANNELS',value:connected ? totalChannels : '—',icon:MessageSquare,change:'Text & voice channels'},{label:'CATEGORIES',value:connected ? categories.length : '—',icon:Folder,change:'Organized sections'},{label:'SERVER ROLES',value:connected ? roles.length : '—',icon:Shield,change:'Including @everyone'},{label:'BOT STATUS',value:connected ? 'Ready' : 'Offline',icon:Wifi,change:connected ? 'Connection established' : 'Connect to get started',status:true}].map((s,i)=>{const Icon=s.icon;return <article className="stat-card" key={s.label}><div className="stat-top"><span>{s.label}</span><div className="stat-icon"><Icon size={17}/></div></div><strong className={s.status && connected ? 'success-text' : ''}>{s.value}</strong><small>{s.change}</small></article>})}</section>
          <section className="dashboard-grid"><article className="panel structure-panel"><div className="panel-heading"><div><h3>SERVER STRUCTURE</h3><p>Categories and channels preview</p></div><button className="text-button" onClick={() => setPage('Server Structure')}>View all <ChevronRight size={14}/></button></div>{connected ? <div className="structure-preview">{categories.slice(0,3).map(c=><div className="preview-category" key={c.id || c.name}><div className="preview-cat-name"><Folder size={14}/>{c.name}<span>{c.channels.length}</span></div>{c.channels.slice(0,3).map(ch=><div className="preview-channel" key={ch.id || ch.name}>{ch.type === 'voice' ? <Headphones size={14}/> : <Hash size={14}/>} {ch.name}</div>)}</div>)}</div> : <div className="empty-state"><div className="empty-icon"><Server size={23}/></div><b>Your server will appear here</b><span>Connect a Discord bot to load your real server structure.</span><button className="outline-button" onClick={() => openModal('server')}>Connect Discord server</button></div>}</article>
            <article className="panel quick-panel"><div className="panel-heading"><div><h3>QUICK ACTIONS</h3><p>Jump straight into management</p></div><Zap size={17} className="muted-icon"/></div><div className="quick-list"><button onClick={() => openModal('channel')}><div className="quick-icon"><Hash size={17}/></div><span><b>Create channel</b><small>Add a new text or voice channel</small></span><ChevronRight size={16}/></button><button onClick={() => openModal('category')}><div className="quick-icon"><Folder size={17}/></div><span><b>Create category</b><small>Organize your server layout</small></span><ChevronRight size={16}/></button><button onClick={() => openModal('role')}><div className="quick-icon"><Shield size={17}/></div><span><b>Create role</b><small>Set up a new server role</small></span><ChevronRight size={16}/></button><button onClick={() => setPage('Permissions')}><div className="quick-icon"><LockKeyhole size={17}/></div><span><b>Manage permissions</b><small>Configure role and channel access</small></span><ChevronRight size={16}/></button></div></article></section>
          <section className="panel activity-panel"><div className="panel-heading"><div><h3>RECENT ACTIVITY</h3><p>Your latest workspace actions</p></div><button className="text-button" onClick={() => setPage('Activity Logs')}>Activity log <ChevronRight size={14}/></button></div><div className="activity-empty"><Clock3 size={17}/> Activity history will be added in a future update.</div></section>
        </>}
        {page === 'Server Structure' && <section className="panel manager-panel"><div className="panel-heading"><div><h3>STRUCTURE EXPLORER</h3><p>Manage your categories and channels</p></div><div className="inline-actions"><button className="outline-button" onClick={() => openModal('category')}><Plus size={15}/> Category</button><button className="primary-button small" onClick={() => openModal('channel')}><Plus size={15}/> Channel</button></div></div>{!connected && <div className="notice"><Shield size={17}/><span><b>Preview mode</b> — Connect your Discord bot to load and edit your actual server.</span></div>}{visibleCategories.map(c=><div className="manager-category" key={c.id || c.name}><div className="manager-category-title"><Folder size={16}/><b>{c.name}</b><span>{c.channels.length} CHANNELS</span><button className="icon-button" onClick={() => notify('Category editing is not available yet.')}><Settings size={15}/></button></div>{c.channels.map(ch=><div className="manager-channel" key={ch.id || ch.name}><div>{ch.type === 'voice' ? <Headphones size={16}/> : <Hash size={16}/>}<span>{ch.name}</span><small>{ch.type.toUpperCase()}</small></div><button className="icon-button" onClick={() => connected ? removeChannel(c.name,ch) : notify('Connect your bot to make changes on Discord.')} title="Remove channel" disabled={busy}><X size={15}/></button></div>)}</div>)}</section>}
        {page === 'Channels' && <section className="panel manager-panel"><div className="panel-heading"><div><h3>CHANNEL MANAGER</h3><p>Create, organize and configure server channels</p></div><button className="primary-button small" onClick={() => openModal('channel')}><Plus size={15}/> New channel</button></div><div className="empty-state compact"><Hash size={25}/><b>Channel management workspace</b><span>Use Server Structure to browse and manage live channels.</span><button className="outline-button" onClick={() => setPage('Server Structure')}>Open structure explorer</button></div></section>}
        {page === 'Roles' && <section className="panel manager-panel"><div className="panel-heading"><div><h3>ROLE MANAGER</h3><p>Manage server roles and hierarchy</p></div><button className="primary-button small" onClick={() => openModal('role')}><Plus size={15}/> New role</button></div>{!connected && <div className="notice"><Shield size={17}/> Preview mode — sample roles are shown below.</div>}<div className="role-list">{roles.map((r,i)=><div className="role-row" key={roleIds[r] || r}><div className="role-color" style={{background:['#bd8cff','#f0b45f','#65a8e8','#65c7a2','#777181'][i%5]}}/><b>{r}</b><span>{i===0?'HIGHEST':r==='@everyone'?'DEFAULT':'ROLE'}</span>{connected && r !== '@everyone' && <button className="icon-button" onClick={() => removeRole(r)} title="Delete role" disabled={busy}><X size={15}/></button>}</div>)}</div></section>}

        {page === 'Permissions' && <section className="panel manager-panel">
          <div className="panel-heading"><div><h3>CHANNEL PERMISSION EDITOR</h3><p>Configure channel access for each server role</p></div></div>
          {!connected ? <div className="empty-state compact"><LockKeyhole size={25}/><b>Connect a Discord server</b><span>Live permission management requires an official bot connection.</span><button className="outline-button" onClick={() => openModal('server')}>Connect Discord</button></div> : <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,margin:'18px 0'}}>
              <label className="field-label">CHANNEL<select value={permissionChannelId} onChange={e=>choosePermissionTarget(e.target.value,permissionRoleName)}><option value="">Select a channel</option>{allChannels.filter(ch=>ch.id).map(ch=><option key={ch.id} value={ch.id}>#{ch.name}</option>)}</select></label>
              <label className="field-label">ROLE<select value={permissionRoleName} onChange={e=>choosePermissionTarget(permissionChannelId,e.target.value)}><option value="">Select a role</option>{roles.map(r=><option key={r} value={r}>{r}</option>)}</select></label>
            </div>
            <div className="notice"><Shield size={17}/><span>These are channel-specific role overrides. Other permission bits are preserved. Administrator permissions and Discord role hierarchy still apply.</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(245px,1fr))',gap:12,marginTop:18}}>
              {permissionBits.map(p=><button key={p.key} onClick={()=>setPermissionValues(old=>({...old,[p.key]:!old[p.key]}))} style={{display:'flex',alignItems:'center',gap:12,textAlign:'left',padding:15,borderRadius:12,border:'1px solid #30283b',background:permissionValues[p.key]?'rgba(145,91,220,.16)':'#15121b',color:'#eee',cursor:'pointer'}}><span style={{width:20,height:20,borderRadius:6,border:'1px solid #9c72dc',background:permissionValues[p.key]?'#9c72dc':'transparent',display:'grid',placeItems:'center'}}>{permissionValues[p.key]?'✓':''}</span><b style={{fontSize:13}}>{p.label}</b><span style={{marginLeft:'auto',fontSize:10,color:permissionValues[p.key]?'#c9a7ff':'#a39aaa'}}>{permissionValues[p.key]?'ALLOW':'DENY'}</span></button>)}
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:20}}><button className="primary-button" disabled={busy||!permissionChannelId||!selectedPermissionRoleId} onClick={savePermissions}>{busy?'Saving…':'Save permission overrides'} <ShieldCheck size={16}/></button></div>
          </>}
        </section>}
        {page === 'Activity Logs' && <section className="panel manager-panel">
          <div className="panel-heading"><div><h3>WORKSPACE ACTIVITY</h3><p>Recent actions performed from this WHIPPIN session</p></div><div className="inline-actions"><span className="coming-badge">{activityEntries.length} EVENTS</span><button className="outline-button" disabled={!activityEntries.length} onClick={()=>setActivityEntries([])}>Clear history</button></div></div>
          {!activityEntries.length ? <div className="empty-state compact"><ClipboardList size={27}/><b>No activity yet</b><span>Successful server changes will appear here with their action and time.</span></div> : <div className="role-list">{activityEntries.map(entry=><div className="role-row" key={entry.id}><div className="role-color" style={{background:'#a879f5'}}/><div style={{flex:1,minWidth:0}}><b>{entry.action}</b><small style={{display:'block',fontSize:10,color:'#92899d',marginTop:4}}>{entry.detail}</small></div><time style={{fontSize:9,color:'#92899d',whiteSpace:'nowrap'}}>{entry.time}</time></div>)}</div>}
          <div className="notice"><Clock3 size={16}/><span>Activity history is currently kept for this app session and is cleared when the application is restarted.</span></div>
        </section>}
        {page === 'Bulk Actions' && <section className="panel manager-panel">
          <div className="panel-heading"><div><h3>BULK CHANNEL OPERATIONS</h3><p>Select channels and apply changes across your server</p></div><span className="coming-badge">{bulkSelected.length} SELECTED</span></div>
          {!connected ? <div className="empty-state compact"><Zap size={25}/><b>Connect a Discord server</b><span>Bulk operations run against your live server through your official bot.</span><button className="outline-button" onClick={() => openModal('server')}>Connect Discord</button></div> : <>
            <div className="inline-actions" style={{marginBottom:12}}><button className="outline-button" onClick={()=>setBulkSelected(allChannels.filter(ch=>ch.id).map(ch=>ch.id!))}>Select all</button><button className="outline-button" onClick={()=>setBulkSelected([])}>Clear selection</button></div>
            <div className="role-list">{categories.map(cat=><div key={cat.id||cat.name}><div className="manager-category-title"><Folder size={15}/><b>{cat.name}</b></div>{cat.channels.filter(ch=>ch.id).map(ch=><label className="manager-channel" key={ch.id} style={{justifyContent:'flex-start',gap:12,cursor:'pointer'}}><input type="checkbox" checked={bulkSelected.includes(ch.id!)} onChange={e=>setBulkSelected(old=>e.target.checked?[...old,ch.id!]:old.filter(id=>id!==ch.id))}/>{ch.type==='voice'?<Headphones size={15}/>:<Hash size={15}/>}<span>{ch.name}</span><small>{ch.type.toUpperCase()}</small></label>)}</div>)}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:18}}>
              <label className="field-label">MOVE TO CATEGORY<select value={bulkCategory} onChange={e=>setBulkCategory(e.target.value)}><option value="">Keep current category</option>{categories.filter(c=>c.id).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}<option value="none">No category</option></select></label><div/>
              <label className="field-label">RENAME PREFIX<input value={bulkPrefix} onChange={e=>setBulkPrefix(e.target.value)} placeholder="e.g. vip-"/></label>
              <label className="field-label">RENAME SUFFIX<input value={bulkSuffix} onChange={e=>setBulkSuffix(e.target.value)} placeholder="e.g. -2026"/></label>
            </div>
            <div className="notice"><Shield size={16}/><span>Operations affect real Discord channels. Failed items are reported separately; bulk delete cannot be undone.</span></div>
            <div className="inline-actions" style={{justifyContent:'flex-end',marginTop:16}}><button className="outline-button" disabled={busy||!bulkSelected.length} onClick={()=>runBulkAction('delete')} style={{color:'#ff9b9b',borderColor:'#704044'}}>Delete selected</button><button className="primary-button" disabled={busy||!bulkSelected.length||(!bulkCategory&&!bulkPrefix&&!bulkSuffix)} onClick={()=>runBulkAction('update')}>{busy?'Applying…':'Apply move / rename'} <Zap size={15}/></button></div>
          </>}
        </section>}
        {page !== 'Dashboard' && page !== 'Server Structure' && page !== 'Channels' && page !== 'Roles' && page !== 'Permissions' && page !== 'Bulk Actions' && page !== 'Activity Logs' && <section className="panel coming-panel"><div className="coming-icon"><Command size={27}/></div><div className="eyebrow">WHIPPIN MODULE</div><h2>{page}</h2><p>This workspace is mapped out and ready for its feature implementation.</p><span className="coming-badge"><Sparkles size={13}/> Coming in the next development phase</span></section>}
        <footer className="app-footer"><span>WHIPPIN <b>v0.1.0</b></span><span>BUILT FOR SERVER OWNERS <i/> SECURE BY DESIGN</span></footer>
      </div>
    </main>
    {rightOpen && <aside className="right-panel"><div className="right-header"><div><span className="eyebrow">LIVE WORKSPACE</span><h3>SERVER DETAILS</h3></div><button className="icon-button" onClick={() => setRightOpen(false)}><X size={16}/></button></div><div className="right-server-card"><div className="right-server-icon"><Server size={23}/></div><b>{connected ? serverName : 'No server selected'}</b><small>{connected ? serverId : 'Connect a server to begin'}</small><span className={connected ? 'connection-label online-label' : 'connection-label'}><i/> {connected ? 'BOT READY' : 'DISCONNECTED'}</span></div><div className="right-section-title">CONNECTION</div><div className="detail-line"><span>Bot status</span><b className={connected ? 'success-text' : ''}>{connected ? 'Connected' : 'Offline'}</b></div><div className="detail-line"><span>Gateway</span><b>Discord API</b></div><div className="detail-line"><span>Last sync</span><b>{connected ? 'Live sync' : '—'}</b></div><div className="right-section-title">QUICK STATS</div><div className="right-stat"><span><Hash size={14}/> Channels</span><b>{connected ? totalChannels : '—'}</b></div><div className="right-stat"><span><Folder size={14}/> Categories</span><b>{connected ? categories.length : '—'}</b></div><div className="right-stat"><span><Shield size={14}/> Roles</span><b>{connected ? roles.length : '—'}</b></div><div className="right-bottom"><div className="secure-note"><LockKeyhole size={15}/><span><b>Secure workspace</b><small>Official Discord bot integration. No user-token login.</small></span></div><button className="right-connect" onClick={() => openModal('server')}>{connected ? 'Switch server' : 'Connect Discord'} <ChevronRight size={15}/></button></div></aside>}
    {!rightOpen && <button className="right-reopen" onClick={() => setRightOpen(true)}><ChevronLeft size={16}/></button>}
    {modal && <div className="modal-backdrop" onMouseDown={e => {if(e.target===e.currentTarget)setModal(null)}}><div className="modal-card"><div className="modal-top"><div><span className="eyebrow">WHIPPIN WORKSPACE</span><h2>{modal==='server'?'Connect Discord server':modal==='channel'?'Create channel':modal==='category'?'Create category':'Create role'}</h2></div><button className="icon-button" onClick={() => setModal(null)}><X size={18}/></button></div>{modal==='server' ? <><div className="notice"><Shield size={17}/><span>Use an official Discord bot. Never enter your personal Discord account token.</span></div><label className="field-label">BOT TOKEN<input type="password" value={botToken} onChange={e=>setBotToken(e.target.value)} placeholder="Paste your Discord bot token" autoComplete="off"/></label><label className="field-label">SERVER ID<input value={serverId} onChange={e=>setServerId(e.target.value)} placeholder="Enter your Discord server ID"/></label><div className="modal-hint">Create a bot in the Discord Developer Portal, invite it to your server with Manage Channels and Manage Roles, then paste its bot token here. The token is encrypted in Windows secure storage.</div><button className="primary-button full-button" disabled={busy} onClick={connectServer}>{busy ? 'Connecting…' : 'Connect bot & load server'} <ChevronRight size={16}/></button></> : <><label className="field-label">{modal==='category'?'CATEGORY NAME':modal==='role'?'ROLE NAME':'CHANNEL NAME'}<input autoFocus value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(modal==='category'?addCategory():modal==='role'?addRole():addChannel())} placeholder={modal==='category'?'e.g. COMMUNITY':modal==='role'?'e.g. Moderator':'e.g. general-chat'}/></label>{modal==='channel'&&<label className="field-label">CHANNEL TYPE<select value={channelType} onChange={e=>setChannelType(e.target.value as 'text'|'voice')}><option value="text">Text channel</option><option value="voice">Voice channel</option></select></label>}<div className="modal-hint">This action will make a real change to the connected Discord server.</div><button className="primary-button full-button" disabled={busy || !connected} onClick={modal==='category'?addCategory:modal==='role'?addRole:addChannel}>{busy ? 'Working…' : `Create ${modal}`} <Plus size={16}/></button></>}</div></div>}
    {toast && <div className="toast"><Sparkles size={16}/>{toast}</div>}
  </div>;
}
export default App;
