
import React, { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useAppStore } from '../store';
import { ChatMessage, ChatSession, Role } from '../types';

export const SearchPanel: React.FC = () => {
    const {
        searchQuery,
        setSearchQuery,
        chatHistory,
        selectChatAndScrollToMessage,
        toggleSearchVisibility
    } = useAppStore();

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) {
            return [];
        }
        const lowerCaseQuery = searchQuery.toLowerCase();
        const results: { chat: ChatSession, message: ChatMessage }[] = [];
        const matchedChatIds = new Set<string>();

        // First, find all messages that match
        chatHistory.forEach(chat => {
            chat.messages.forEach(message => {
                if (message.content.toLowerCase().includes(lowerCaseQuery)) {
                    results.push({ chat, message });
                    matchedChatIds.add(chat.id);
                }
            });
        });

        // Then, find chats where only the title matches
        chatHistory.forEach(chat => {
            if (!matchedChatIds.has(chat.id) && chat.title.toLowerCase().includes(lowerCaseQuery)) {
                // Add the chat with its first message as context.
                const contextMessage: ChatMessage = chat.messages[0] || {
                    id: `${chat.id}-title-match`,
                    role: Role.MODEL,
                    content: 'No messages yet...',
                    parts: [],
                };
                results.unshift({ chat, message: contextMessage });
            }
        });

        return results;
    }, [searchQuery, chatHistory]);
    
    const handleResultClick = (chatId: string, messageId: string) => {
        const messageToScrollTo = messageId.endsWith('-title-match') ? null : messageId;
        selectChatAndScrollToMessage(chatId, messageToScrollTo);
    };

    return (
        <div className="h-full flex flex-col items-center">
            <div className="max-w-4xl w-full h-full flex flex-col p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold text-text-primary">Search</h1>
                    <button 
                        onClick={toggleSearchVisibility} 
                        className="text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-interactive-hover"
                        aria-label="Close search"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>


                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-10 py-3 text-base border border-border rounded-lg bg-transparent text-text-primary focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] focus:border-transparent"
                        autoFocus
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>
                
                <p className="text-sm text-text-secondary mb-4 px-2">
                    {searchQuery.trim() ? `${searchResults.length} results for "${searchQuery}"` : 'Search for keywords in your chat history.'}
                </p>

                <div className="flex-1 overflow-y-auto -mx-2 hover-scrollbar">
                    {searchResults.map(result => (
                        <button
                            key={result.message.id}
                            onClick={() => handleResultClick(result.chat.id, result.message.id)}
                            className="w-full text-left px-4 py-3 border-b border-border hover:bg-interactive-hover last:border-b-0 flex flex-col"
                        >
                            <div className="flex justify-between items-start">
                                <p className="text-base font-medium text-text-primary truncate">{result.chat.title}</p>
                                <span className="text-xs text-text-secondary flex-shrink-0 ml-4 mt-1">
                                    {new Date(result.chat.lastModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <p className="text-sm text-text-secondary line-clamp-2 mt-1">
                                {result.message.content}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
