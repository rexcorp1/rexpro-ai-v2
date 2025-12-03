import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { X, Code, Eye, RefreshCw, RotateCcw, RotateCw, SquareTerminal, Smartphone, Expand, Shrink, Play, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Project, FileSystemNode, initialFiles } from '../types';

export interface StreamingTarget {
    filePath: string;
    code: string;
}

const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};


const flattenFiles = (nodes: { [key: string]: FileSystemNode }, path = ''): { [key: string]: string } => {
    let flat: {[key:string]: string} = {};
    for (const key in nodes) {
        const newPath = path ? `${path}/${key}` : key;
        const node = nodes[key];
        if (typeof node.content === 'string') {
            flat[newPath] = node.content;
        }
        if (node.children) {
            Object.assign(flat, flattenFiles(node.children, newPath));
        }
    }
    return flat;
};

const findNode = (files: { [key: string]: FileSystemNode }, path: string): { parent: { [key: string]: FileSystemNode } | null, key: string, node: FileSystemNode } | null => {
    if (!path) return null;
    const parts = path.split('/');
    let current: any = { children: files };
    let parent: { [key: string]: FileSystemNode } | null = null;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === 0) parent = files;
        else {
            const parentPath = parts.slice(0, i).join('/');
            parent = findNode(files, parentPath)?.node.children || null;
        }

        if (!current.children || !current.children[part]) return null;
        if (i === parts.length - 1) {
            return { parent: current.children, key: part, node: current.children[part] };
        }
        current = current.children[part];
    }
    return null;
};


interface CodeInterpreterPanelProps {
  onClose: () => void;
  isMobile: boolean;
  isDarkMode: boolean;
  project: Project | undefined;
  onProjectChange: (project: Project) => void;
  activeFilePath: string;
  streamingTarget: StreamingTarget | null;
  onStreamComplete: () => void;
  isWidePreview: boolean;
  onToggleWidePreview: () => void;
}

const CodeInterpreterPanel: React.FC<CodeInterpreterPanelProps> = ({ 
    onClose, isMobile, isDarkMode, project, onProjectChange,
    activeFilePath, streamingTarget, onStreamComplete,
    isWidePreview, onToggleWidePreview
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'output'>('code');
  const [previewKey, setPreviewKey] = useState(0);
  const debounceTimeout = useRef<number | null>(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const editorRef = useRef<any>(null);
  const [consoleError, setConsoleError] = useState<{ message: string; stack?: string } | null>(null);
  const [displayedCode, setDisplayedCode] = useState('');
  const [isPreviewMobile, setIsPreviewMobile] = useState(false);
  const [mobileZoom, setMobileZoom] = useState(1.0);
  const prevStreamingTargetRef = useRef<StreamingTarget | null>(null);
  
  // Python execution state
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isPythonRunning, setIsPythonRunning] = useState(false);

  const fileType = useMemo(() => {
    if (!activeFilePath) return 'unsupported';
    if (activeFilePath.endsWith('.py')) return 'python';
    if (['.html', '.tsx', '.jsx', '.css', '.js', '.ts'].some(ext => activeFilePath.endsWith(ext))) return 'web';
    return 'unsupported';
  }, [activeFilePath]);

  // Automatically switch tabs when the active file changes, but prioritize the professional flow.
  useEffect(() => {
    // This effect runs once when the active file changes.
    // We set a default tab, but the streaming effect below will override it if needed.
    if (fileType === 'python') {
      setActiveTab('code');
    } else if (fileType === 'web') {
      setActiveTab('preview');
    }
  }, [activeFilePath, fileType]);

  // Professional Flow: Code First, then Preview.
  useEffect(() => {
    const wasStreaming = prevStreamingTargetRef.current !== null;
    const isStreaming = streamingTarget !== null;

    if (isStreaming) {
        // When streaming starts, always switch to the code tab.
        setActiveTab('code');
    } else if (wasStreaming && !isStreaming) {
        // When streaming just finished, automatically switch to the preview tab.
        setActiveTab('preview');
    }

    // Update the ref for the next render.
    prevStreamingTargetRef.current = streamingTarget;
  }, [streamingTarget]);


  const handleRunPython = async () => {
      if (isPythonRunning) return;
      setIsPythonRunning(true);
      setConsoleOutput([`$ python ${activeFilePath}`]);
      setActiveTab('output');

      const rapidApiKey = '0f68805e8amshf6e23614171c0d6p17c0aejsn14cee8df4d73';
      const sourceCode = displayedCode;

      try {
          // 1. Submit the code for execution
          const submitResponse = await fetch('https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=false', {
              method: 'POST',
              headers: {
                  'x-rapidapi-key': rapidApiKey,
                  'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  source_code: sourceCode,
                  language_id: 71, // Python 3.8
              })
          });

          if (!submitResponse.ok) {
              const errorData = await submitResponse.json();
              throw new Error(errorData.message || 'Failed to submit code for execution.');
          }
          const { token } = await submitResponse.json();
          if (!token) throw new Error("No execution token received.");

          // 2. Poll for the result
          while (true) {
              await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for 1.5 seconds

              const resultResponse = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=false`, {
                  method: 'GET',
                  headers: {
                      'x-rapidapi-key': rapidApiKey,
                      'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
                  }
              });
              
              if (!resultResponse.ok) throw new Error('Failed to fetch execution result.');

              const result = await resultResponse.json();

              // Status ID 1: In Queue, Status ID 2: Processing
              if (result.status.id > 2) {
                  const output = [];
                  if (result.compile_output) output.push(`[Compile Output]\n${result.compile_output}`);
                  if (result.stdout) output.push(`[Output]\n${result.stdout}`);
                  if (result.stderr) output.push(`[Error]\n${result.stderr}`);
                  if (result.message) output.push(`[Message]\n${result.message}`);
                  
                  const executionTime = result.time ? `Time: ${result.time}s` : '';
                  const memoryUsage = result.memory ? `Memory: ${result.memory} KB` : '';
                  const footer = [executionTime, memoryUsage].filter(Boolean).join(' | ');
                  if (footer) output.push(`\n[Execution Stats] ${footer}`);
                  
                  setConsoleOutput(prev => [...prev, ...output]);
                  break; 
              }
          }

      } catch (e: any) {
          setConsoleOutput(prev => [...prev, `[Execution Error] ${e.message}`]);
      } finally {
          setIsPythonRunning(false);
      }
  };

  const updateActiveProject = (updater: (project: Project) => void) => {
    if (!project) return;
    const newProject = JSON.parse(JSON.stringify(project));
    updater(newProject);
    onProjectChange(newProject);
  };
  
  const activeFileContent = useMemo(() => {
      if (!project || !activeFilePath) return '';
      const flat = flattenFiles(project.files);
      return flat[activeFilePath] ?? '';
  }, [project, activeFilePath]);

  // Effect to handle live streaming into the editor
  useEffect(() => {
      if (streamingTarget && streamingTarget.filePath === activeFilePath) {
          setDisplayedCode(streamingTarget.code);
      }
  }, [streamingTarget, activeFilePath]);
  
  // Effect to update editor when active file changes (and not streaming)
  useEffect(() => {
      if (!streamingTarget) {
          setDisplayedCode(activeFileContent);
      }
  }, [activeFileContent, streamingTarget]);
  
  // Effect to call onStreamComplete when streaming ends
  useEffect(() => {
    if (!streamingTarget) {
      onStreamComplete();
      // Auto-format after stream
      setTimeout(() => {
        editorRef.current?.getAction('editor.action.formatDocument')?.run();
      }, 100);
    }
  }, [streamingTarget, onStreamComplete]);


  const handleRefresh = useCallback(() => { 
    setConsoleError(null);
    setPreviewKey(prev => prev + 1) 
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.source !== iframeRef.current?.contentWindow) return;
        if (event.data.type === 'preview_error' && event.data.error) {
            setConsoleError(event.data.error);
            setIsConsoleOpen(true);
            setIsConsoleExpanded(false);
        } else if (event.data.type === 'preview_success') {
            setConsoleError(null);
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    if (streamingTarget) return; // Prevent user edits while AI is writing
    const newContent = value || '';
    setDisplayedCode(newContent);

    if (!activeFilePath) return;
    
    updateActiveProject(proj => {
        const nodeInfo = findNode(proj.files, activeFilePath);
        if (nodeInfo && typeof nodeInfo.node.content === 'string') {
          nodeInfo.node.content = newContent;
        }
    });

    if (fileType === 'web') {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = window.setTimeout(() => handleRefresh(), 500);
    }
  };
  
  const iframeSrcDoc = useMemo(() => {
    if (fileType !== 'web' || !project) return '<html><body></body></html>';

    const flatFiles = flattenFiles(project.files);
    let htmlContent = flatFiles['index.html'] || flatFiles[Object.keys(flatFiles).find(f => f.endsWith('.html')) || ''];

    // If streaming, use the live code from the editor
    if (streamingTarget && streamingTarget.filePath.endsWith('.html')) {
        htmlContent = streamingTarget.code;
    } else if (!streamingTarget && activeFilePath.endsWith('.html')) {
        // Use the saved project content, which is cleaned in the store
        htmlContent = activeFileContent;
    }

    if (!htmlContent) {
        return '<html><body class="bg-gray-100 dark:bg-gray-800"><div style="padding: 1rem; font-family: sans-serif;" class="text-gray-600 dark:text-gray-400">No HTML file found in project.</div></body></html>';
    }
    
    let html = htmlContent.replace(/<base[^>]*>/gi, ''); // Sanitize by removing <base> tags

    const headInjections = `
      <style>
        html::-webkit-scrollbar { width: 8px; height: 8px; }
        html::-webkit-scrollbar-track { background: transparent; }
        html::-webkit-scrollbar-thumb { background-color: transparent; border-radius: 4px; }
        html:hover::-webkit-scrollbar-thumb { background-color: #d1d5db; }
        html::-webkit-scrollbar-thumb:hover { background-color: #9ca3af; }
        @media (prefers-color-scheme: dark) {
          html:hover::-webkit-scrollbar-thumb { background-color: #4b5563; }
          html::-webkit-scrollbar-thumb:hover { background-color: #6b7280; }
        }
        html { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        html:hover { scrollbar-color: #d1d5db transparent; }
        @media (prefers-color-scheme: dark) { html:hover { scrollbar-color: #4b5563 transparent; } }
      </style>
      <script>
        window.onerror = function(message, source, lineno, colno, error) {
          const errorPayload = { message: message.toString(), stack: error ? error.stack : '' };
          window.parent.postMessage({ type: 'preview_error', error: errorPayload }, '*');
          return true;
        };
        console.log = function(...args) {
          window.parent.postMessage({ type: 'preview_log', message: args.map(a => JSON.stringify(a)).join(' ') }, '*');
        };
        window.addEventListener('load', () => {
          window.parent.postMessage({ type: 'preview_success' }, '*');
        });
      </script>
    `;

    const headEnd = html.indexOf('</head>');
    if (headEnd !== -1) {
        html = html.slice(0, headEnd) + headInjections + html.slice(headEnd);
    } else {
        html += headInjections; // fallback
    }
    
    return html;
  }, [project, activeFileContent, previewKey, fileType, streamingTarget, activeFilePath]);
  
  const getLanguageFromPath = (path: string): string => {
      const extension = path.split('.').pop() || '';
      switch(extension) {
          case 'py': return 'python';
          case 'tsx': return 'typescript';
          case 'jsx': return 'javascript';
          case 'js': return 'javascript';
          case 'ts': return 'typescript';
          case 'html': return 'html';
          case 'css': return 'css';
          case 'json': return 'json';
          case 'md': return 'markdown';
          default: return 'plaintext';
      }
  };
  
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    monaco.editor.defineTheme('custom-light', {
        base: 'vs', inherit: true, rules: [],
        colors: { 'scrollbar.shadow': '#00000000', 'scrollbarSlider.background': '#d1d5db80', 'scrollbarSlider.hoverBackground': '#9ca3af', 'scrollbarSlider.activeBackground': '#9ca3af' }
    });

    monaco.editor.defineTheme('custom-dark', {
        base: 'vs-dark', inherit: true, rules: [],
        colors: { 'scrollbar.shadow': '#00000000', 'scrollbarSlider.background': '#4b556380', 'scrollbarSlider.hoverBackground': '#6b7280', 'scrollbarSlider.activeBackground': '#6b7280' }
    });
  };
  
  const handleUndo = () => editorRef.current?.trigger('source', 'undo', null);
  const handleRedo = () => editorRef.current?.trigger('source', 'redo', null);

  const projectHasFiles = useMemo(() => project && Object.keys(project.files).length > 0, [project]);

  if (!project || !projectHasFiles) {
    // This case should ideally not be hit if the store creates a default project,
    // but it's a safe fallback.
    return (
      <aside className="bg-background flex-shrink-0 overflow-hidden flex flex-col w-full h-full border border-border rounded-lg">
          <div className="m-auto flex flex-col items-center gap-2 text-text-secondary">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
              <span className="text-sm font-medium">Preparing Canvas...</span>
          </div>
      </aside>
    );
  }

  const renderCodeView = () => (
    <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-[#1e1e1e]">
        <Editor
            height="100%"
            path={activeFilePath}
            language={getLanguageFromPath(activeFilePath)}
            value={displayedCode}
            onChange={handleEditorChange}
            theme={isDarkMode ? 'custom-dark' : 'light'}
            options={{ 
              minimap: { enabled: false }, fontSize: 14, wordWrap: 'on', automaticLayout: true, glyphMargin: false, 
              folding: false, lineNumbersMinChars: 3, padding: { top: 10 }, lineDecorationsWidth: 5,
              readOnly: !!streamingTarget,
              scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
            }}
            onMount={handleEditorDidMount}
        />
    </div>
  );

  const renderPreviewView = () => (
    <div className={`flex-1 bg-gray-100 dark:bg-gray-800 flex flex-col transition-all duration-300 ${isPreviewMobile ? 'p-4 bg-gray-200 dark:bg-gray-900 justify-center items-center overflow-auto' : ''}`}>
        <div className="flex-1 relative w-full h-full flex justify-center items-center">
            <iframe 
                ref={iframeRef} 
                key={previewKey} 
                srcDoc={iframeSrcDoc} 
                title="Code Preview" 
                sandbox="allow-scripts allow-same-origin" 
                className={`bg-white border-none transition-transform duration-300 ${isPreviewMobile ? 'shadow-2xl rounded-2xl border-4 border-black dark:border-gray-600' : 'w-full h-full'}`}
                style={isPreviewMobile ? {
                    width: '375px',
                    height: '667px',
                    transform: `scale(${mobileZoom})`,
                    flexShrink: 0
                } : {
                    width: '100%',
                    height: '100%'
                }}
            />
        </div>
    </div>
  );

  const renderPythonOutputView = () => (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-950 text-gray-200 font-mono text-sm p-4 overflow-y-auto hover-scrollbar">
        <div className="text-xs text-yellow-300/80 bg-yellow-900/30 border-l-2 border-yellow-500 p-2 mb-4 font-sans rounded-r-sm">
            <b>Note:</b> Python code is executed remotely using the Judge0 API.
        </div>
        {consoleOutput.map((line, i) => <pre key={i} className="whitespace-pre-wrap break-words">{line}</pre>)}
    </div>
  );

  const renderMainView = () => (
      <>
        <div className="flex items-center justify-between p-2 pr-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2">
                <div className="flex space-x-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-md">
                    <button onClick={() => setActiveTab('code')} className={`flex items-center gap-2 w-full justify-center px-3 py-1 text-sm font-medium rounded transition-colors ${activeTab === 'code' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}><Code className="h-4 w-4" /> Code</button>
                    {fileType === 'web' && <button onClick={() => setActiveTab('preview')} className={`flex items-center gap-2 w-full justify-center px-3 py-1 text-sm font-medium rounded transition-colors ${activeTab === 'preview' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}><Eye className="h-4 w-4" /> Preview</button>}
                    {fileType === 'python' && <button onClick={() => setActiveTab('output')} className={`flex items-center gap-2 w-full justify-center px-3 py-1 text-sm font-medium rounded transition-colors ${activeTab === 'output' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}><SquareTerminal className="h-4 w-4" /> Output</button>}
                </div>
                {activeTab === 'code' && (
                  <div className="flex items-center">
                    <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <button onClick={handleUndo} className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" data-tooltip-text="Undo" data-tooltip-position="bottom"><RotateCcw className="h-4 w-4" /></button>
                    <button onClick={handleRedo} className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" data-tooltip-text="Redo" data-tooltip-position="bottom"><RotateCw className="h-4 w-4" /></button>
                  </div>
                )}
            </div>
             <div className="flex items-center gap-1">
                {fileType === 'python' && (
                    <button onClick={handleRunPython} disabled={isPythonRunning} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-wait">
                      {isPythonRunning ? <Loader2 className="h-4 w-4 animate-spin"/> : <Play className="h-4 w-4" />} Run
                    </button>
                )}
                {fileType === 'web' && activeTab === 'preview' && (
                    <>
                        {isPreviewMobile && (
                            <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-md ml-2">
                                <button onClick={() => setMobileZoom(1.0)} className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${mobileZoom === 1.0 ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}>100%</button>
                                <button onClick={() => setMobileZoom(0.75)} className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${mobileZoom === 0.75 ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}>75%</button>
                                <button onClick={() => setMobileZoom(0.5)} className={`px-2 py-0.5 text-xs rounded-sm transition-colors ${mobileZoom === 0.5 ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}>50%</button>
                            </div>
                        )}
                        <button onClick={() => setIsPreviewMobile(p => !p)} className={`p-1.5 rounded-md transition-colors ${isPreviewMobile ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`} data-tooltip-text="Toggle Mobile View" data-tooltip-position="bottom"><Smartphone className="h-4 w-4" /></button>
                        <button onClick={onToggleWidePreview} className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" data-tooltip-text={isWidePreview ? "Shrink View" : "Expand View"} data-tooltip-position="bottom">{isWidePreview ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}</button>
                        <button onClick={handleRefresh} className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" data-tooltip-text="Refresh Preview" data-tooltip-position="bottom"><RefreshCw className="h-4 w-4" /></button>
                        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    </>
                )}
                {fileType === 'web' && (
                    <button onClick={() => setIsConsoleOpen(p => !p)} className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md relative" data-tooltip-text="Toggle Console" data-tooltip-position="bottom">
                      <SquareTerminal className={`h-4 w-4 ${consoleError ? 'text-red-500' : ''}`} />
                      {consoleError && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></div>}
                    </button>
                )}
                <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <button onClick={onClose} data-tooltip-text="Close panel" data-tooltip-position="bottom" className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"><X className="h-5 w-5" /></button>
             </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <div 
              className="flex-1 min-h-0 flex flex-col overflow-hidden transition-[max-height] duration-300 ease-in-out"
              style={{ maxHeight: isConsoleOpen && isConsoleExpanded ? '0px' : '100%' }}
          >
              {activeTab === 'code' && renderCodeView()}
              {activeTab === 'preview' && fileType === 'web' && renderPreviewView()}
              {activeTab === 'output' && fileType === 'python' && renderPythonOutputView()}
          </div>
          
          {fileType === 'web' && (
              <div 
                  className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isConsoleExpanded ? 'flex-1 flex flex-col' : 'flex-shrink-0'}`}
                  style={{ maxHeight: isConsoleOpen ? (isConsoleExpanded ? '100vh' : '115px') : '0px' }}
              >
                  <div className="flex flex-col h-full" style={{ backgroundColor: '#1f1f1f' }}>
                      <div className="flex items-center justify-between px-3 py-1 flex-shrink-0">
                          <span className="text-xs font-semibold tracking-wider text-gray-300 uppercase">Console</span>
                          <div className="flex items-center">
                              <button onClick={() => setIsConsoleExpanded(p => !p)} className="p-1 text-gray-400 hover:text-gray-200 rounded-md" data-tooltip-text={isConsoleExpanded ? "Collapse" : "Expand"} data-tooltip-position="top">
                                  {isConsoleExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                              </button>
                              <button onClick={() => setIsConsoleOpen(false)} className="p-1 text-gray-400 hover:text-gray-200 rounded-md" data-tooltip-text="Close" data-tooltip-position="top">
                                  <X className="h-4 w-4" />
                              </button>
                          </div>
                      </div>
                      <div className={`p-3 overflow-y-auto hover-scrollbar flex-1 ${consoleError ? 'bg-red-900/20 text-red-200' : 'text-gray-400'}`}>
                          {consoleError ? <pre className="text-xs whitespace-pre-wrap font-mono">{consoleError.message}{consoleError.stack && `\n\n${consoleError.stack}`}</pre> : <p className="text-xs font-mono">No errors.</p>}
                      </div>
                  </div>

              </div>
          )}
        </div>
      </>
  );

  return (
    <aside className="bg-white dark:bg-gray-950 flex-shrink-0 overflow-hidden flex flex-col w-full h-full border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="w-full transition-opacity duration-150 ease-in-out flex flex-col flex-1 min-h-0">
          {renderMainView()}
      </div>
    </aside>
  );
};

export default CodeInterpreterPanel;