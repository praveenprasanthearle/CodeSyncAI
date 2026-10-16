import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Code2,
  Trash2,
  Paperclip,
  Loader2,
} from 'lucide-react';
import { useChatStore, IFileReference } from '../../stores/chatStore';
import { useCollaborationStore } from '../../stores/collaborationStore';
import { useAuthStore } from '../../stores/authStore';
import { VoiceChannelWidget } from './VoiceChannelWidget';
import { IFileNode } from '../../types';

interface WorkspaceChatPanelProps {
  projectId: string;
  activeFile?: IFileNode | null;
  currentLine?: number;
  onNavigateToFile?: (path: string, line?: number) => void;
}

export const WorkspaceChatPanel: React.FC<WorkspaceChatPanelProps> = ({
  projectId,
  activeFile,
  currentLine = 1,
  onNavigateToFile,
}) => {
  const { user } = useAuthStore();
  const {
    messages,
    isLoading,
    typingUsers,
    fetchMessages,
    sendMessage,
    deleteMessage,
    setTyping,
    handleIncomingMessage,
    handleUserTyping,
    resetUnread,
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [attachedRef, setAttachedRef] = useState<IFileReference | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Load message history on mount
  useEffect(() => {
    if (projectId) {
      fetchMessages(projectId);
      resetUnread();
    }
  }, [projectId, fetchMessages, resetUnread]);

  // Connect chat socket listeners
  useEffect(() => {
    const socket = useCollaborationStore.getState().connectSocket();

    socket.on('chat:new_message', ({ message }) => {
      handleIncomingMessage(message);
    });

    socket.on('chat:user_typing', ({ socketId, user: typingUser, isTyping }) => {
      handleUserTyping(socketId, typingUser, isTyping);
    });

    return () => {
      socket.off('chat:new_message');
      socket.off('chat:user_typing');
    };
  }, [handleIncomingMessage, handleUserTyping]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Broadcast typing state
    setTyping(projectId, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(projectId, false);
    }, 2000);
  };

  const handleAttachActiveFile = () => {
    if (!activeFile) return;
    if (attachedRef) {
      setAttachedRef(null);
    } else {
      setAttachedRef({
        fileId: activeFile.id,
        path: activeFile.path,
        line: currentLine,
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    const refToSend = attachedRef || undefined;

    setInputText('');
    setAttachedRef(null);

    await sendMessage(projectId, textToSend, refToSend);
  };

  const typingNames = Object.values(typingUsers).map((u) => u.username);

  return (
    <div className="flex flex-col h-full bg-slate-50/60 select-none overflow-hidden">
      {/* WebRTC Voice Channel Box */}
      <div className="p-3 border-b border-slate-200/80">
        <VoiceChannelWidget projectId={projectId} />
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar text-xs">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center p-6 text-slate-400 font-mono text-xs">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Loading history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-6 text-center text-slate-400 font-mono text-xs">
            <p>No messages yet.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?.id === user?.id;

            return (
              <div
                key={msg.id}
                className={`group flex items-start gap-2 ${
                  isMe ? 'flex-row-reverse' : ''
                }`}
              >
                <img
                  src={
                    msg.sender?.avatarUrl ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender?.username || 'user'}`
                  }
                  alt={msg.sender?.username}
                  className="h-6 w-6 rounded-full bg-slate-100 object-cover ring-1 ring-white shrink-0 mt-0.5"
                />

                <div
                  className={`flex flex-col max-w-[80%] ${
                    isMe ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Sender Name & Timestamp */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mb-0.5 px-1">
                    <span className="font-medium text-slate-600">
                      {isMe ? 'You' : msg.sender?.name || msg.sender?.username}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {/* Delete action for author */}
                    {isMe && (
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-0.5 transition-opacity"
                        title="Delete message"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-2.5 rounded-xl text-xs leading-relaxed break-words font-sans ${
                      isMe
                        ? 'bg-slate-900 text-white rounded-tr-none shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none shadow-xs'
                    }`}
                  >
                    <div>{msg.text}</div>

                    {/* Attached Code Reference Pill */}
                    {msg.fileReference && (
                      <button
                        onClick={() =>
                          onNavigateToFile &&
                          onNavigateToFile(
                            msg.fileReference!.path,
                            msg.fileReference!.line
                          )
                        }
                        className={`mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                          isMe
                            ? 'bg-white/20 text-white hover:bg-white/30'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        }`}
                        title="Jump to code"
                      >
                        <Code2 className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[150px]">
                          {msg.fileReference.path}
                        </span>
                        <span>:{msg.fileReference.line || 1}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Live Typing Indicator */}
        {typingNames.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 italic px-2 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>
              {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Footer */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 border-t border-slate-200/80 bg-white space-y-1.5"
      >
        {/* Attached reference banner */}
        {attachedRef && (
          <div className="flex items-center justify-between px-2 py-1 rounded bg-blue-50 border border-blue-200 text-[10px] font-mono text-blue-700">
            <span className="flex items-center gap-1 truncate">
              <Paperclip className="h-3 w-3" />
              Attached: {attachedRef.path}:{attachedRef.line}
            </span>
            <button
              type="button"
              onClick={() => setAttachedRef(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {activeFile && (
            <button
              type="button"
              onClick={handleAttachActiveFile}
              className={`p-1.5 rounded-md border transition-all ${
                attachedRef
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-100'
              }`}
              title="Attach active file reference"
            >
              <Code2 className="h-4 w-4" />
            </button>
          )}

          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 rounded-md border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
