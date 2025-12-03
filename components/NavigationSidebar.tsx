import React, { useState, useEffect, useRef } from 'react';
import { Plus, Settings, MoreVertical, Edit, Trash2, Search } from 'lucide-react';
import { ChatSession } from '../types';
import { useAppStore } from '../store';

interface NavigationSidebarProps {
  isSidebarOpen: boolean;
  isMobile: boolean;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ isSidebarOpen, isMobile }) => {
  const { 
      chatHistory,
      activeChatId,
      newChat,
      selectChat,
      deleteChat,
      renameChat,
      openSettingsPanel,
      toggleSearchVisibility,
      currentUser,
   } = useAppStore();
  
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [bottomSheetChat, setBottomSheetChat] = useState<ChatSession | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const isLongPress = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleTouchStart = (chat: ChatSession) => {
    isLongPress.current = false;
    longPressTimer.current = window.setTimeout(() => {
        isLongPress.current = true;
        setBottomSheetChat(chat);
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
    }
  };

  const handleTouchMove = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
      }
  };
  
  const handleClick = (chat: ChatSession) => {
      if (isMobile && isLongPress.current) {
          return; // Prevent navigation on long press
      }
      if (renamingId !== chat.id) {
          selectChat(chat.id);
      }
  };

  const handleRenameStart = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
    setMenuId(null);
  };

  const handleRenameSubmit = () => {
    if (renamingId && renameValue.trim()) {
      renameChat(renamingId, renameValue);
    }
    setRenamingId(null);
  };
  
  const handleMobileRenameStart = (id: string, currentTitle: string) => {
      setBottomSheetChat(null);
      setTimeout(() => handleRenameStart(id, currentTitle), 100);
  };
  
  const handleMobileDelete = (id: string) => {
      setBottomSheetChat(null);
      deleteChat(id);
  };
  
  const isActuallyOpen = isMobile ? true : isSidebarOpen;

  return (
    <>
        <aside
          className={`
            bg-background flex flex-col p-4
            transition-all duration-300 ease-in-out flex-shrink-0
            ${ isMobile
                ? `fixed top-14 bottom-0 left-0 z-30 w-[260px] ${isSidebarOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full'}`
                : `${isSidebarOpen ? 'w-[260px]' : 'w-20'}`
            }
          `}
        >
          <div className={`flex items-center gap-2 mb-6 px-1 flex-shrink-0 overflow-hidden ${isMobile ? 'hidden' : ''}`}>
              <svg viewBox="0 0 200 200" version="1.1" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 flex-shrink-0" aria-label="REXPro AI Logo">
                <g>
                <path fill="var(--color-text-primary)" d=" M 10.77 10.73 C 15.59 5.58 22.13 2.14 29.01 0.73 C 76.01 0.64 123.02 0.71 170.02 0.70 C 186.13 2.89 198.92 17.84 200.00 33.88 L 200.00 163.20 C 199.89 173.29 195.41 183.15 188.00 189.95 C 182.05 195.55 174.12 198.60 166.18 200.00 L 36.25 200.00 C 24.84 199.20 13.50 193.56 6.89 184.04 C 2.65 178.25 0.52 171.16 0.00 164.06 L 0.00 37.24 C 0.26 27.56 3.64 17.53 10.77 10.73 M 60.48 52.77 C 60.52 83.91 60.53 115.06 60.48 146.20 C 86.91 146.23 113.34 146.09 139.77 146.27 C 133.04 139.27 126.76 131.85 120.07 124.83 C 108.59 113.31 88.30 113.22 76.51 124.33 C 75.53 123.32 74.55 122.32 73.58 121.31 C 84.71 109.73 84.55 89.83 73.54 78.21 C 74.55 77.28 75.55 76.34 76.56 75.40 C 82.43 80.64 90.21 83.72 98.10 83.65 C 105.97 83.74 113.70 80.58 119.60 75.44 C 120.58 76.37 121.56 77.29 122.54 78.22 C 117.37 84.21 114.03 91.98 114.29 99.98 C 114.10 108.51 117.92 116.79 123.86 122.80 C 131.42 116.48 136.98 107.59 138.34 97.75 C 140.22 86.02 136.27 73.57 128.04 65.02 C 120.62 57.11 109.79 52.55 98.95 52.75 C 86.13 52.78 73.30 52.75 60.48 52.77 Z" />
                </g>
                <g>
                <path fill="var(--color-background)" d=" M 60.48 52.77 C 73.30 52.75 86.13 52.78 98.95 52.75 C 109.79 52.55 120.62 57.11 128.04 65.02 C 136.27 73.57 140.22 86.02 138.34 97.75 C 136.98 107.59 131.42 116.48 123.86 122.80 C 117.92 116.79 114.10 108.51 114.29 99.98 C 114.03 91.98 117.37 84.21 122.54 78.22 C 121.56 77.29 120.58 76.37 119.60 75.44 C 113.70 80.58 105.97 83.74 98.10 83.65 C 90.21 83.72 82.43 80.64 76.56 75.40 C 75.55 76.34 74.55 77.28 73.54 78.21 C 84.55 89.83 84.71 109.73 73.58 121.31 C 74.55 122.32 75.53 123.32 76.51 124.33 C 88.30 113.22 108.59 113.31 120.07 124.83 C 126.76 131.85 133.04 139.27 139.77 146.27 C 113.34 146.09 86.91 146.23 60.48 146.20 C 60.53 115.06 60.52 83.91 60.48 52.77 Z" />
                </g>
              </svg>
              <h1 className={`text-lg font-semibold text-text-primary whitespace-nowrap transition-opacity duration-200 ${isActuallyOpen ? 'opacity-100' : 'opacity-0'}`}>REXPro AI</h1>
          </div>
          <button
            onClick={newChat}
            data-tooltip-text="New Chat"
            data-tooltip-position={isActuallyOpen ? "bottom" : "right"}
            className={`flex items-center w-[85%] px-3 py-2 text-sm font-medium text-text-primary bg-card rounded-lg hover:bg-interactive-hover transition-colors flex-shrink-0`}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className={`ml-2 whitespace-nowrap overflow-hidden transition-all duration-200 ${isActuallyOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>New Chat</span>
          </button>

          <div className={`mt-6 flex-1 flex flex-col min-h-0 transition-opacity duration-200 ${isActuallyOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="sticky top-0 bg-background z-10 flex justify-between items-center px-3 py-2">
                <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">RECENTS</h2>
                <button
                    onClick={toggleSearchVisibility}
                    className="text-text-secondary hover:text-text-primary"
                    data-tooltip-text="Search History"
                    data-tooltip-position="bottom"
                >
                    <Search className="h-4 w-4" />
                </button>
            </div>
            <nav className="flex-1 overflow-y-auto hover-scrollbar [scrollbar-gutter:stable] pb-4">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleClick(chat)}
                  onTouchStart={isMobile ? () => handleTouchStart(chat) : undefined}
                  onTouchEnd={isMobile ? handleTouchEnd : undefined}
                  onTouchMove={isMobile ? handleTouchMove : undefined}
                  className={`group flex items-center justify-between px-3 py-2 text-sm text-text-secondary rounded-lg cursor-pointer hover:bg-interactive-hover ${chat.id === activeChatId ? 'bg-card font-semibold' : ''}`}
                >
                  {renamingId === chat.id ? (
                    <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit();
                            if (e.key === 'Escape') setRenamingId(null);
                        }}
                        className="w-full bg-transparent border-b border-accent focus:outline-none text-sm"
                    />
                  ) : (
                    <span className="truncate flex-1">{chat.title}</span>
                  )}
                  
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuId(menuId === chat.id ? null : chat.id);
                      }}
                      data-tooltip-text="Options"
                      data-tooltip-position="left"
                      className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-text-primary p-1 rounded-full transition-opacity hidden md:flex"
                      aria-label={`Options for chat: ${chat.title}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                     {!isMobile && menuId === chat.id && (
                      <div ref={menuRef} className="absolute right-[-0.8rem] top-[2.5rem] w-40 bg-background border border-border rounded-lg shadow-lg z-10 p-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRenameStart(chat.id, chat.title); }}
                          className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-text-primary hover:bg-interactive-hover rounded-md"
                        >
                          <Edit className="w-3.5 h-3.5" /> Rename
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); setMenuId(null); }}
                          className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className={`mt-auto flex-shrink-0 space-y-4 transition-opacity duration-300 ease-in-out ${isActuallyOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={() => openSettingsPanel('general')}
              data-tooltip-text="Settings"
              data-tooltip-position="top"
              className={`flex items-center w-[85%] px-3 py-2 text-sm font-medium text-text-primary bg-card rounded-lg hover:bg-interactive-hover transition-colors flex-shrink-0`}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span className={`ml-2 whitespace-nowrap overflow-hidden`}>Settings</span>
            </button>
            <div>
              {currentUser && (
                  <div className="w-[85%] px-3 text-sm text-text-secondary overflow-hidden whitespace-nowrap">
                      Login as <span className="font-bold text-text-primary">{currentUser.name}</span>
                  </div>
              )}
            </div>
          </div>
        </aside>
        
        {isMobile && bottomSheetChat && (
            <>
                <div 
                    className="fixed inset-0 bg-black/50 z-40 animate-fade-in" 
                    onClick={() => setBottomSheetChat(null)}
                />
                <div className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl z-50 p-4 pb-6 shadow-lg animate-slide-up">
                    <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4"></div>
                    <div className="mb-4 px-2">
                        <p className="text-sm text-text-secondary">Options for:</p>
                        <p className="font-semibold text-text-primary truncate">{bottomSheetChat.title}</p>
                    </div>
                    <div className="space-y-2">
                        <button
                            onClick={() => handleMobileRenameStart(bottomSheetChat.id, bottomSheetChat.title)}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 text-base text-text-primary hover:bg-interactive-hover rounded-lg transition-colors"
                        >
                            <Edit className="w-5 h-5" /> Rename
                        </button>
                        <button
                            onClick={() => handleMobileDelete(bottomSheetChat.id)}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 text-base text-red-600 dark:text-red-500 hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-5 h-5" /> Delete
                        </button>
                    </div>
                </div>
            </>
        )}
    </>
  );
};