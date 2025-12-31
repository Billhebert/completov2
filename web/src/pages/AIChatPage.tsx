import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Bot,
  User,
  Send,
  Trash2,
  Download,
  Search,
  Database,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  useRag?: boolean;
  sources?: Array<{
    id: string;
    title: string;
    content: string;
    relevanceScore: number;
  }>;
  sourcesCount?: number;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  type?: string;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [ragEnabled, setRagEnabled] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; useRag: boolean }) => {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      if (data.useRag) {
        return api.aiRagQuery({
          query: data.message,
          useRag: true,
          conversationHistory,
        });
      } else {
        return api.aiChat({
          message: data.message,
          conversationHistory,
        });
      }
    },
    onSuccess: (data, variables) => {
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        useRag: variables.useRag,
        sources: 'sources' in data ? data.sources : undefined,
        sourcesCount: 'sourcesCount' in data ? data.sourcesCount : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to get AI response');
    },
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: (query: string) => api.aiRagSearch({ query, limit: 10 }),
    onSuccess: (data) => {
      setSearchResults(data.results);
      setShowSearchResults(true);
      toast.success(`Found ${data.results.length} relevant documents`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Search failed');
    },
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      useRag: ragEnabled,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await chatMutation.mutateAsync({
      message: inputMessage,
      useRag: ragEnabled,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      toast.success('Chat cleared');
    }
  };

  const handleExportChat = () => {
    const chatData = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      useRag: msg.useRag,
      sourcesCount: msg.sourcesCount,
    }));

    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-export-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Chat exported');
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    searchMutation.mutate(searchQuery);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const userMessageCount = messages.filter((m) => m.role === 'user').length;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Chat with AI and search your knowledge base
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* RAG Toggle */}
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">RAG</span>
              <button
                onClick={() => setRagEnabled(!ragEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  ragEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    ragEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleClearChat}
              disabled={messages.length === 0}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear chat"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              onClick={handleExportChat}
              disabled={messages.length === 0}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export chat"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">Messages sent:</span>
            <span className="font-semibold text-foreground">{userMessageCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-500" />
            <span className="text-muted-foreground">RAG:</span>
            <span className="font-semibold text-foreground">
              {ragEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Search Knowledge Base */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search knowledge base..."
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
            />
            <button
              onClick={handleSearch}
              disabled={searchMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {searchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Results ({searchResults.length})
            </h3>
            <button
              onClick={() => setShowSearchResults(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="p-3 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground text-sm">{result.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {result.content}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {result.type && (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                        {result.type}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {(result.relevanceScore * 100).toFixed(0)}% match
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Start a conversation
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Ask me anything! Enable RAG to include your knowledge base in responses.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {chatMutation.isPending && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 bg-muted/50 rounded-lg p-3 max-w-3xl">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="border-t border-border p-4">
          <div className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder={
                ragEnabled
                  ? 'Ask a question (RAG enabled - knowledge base will be searched)...'
                  : 'Type your message...'
              }
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none min-h-[44px] max-h-[200px]"
              rows={1}
              disabled={chatMutation.isPending}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || chatMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
          {ragEnabled && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Database className="h-3 w-3" />
              RAG is enabled - responses will include knowledge base context
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message }: { message: ChatMessage }) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-500' : 'bg-primary/10'
        }`}
      >
        {isUser ? (
          <User className="h-5 w-5 text-white" />
        ) : (
          <Bot className="h-5 w-5 text-primary" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`rounded-lg p-3 max-w-3xl ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-muted/50 text-foreground border border-border'
          }`}
        >
          {/* RAG Badge */}
          {message.useRag && !isUser && (
            <div className="mb-2 flex items-center gap-1 text-xs">
              <Database className="h-3 w-3 text-primary" />
              <span className="font-medium text-primary">[RAG]</span>
              {message.sourcesCount !== undefined && message.sourcesCount > 0 && (
                <span className="text-muted-foreground">
                  - Used {message.sourcesCount} source{message.sourcesCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Sources Toggle */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <button
              onClick={() => setShowSources(!showSources)}
              className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <FileText className="h-3 w-3" />
              {showSources ? 'Hide' : 'View'} sources ({message.sources.length})
              {showSources ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          )}
        </div>

        {/* Sources List */}
        {!isUser && showSources && message.sources && (
          <div className="mt-2 space-y-2 max-w-3xl w-full">
            {message.sources.map((source, index) => (
              <div
                key={source.id}
                className="p-2 bg-card border border-border rounded text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-foreground mb-1">
                      {index + 1}. {source.title}
                    </div>
                    <p className="text-muted-foreground line-clamp-2">{source.content}</p>
                  </div>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {(source.relevanceScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`text-xs text-muted-foreground mt-1 ${isUser ? 'text-right' : ''}`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
