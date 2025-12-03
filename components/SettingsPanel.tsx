
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Sun, Moon, Monitor, User, Database, Info, Trash2, Download, ChevronDown, LogOut, DollarSign, Eye, EyeOff } from 'lucide-react';
import { Model } from '../types';
import { useAppStore } from '../store';

type Theme = 'light' | 'dark' | 'system';

interface SettingsPanelProps {
  onClose: () => void;
  initialTab?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, initialTab = 'general' }) => {
  const {
      theme,
      setTheme,
      setIsClearHistoryModalOpen,
      usageStats,
      setIsResetUsageModalOpen,
      exportHistory,
      userApiKey,
      setUserApiKey,
      currentUser,
      logout,
  } = useAppStore();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [apiKeyInput, setApiKeyInput] = useState(userApiKey || '');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const modelNameMap = useMemo(() => {
    const map: Record<string, string> = {
      [Model.GEMINI_3_PRO_PREVIEW]: 'Gemini 3 Pro Preview',
      [Model.GEMINI_3_PRO_IMAGE_PREVIEW]: 'Gemini 3 Pro Image',
      [Model.GEMINI_2_5_PRO]: 'Gemini 2.5 Pro',
      [Model.GEMINI_2_5_FLASH]: 'Gemini 2.5 Flash',
      [Model.GEMINI_2_5_FLASH_LITE]: 'Gemini 2.5 Flash-Lite',
      [Model.GEMINI_2_0_FLASH]: 'Gemini 2.0 Flash',
      [Model.GEMINI_2_0_FLASH_LITE]: 'Gemini 2.0 Flash-Lite',
      [Model.GEMINI_2_5_FLASH_IMAGE]: 'Flash 2.5 Image',
      [Model.GEMINI_2_0_FLASH_IMAGE_PREVIEW]: 'Flash 2.0 Image Preview',
      [Model.IMAGEN_4_0_GENERATE_001]: 'Imagen 4',
      [Model.IMAGEN_4_0_ULTRA_GENERATE_001]: 'Imagen 4 Ultra',
      [Model.IMAGEN_4_0_FAST_GENERATE_001]: 'Imagen 4 Fast',
      [Model.IMAGEN_3_0_GENERATE_002]: 'Imagen 3',
      [Model.VEO_3_0_GENERATE_PREVIEW]: 'Veo 3 Preview',
      [Model.VEO_3_0_FAST_GENERATE_PREVIEW]: 'Veo 3 Fast Preview',
      [Model.VEO_2_0_GENERATE_001]: 'Veo 2',
    };
    return map;
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
    setApiKeyInput(userApiKey || '');
    setSaveMessage('');
  }, [initialTab, userApiKey]);
  
  const handleSaveKey = () => {
    setUserApiKey(apiKeyInput.trim() || null);
    setSaveMessage('API Key saved!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleClearKey = () => {
      setApiKeyInput('');
      setUserApiKey(null);
      setSaveMessage('API Key cleared!');
      setTimeout(() => setSaveMessage(''), 2000);
  };


  const NavItem = ({ id, label, Icon }: { id: string; label: string; Icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
        activeTab === id
          ? 'bg-accent/10 text-accent font-medium'
          : 'text-text-secondary hover:bg-interactive-hover hover:text-text-primary'
      }`}
    >
      <Icon className="h-4 w-4 mr-3" />
      <span>{label}</span>
    </button>
  );

  const ThemeButton = ({ value, label, Icon }: { value: Theme; label: string; Icon: React.ElementType }) => (
    <button
      onClick={() => setTheme(value)}
      className={`flex-1 p-2 rounded-lg border-2 transition-colors ${
        theme === value
          ? 'border-accent bg-accent/10'
          : 'border-border hover:bg-interactive-hover'
      }`}
    >
      <div className="flex flex-col items-center">
        <Icon className="h-6 w-6 mb-1 text-text-primary" />
        <span className="text-sm font-medium text-text-primary">{label}</span>
      </div>
    </button>
  );
  
  return (
    <div className="h-full w-full flex flex-col md:flex-row overflow-hidden bg-background">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-border bg-background md:bg-card/30 flex flex-col">
            <div className="p-4 md:p-6 flex items-center justify-between md:block">
                 <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
                 <button onClick={onClose} className="md:hidden text-text-secondary hover:text-text-primary p-1 rounded-full hover:bg-interactive-hover" aria-label="Close settings">
                    <X className="h-5 w-5" />
                </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 pb-4 md:px-6 md:pb-6">
                <NavItem id="general" label="General" Icon={Sun} />
                <NavItem id="account" label="Account & API" Icon={User} />
                <NavItem id="data" label="Data & Privacy" Icon={Database} />
                <NavItem id="usage" label="Usage" Icon={DollarSign} />
                <NavItem id="about" label="About" Icon={Info} />
            </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-background h-full relative">
             {/* Desktop Close Button */}
             <div className="absolute top-4 right-4 hidden md:block z-10">
                <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-2 rounded-full hover:bg-interactive-hover" aria-label="Close settings">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto hover-scrollbar p-4 md:p-10 max-w-4xl w-full">
                {activeTab === 'general' && (
                  <div>
                      <h3 className="text-xl font-bold text-text-primary mb-6">General</h3>
                      <div className="space-y-6">
                      <div>
                          <label className="text-sm font-medium text-text-primary mb-2 block">Theme</label>
                          <div className="flex gap-4">
                          <ThemeButton value="light" label="Light" Icon={Sun} />
                          <ThemeButton value="dark" label="Dark" Icon={Moon} />
                          <ThemeButton value="system" label="System" Icon={Monitor} />
                          </div>
                      </div>
                      <div>
                          <label className="text-sm font-medium text-text-primary mb-2 block">Voice Model</label>
                          <div className="w-full p-2.5 border border-border rounded-lg text-sm text-text-secondary bg-card">
                              Gemini 2.5 Flash (Native Audio)
                          </div>
                          <p className="text-xs text-text-secondary mt-1 px-1">
                              Using the recommended model for live conversation.
                          </p>
                      </div>
                      </div>
                  </div>
                )}
                {activeTab === 'account' && (
                  <div>
                    <h3 className="text-xl font-bold text-text-primary mb-6">Account & API</h3>
                    <div className="space-y-6 text-sm">
                       {currentUser && !currentUser.isGuest && (
                        <div className="p-4 border border-border rounded-lg flex justify-between items-center">
                            <div>
                                <h4 className="font-semibold text-text-primary text-base">Logged In</h4>
                                <p className="text-text-secondary">{currentUser.name}</p>
                            </div>
                            <button onClick={logout} className="px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-interactive-hover rounded-md flex items-center gap-2 border border-border">
                                <LogOut className="h-4 w-4"/> Logout
                            </button>
                        </div>
                       )}
                      <div>
                        <h4 className="font-semibold text-text-primary mb-2 text-base">API Key Management</h4>
                        <p className="text-sm text-text-secondary mt-1 mb-3">
                            Provide your own Gemini API Key to use the application. 
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline ml-1">Get your key here.</a>
                        </p>
                        <div className="relative">
                            <input
                                type={isKeyVisible ? 'text' : 'password'}
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                placeholder="Enter your Gemini API Key"
                                className="w-full p-2.5 pr-10 border border-border rounded-lg text-sm text-text-primary bg-background focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] focus:border-transparent font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => setIsKeyVisible(!isKeyVisible)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-text-secondary"
                            >
                                {isKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 px-1">
                            <b>Warning:</b> Your API key is stored locally in your browser. Do not use this on a shared computer.
                        </p>
                        <div className="flex items-center justify-between mt-3">
                            <div>
                                <button onClick={handleSaveKey} className="px-3 py-1.5 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent-hover">Save Key</button>
                                <button onClick={handleClearKey} className="px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-interactive-hover rounded-md ml-2">Clear</button>
                            </div>
                            <span className="text-sm text-green-600 dark:text-green-400 transition-opacity duration-300">{saveMessage}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'data' && (
                <div>
                    <h3 className="text-xl font-bold text-text-primary mb-6">Data & Privacy</h3>
                    <div className="space-y-4">
                    <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold text-text-primary">Export Chat History</h4>
                        <p className="text-sm text-text-secondary mt-1 mb-3">Download all your conversations as a JSON file.</p>
                        <button onClick={exportHistory} className="px-3 py-1.5 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-hover flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                    <div className="p-4 border border-red-300 dark:border-red-700/60 rounded-lg bg-red-50/50 dark:bg-red-900/20">
                        <h4 className="font-semibold text-red-800 dark:text-red-200">Clear Chat History</h4>
                        <p className="text-sm text-red-600 dark:text-red-300/80 mt-1 mb-3">Permanently delete all of your chat history. This action cannot be undone.</p>
                        <button onClick={() => setIsClearHistoryModalOpen(true)} className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Clear All Data
                        </button>
                    </div>
                    </div>
                </div>
                )}
                {activeTab === 'usage' && (
                <div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">Usage</h3>
                    <p className="text-sm text-text-secondary mb-6">
                    Estimated costs based on your usage. Prices may not be final. Video costs are estimated assuming a 10-second duration.
                    </p>
                    
                    <div className="mb-6 p-4 bg-card rounded-lg">
                    <p className="text-sm text-text-secondary">Total Estimated Cost</p>
                    <p className="text-3xl font-bold text-text-primary">${usageStats.totalCost.toFixed(6)}</p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-text-primary">Cost Breakdown by Model</h4>
                        <div className="border border-border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-card/50">
                                        <tr>
                                            <th className="px-4 py-2 font-medium text-text-secondary">Model</th>
                                            <th className="px-4 py-2 font-medium text-text-secondary text-right">Input Tokens</th>
                                            <th className="px-4 py-2 font-medium text-text-secondary text-right">Output Tokens</th>
                                            <th className="px-4 py-2 font-medium text-text-secondary text-right">Images/Videos</th>
                                            <th className="px-4 py-2 font-medium text-text-secondary text-right">Est. Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {Object.entries(usageStats.breakdown).length > 0 ? Object.entries(usageStats.breakdown).map(([modelId, data]: [string, any]) => (
                                            <tr key={modelId}>
                                                <td className="px-4 py-2 font-medium text-text-primary">{modelNameMap[modelId] || modelId}</td>
                                                <td className="px-4 py-2 text-text-secondary text-right">{data.inputTokens.toLocaleString()}</td>
                                                <td className="px-4 py-2 text-text-secondary text-right">{data.outputTokens.toLocaleString()}</td>
                                                <td className="px-4 py-2 text-text-secondary text-right">{(data.images + data.videos).toLocaleString()}</td>
                                                <td className="px-4 py-2 text-text-secondary text-right">${data.cost.toFixed(6)}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-4 text-center text-text-secondary">No usage data recorded yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-border">
                            <button onClick={() => setIsResetUsageModalOpen(true)} className="w-full sm:w-auto px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center gap-2">
                                <Trash2 className="h-4 w-4" />
                                Reset Usage Data
                            </button>
                        </div>
                    </div>
                </div>
                )}
                {activeTab === 'about' && (
                <div>
                    <h3 className="text-xl font-bold text-text-primary mb-6">About</h3>
                    <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center p-3 bg-card rounded-lg">
                            <span className="font-medium text-text-secondary">App Version</span>
                            <span className="text-text-primary">2.0.0 (Local Edition)</span>
                        </div>
                        <div className="p-3 bg-card rounded-lg">
                            <span className="font-medium text-text-secondary block mb-2">Helpful Links</span>
                            <ul className="space-y-1">
                                <li><a href="https://ai.google.dev/docs" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Gemini API Documentation</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </main>
    </div>
  );
};
