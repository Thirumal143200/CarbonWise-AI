import { Send } from 'lucide-react';
import type { FormEvent, RefObject } from 'react';
import type { Message } from '../types';

interface CoachChatProps {
  messages: Message[];
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  sending: boolean;
  handleSendMessage: (e: FormEvent) => Promise<void>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function CoachChat({
  messages,
  inputMessage,
  setInputMessage,
  sending,
  handleSendMessage,
  messagesEndRef,
}: CoachChatProps) {
  return (
    <div className="glass-card flex flex-col h-[500px]">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hidden">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white shadow-md rounded-tr-none'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-tl-none border border-surface-200/50 dark:border-surface-700/40'
              }`}
            >
              <p>{msg.text}</p>
              <p className={`text-[10px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-emerald-200' : 'text-surface-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-surface-100 dark:bg-surface-800 rounded-2xl rounded-tl-none p-4 border border-surface-200/50 dark:border-surface-700/40 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Form */}
      <form onSubmit={(e) => { void handleSendMessage(e); }} className="p-4 border-t border-surface-200 dark:border-surface-800 flex gap-3">
        <input
          type="text"
          placeholder="Ask anything about carbon footprints, reduction tips..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={sending}
          className="flex-1 input-field py-2.5 text-sm"
        />
        <button type="submit" disabled={sending || !inputMessage.trim()} className="btn-primary py-2 px-5">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
