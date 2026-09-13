import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, CheckSquare, Hash, MessageSquare, Send, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { runtimeConfig } from '../../config/runtime';
import { communicationsApi, type CommunicationChannelDto, type CommunicationMessageDto } from '../../lib/api/communications.api';

type ViewChannel = Pick<CommunicationChannelDto, 'id' | 'matterId' | 'type' | 'name' | 'description' | 'private'>;
type ViewMessage = Pick<CommunicationMessageDto, 'id' | 'channelId' | 'senderId' | 'text' | 'convertedTaskId' | 'createdAt' | 'attachments' | 'mentions'>;

export const CommunicationsWorkspace: React.FC = () => {
  const {
    channels: demoChannels,
    messages: demoMessages,
    sendMessage: sendDemoMessage,
    convertMessageToTask: convertDemoMessage,
    users,
    currentUser,
    selectedMatterId,
    matters,
    setSelectedMatterId,
    setActiveWorkspace,
  } = useApp();
  const demoMode = runtimeConfig.enableDemoMode;
  const [serverChannels, setServerChannels] = useState<CommunicationChannelDto[]>([]);
  const [serverMessages, setServerMessages] = useState<CommunicationMessageDto[]>([]);
  const [activeChannelId, setActiveChannelId] = useState('');
  const [inputText, setInputText] = useState('');
  const [mentionUserId, setMentionUserId] = useState('');
  const [searchChannel, setSearchChannel] = useState('');
  const [directUserId, setDirectUserId] = useState('');
  const [loading, setLoading] = useState(!demoMode);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channels: ViewChannel[] = useMemo(() => demoMode
    ? demoChannels.map((channel) => ({ id: channel.id, matterId: channel.matterId, type: channel.type, name: channel.name, description: channel.description, private: channel.isPrivate }))
    : serverChannels, [demoChannels, demoMode, serverChannels]);
  const messages: ViewMessage[] = useMemo(() => demoMode
    ? demoMessages.map((message) => ({ id: message.id, channelId: message.channelId, senderId: message.senderId, text: message.text, convertedTaskId: message.convertedToTaskId, createdAt: message.createdAt, attachments: [], mentions: [] }))
    : serverMessages, [demoMessages, demoMode, serverMessages]);
  const activeChannel = channels.find((channel) => channel.id === activeChannelId) || channels[0];
  const channelMessages = messages.filter((message) => message.channelId === activeChannel?.id).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const filteredChannels = channels.filter((channel) => channel.name.toLowerCase().includes(searchChannel.toLowerCase()));

  useEffect(() => {
    if (demoMode) return;
    let live = true;
    setLoading(true);
    communicationsApi.listChannels()
      .then((rows) => { if (live) setServerChannels(rows); })
      .catch((cause: unknown) => { if (live) setError(cause instanceof Error ? cause.message : 'Could not load communications.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [demoMode]);

  useEffect(() => {
    if (!activeChannelId && channels[0]) setActiveChannelId(channels[0].id);
  }, [activeChannelId, channels]);

  useEffect(() => {
    if (demoMode || !activeChannel) return;
    let live = true;
    setLoading(true);
    communicationsApi.messages(activeChannel.id)
      .then(async (rows) => {
        if (!live) return;
        setServerMessages(rows);
        const newest = rows[0]?.id;
        await communicationsApi.markRead(activeChannel.id, newest);
      })
      .catch((cause: unknown) => { if (live) setError(cause instanceof Error ? cause.message : 'Could not load channel messages.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [activeChannel?.id, demoMode]);

  const selectChannel = (channelId: string) => {
    setError(null);
    setActiveChannelId(channelId);
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputText.trim() || !activeChannel || sending) return;
    setSending(true);
    setError(null);
    try {
      if (demoMode) {
        sendDemoMessage(activeChannel.id, inputText, mentionUserId ? [mentionUserId] : []);
      } else {
        const result = await communicationsApi.send(activeChannel.id, { text: inputText, mentionUserIds: mentionUserId ? [mentionUserId] : undefined });
        setServerMessages((previous) => [result.message, ...previous.filter((message) => message.id !== result.message.id)]);
      }
      setInputText('');
      setMentionUserId('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Message was not saved.');
    } finally {
      setSending(false);
    }
  };

  const handleConvert = async (message: ViewMessage) => {
    if (message.convertedTaskId) return;
    setError(null);
    try {
      if (demoMode) {
        convertDemoMessage(message.id, `Task: ${message.text.substring(0, 40)}…`, currentUser.id, new Date(Date.now() + 86400000).toISOString(), 'high');
      } else {
        const result = await communicationsApi.convertToTask(message.id, { title: `Task: ${message.text.substring(0, 40)}…`, assignedToId: currentUser.id, dueAt: new Date(Date.now() + 86400000).toISOString(), priority: 'HIGH' });
        setServerMessages((previous) => previous.map((row) => row.id === result.message.id ? result.message : row));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Task conversion was rejected.');
    }
  };

  const startDirectThread = async () => {
    if (!directUserId || demoMode) return;
    setError(null);
    try {
      const result = await communicationsApi.createDirectChannel({ userId: directUserId });
      setServerChannels((previous) => [result.channel, ...previous.filter((channel) => channel.id !== result.channel.id)]);
      setActiveChannelId(result.channel.id);
      setDirectUserId('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start a direct thread.');
    }
  };

  const startMatterThread = async () => {
    if (!selectedMatterId || demoMode) return;
    setError(null);
    try {
      const result = await communicationsApi.createMatterChannel(selectedMatterId);
      setServerChannels((previous) => [result.channel, ...previous.filter((channel) => channel.id !== result.channel.id)]);
      setActiveChannelId(result.channel.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the matter channel.');
    }
  };

  return (
    <div className="flex-1 flex h-full bg-slate-950 text-slate-100 overflow-hidden text-xs">
      <aside className="w-64 sm:w-72 border-r border-slate-800 bg-slate-900/90 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 space-y-2">
          <div className="font-bold text-slate-100 flex items-center justify-between"><span className="uppercase tracking-wider text-[11px] text-amber-500 font-mono">Channels &amp; Threads</span></div>
          <input type="text" placeholder="Search channels…" value={searchChannel} onChange={(event) => setSearchChannel(event.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none" />
          {!demoMode && <div className="space-y-1 pt-1">
            <select value={directUserId} onChange={(event) => setDirectUserId(event.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200">
              <option value="">Start direct staff thread…</option>
              {users.filter((user) => user.id !== currentUser.id).map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}
            </select>
            <button type="button" onClick={startDirectThread} disabled={!directUserId} className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 px-2 py-1.5 text-slate-200"><Users className="w-3 h-3 inline mr-1" />Open direct thread</button>
            {selectedMatterId && <button type="button" onClick={startMatterThread} className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1.5 text-amber-300"><Briefcase className="w-3 h-3 inline mr-1" />Start selected matter thread</button>}
          </div>}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChannels.map((channel) => <button key={channel.id} onClick={() => selectChannel(channel.id)} className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center gap-2 ${channel.id === activeChannel?.id ? 'bg-amber-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
            {channel.matterId ? <Briefcase className="w-3.5 h-3.5 shrink-0 text-amber-400" /> : <Hash className="w-3.5 h-3.5 shrink-0" />}<span className="truncate">{channel.name}</span>
          </button>)}
          {!loading && !filteredChannels.length && <p className="p-4 text-center text-slate-500">No accessible channels.</p>}
        </div>
      </aside>
      <main className="flex-1 flex flex-col bg-slate-950 min-w-0">
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
          <div><h2 className="text-sm font-bold text-slate-100 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-amber-500" /><span>{activeChannel?.name || 'Communications'}</span></h2><p className="text-slate-400 text-[11px] mt-0.5">{activeChannel?.description || (activeChannel ? 'Internal firm discussion' : 'Choose an accessible channel')}</p></div>
          {activeChannel?.matterId && <button onClick={() => { setSelectedMatterId(activeChannel.matterId ?? null); setActiveWorkspace('matters'); }} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-mono transition">Open Matter File →</button>}
        </div>
        {error && <div role="alert" className="mx-4 mt-3 rounded-lg border border-rose-800 bg-rose-950/50 px-3 py-2 text-rose-200">{error}</div>}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? <div className="py-12 text-center text-slate-500">Loading internal communications…</div> : !activeChannel ? <div className="py-12 text-center text-slate-500">No channel is available to this account.</div> : channelMessages.length === 0 ? <div className="py-12 text-center text-slate-500">No messages in this channel yet. Start the discussion.</div> : channelMessages.map((message) => {
            const sender = users.find((user) => user.id === message.senderId);
            return <article key={message.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-1.5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-6 h-6 rounded-md bg-slate-800 grid place-items-center text-amber-300 font-bold">{(sender?.fullName || '?').slice(0, 1)}</span><span className="font-semibold text-slate-200">{sender?.fullName || 'Firm staff'}</span></div><time className="text-[10px] text-slate-500 font-mono">{new Date(message.createdAt).toLocaleString()}</time></div><p className="text-slate-300 leading-relaxed text-sm pt-1 pl-8 whitespace-pre-wrap">{message.text}</p>{message.attachments.length > 0 && <div className="pl-8 text-[11px] text-amber-300">Attachments: {message.attachments.map((attachment) => attachment.filename).join(', ')}</div>}{message.mentions.some((mention) => mention.userId === currentUser.id) && <div className="pl-8 text-[11px] text-sky-300">You were mentioned in this message.</div>}<div className="pl-8 pt-1 flex items-center gap-3">{!message.convertedTaskId ? <button onClick={() => void handleConvert(message)} className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-medium"><CheckSquare className="w-3 h-3" />Convert message to task</button> : <span className="text-[11px] text-emerald-400 font-mono">✓ Converted to task</span>}</div></article>;
          })}
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <form onSubmit={(event) => void handleSend(event)} className="space-y-2"><div className="flex gap-2"><input type="text" placeholder={activeChannel ? `Message #${activeChannel.name}…` : 'Choose a channel first'} value={inputText} onChange={(event) => setInputText(event.target.value)} disabled={!activeChannel || sending} className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-xs outline-none focus:border-amber-500 disabled:opacity-50" /><button type="submit" disabled={!activeChannel || !inputText.trim() || sending} className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium flex items-center gap-1.5 transition"><Send className="w-4 h-4" />{sending ? 'Saving…' : 'Send'}</button></div><select value={mentionUserId} onChange={(event) => setMentionUserId(event.target.value)} disabled={!activeChannel || sending} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300"><option value="">No mention</option>{users.filter((user) => user.id !== currentUser.id).map((user) => <option key={user.id} value={user.id}>Mention {user.fullName}</option>)}</select></form>
        </div>
      </main>
    </div>
  );
};
