import React, { useState } from 'react';
import {
  MessageSquare,
  Hash,
  Briefcase,
  Send,
  Plus,
  CheckSquare,
  Clock,
  Users,
  Search,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CommunicationsWorkspace: React.FC = () => {
  const {
    channels,
    messages,
    sendMessage,
    convertMessageToTask,
    users,
    currentUser,
    matters,
    setSelectedMatterId,
    setActiveWorkspace,
  } = useApp();

  const [activeChannelId, setActiveChannelId] = useState(channels[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [searchChannel, setSearchChannel] = useState('');

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];
  const channelMessages = messages.filter((m) => m.channelId === activeChannel?.id);

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchChannel.toLowerCase())
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChannel) return;
    sendMessage(activeChannel.id, inputText);
    setInputText('');
  };

  const handleConvert = (msgId: string, text: string) => {
    convertMessageToTask(
      msgId,
      `Task: ${text.substring(0, 40)}...`,
      currentUser.id,
      new Date(Date.now() + 86400000).toISOString(),
      'high'
    );
  };

  return (
    <div className="flex-1 flex h-full bg-slate-950 text-slate-100 overflow-hidden text-xs">
      {/* Left Channels List */}
      <div className="w-64 sm:w-72 border-r border-slate-800 bg-slate-900/90 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 space-y-2">
          <div className="font-bold text-slate-100 flex items-center justify-between">
            <span className="uppercase tracking-wider text-[11px] text-amber-500 font-mono">
              Channels &amp; Threads
            </span>
          </div>
          <input
            type="text"
            placeholder="Search channels..."
            value={searchChannel}
            onChange={(e) => setSearchChannel(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase px-2 py-1">Firm Channels</div>
          {filteredChannels
            .filter((c) => c.type === 'firm' || c.type === 'branch')
            .map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveChannelId(c.id)}
                className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center gap-2 ${
                  c.id === activeChannel?.id
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Hash className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{c.name}</span>
              </button>
            ))}

          <div className="text-[10px] font-mono text-slate-500 uppercase px-2 py-1 pt-3">
            Matter Threads
          </div>
          {filteredChannels
            .filter((c) => c.type === 'matter')
            .map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveChannelId(c.id)}
                className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center gap-2 ${
                  c.id === activeChannel?.id
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="truncate">{c.name}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {/* Channel Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Hash className="w-4 h-4 text-amber-500" />
              <span>{activeChannel?.name}</span>
            </h2>
            <p className="text-slate-400 text-[11px] mt-0.5">{activeChannel?.description}</p>
          </div>
          {activeChannel?.matterId && (
            <button
              onClick={() => {
                setSelectedMatterId(activeChannel.matterId);
                setActiveWorkspace('matters');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-mono transition"
            >
              Open Matter File →
            </button>
          )}
        </div>

        {/* Message Thread List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {channelMessages.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No messages in this channel yet. Start the discussion!
            </div>
          ) : (
            channelMessages.map((msg) => {
              const sender = users.find((u) => u.id === msg.senderId);
              return (
                <div key={msg.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={sender?.avatarUrl}
                        alt={sender?.fullName}
                        className="w-6 h-6 rounded-md object-cover border border-slate-700"
                      />
                      <span className="font-semibold text-slate-200">{sender?.fullName}</span>
                      <span className="text-[10px] text-slate-400">({sender?.jobTitle})</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed text-sm pt-1 pl-8">{msg.text}</p>

                  <div className="pl-8 pt-1 flex items-center gap-3">
                    {!msg.convertedToTaskId ? (
                      <button
                        onClick={() => handleConvert(msg.id, msg.text)}
                        className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <CheckSquare className="w-3 h-3" />
                        <span>Convert message to Task</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-mono">
                        ✓ Converted to matter task
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Send Input Box */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              placeholder={`Message #${activeChannel?.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 text-xs outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center gap-1.5 transition"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
