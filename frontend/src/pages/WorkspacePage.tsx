import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Editor, { OnMount } from '@monaco-editor/react';
import {
  Bot,
  Send,
  X,
  FileCode2,
  MessageSquare,
  Sparkles,
  Zap,
  Wrench,
  FlaskConical,
  Copy,
  Check,
  CheckCheck,
  Loader2,
  Trash2,
  Boxes,
  Key,
  Play,
} from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { useFileStore } from '../stores/fileStore';
import { useCollaborationStore } from '../stores/collaborationStore';
import { useChatStore } from '../stores/chatStore';
import { useExecutionStore } from '../stores/executionStore';
import { useAiStore } from '../stores/aiStore';
import { useExtensionStore } from '../stores/extensionStore';
import { WorkspaceHeader } from '../components/workspace/WorkspaceHeader';
import { WorkspaceFooter } from '../components/workspace/WorkspaceFooter';
import { FileTree } from '../components/workspace/FileTree';
import { EditorTabs } from '../components/workspace/EditorTabs';
import { WorkspaceTerminal } from '../components/workspace/WorkspaceTerminal';
import { WorkspaceChatPanel } from '../components/workspace/WorkspaceChatPanel';
import { ExtensionsPanel } from '../components/workspace/ExtensionsPanel';
import { ExtensionRequiredModal } from '../components/workspace/ExtensionRequiredModal';
import { ProjectMembersModal } from '../components/dashboard/ProjectMembersModal';
import { SnapshotModal } from '../components/workspace/SnapshotModal';
import { VersionHistoryDrawer } from '../components/workspace/VersionHistoryDrawer';
import { GeminiApiKeyModal } from '../components/workspace/GeminiApiKeyModal';
import { updateRemoteCursorDecorations } from '../utils/monacoDecorations';
import { IFileNode, IExtension } from '../types';

export const WorkspacePage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { currentProject, getProject } = useProjectStore();
  const {
    fileTree,
    activeFileId,
    fileContents,
    fetchProjectFiles,
    openFile,
    updateLocalContent,
    saveFile,
    saveAllDirtyFiles,
  } = useFileStore();

  const {
    peerCursors,
    joinWorkspace,
    leaveWorkspace,
    updateActiveFilePresence,
    joinFileCRDT,
    leaveFileCRDT,
    broadcastCursor,
    sendContentChange,
  } = useCollaborationStore();

  const { unreadCount } = useChatStore();
  const { isRunning, runCode } = useExecutionStore();
  const {
    messages: aiMessages,
    isLoading: isAiLoading,
    geminiApiKey,
    sendMessage: sendAiMessage,
    explainCode,
    refactorCode,
    fixError,
    generateTests,
    clearHistory: clearAiHistory,
  } = useAiStore();

  const {
    isLanguageSupported,
    installExtension,
    getExtensionForLanguage,
  } = useExtensionStore();

  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<'ai' | 'chat' | 'extensions'>('ai');
  const [requiredExtensionModal, setRequiredExtensionModal] = useState<{
    isOpen: boolean;
    language: string;
    extension?: IExtension;
  }>({
    isOpen: false,
    language: '',
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [appliedSnippetId, setAppliedSnippetId] = useState<string | null>(null);

  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const currentSelectionRef = useRef<any>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  // Load project details and files
  useEffect(() => {
    if (projectId) {
      getProject(projectId);
      fetchProjectFiles(projectId);
      joinWorkspace(projectId, activeFileId);
    }
    return () => {
      if (projectId) {
        leaveWorkspace(projectId);
      }
    };
  }, [projectId, getProject, fetchProjectFiles, joinWorkspace, leaveWorkspace]);

  // Connect active file to real-time CRDT room
  useEffect(() => {
    if (activeFileId && projectId) {
      updateActiveFilePresence(projectId, activeFileId);
      joinFileCRDT(activeFileId, fileContents[activeFileId] || '', (newContent) => {
        updateLocalContent(activeFileId, newContent);
      });

      return () => {
        leaveFileCRDT(activeFileId);
      };
    }
  }, [activeFileId, projectId, updateActiveFilePresence, joinFileCRDT, leaveFileCRDT, updateLocalContent]);

  // Update Monaco decorations whenever peer cursors change
  useEffect(() => {
    if (editorRef.current) {
      decorationsRef.current = updateRemoteCursorDecorations(
        editorRef.current,
        peerCursors,
        decorationsRef.current
      );
    }
  }, [peerCursors]);

  // Global Keyboard Shortcuts (Ctrl+S / Cmd+S, Ctrl+Enter to Run)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeFileId) {
          saveFile(activeFileId);
        } else {
          saveAllDirtyFiles();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Scroll AI chat to bottom
  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiLoading]);

  // Find active file node in tree
  const findFileInTree = useCallback(
    (nodes: IFileNode[], targetId: string | null): IFileNode | null => {
      if (!targetId) return null;
      for (const n of nodes) {
        if (n.id === targetId) return n;
        if (n.children) {
          const found = findFileInTree(n.children, targetId);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  // Find file by path in tree
  const findFileByPath = useCallback(
    (nodes: IFileNode[], targetPath: string): IFileNode | null => {
      for (const n of nodes) {
        if (n.path === targetPath) return n;
        if (n.children) {
          const found = findFileByPath(n.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  const handleNavigateToFile = (filePath: string, line = 1) => {
    const file = findFileByPath(fileTree, filePath);
    if (file) {
      openFile(file);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.revealLineInCenter(line);
          editorRef.current.setPosition({ lineNumber: line, column: 1 });
          editorRef.current.focus();
        }
      }, 150);
    }
  };

  const activeFile = findFileInTree(fileTree, activeFileId);
  const activeContent = activeFileId ? fileContents[activeFileId] ?? activeFile?.content ?? '' : '';
  const activeLanguage = activeFile?.language || 'javascript';

  // Monaco Editor Mount
  const handleEditorMount: OnMount = (editor, _monaco) => {
    editorRef.current = editor;

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      const pos = {
        line: e.position.lineNumber,
        column: e.position.column,
      };
      setCursorPosition(pos);

      if (activeFileId) {
        broadcastCursor(activeFileId, pos, currentSelectionRef.current);
      }
    });

    // Track selection range
    editor.onDidChangeCursorSelection((e) => {
      const sel = {
        startLineNumber: e.selection.startLineNumber,
        startColumn: e.selection.startColumn,
        endLineNumber: e.selection.endLineNumber,
        endColumn: e.selection.endColumn,
      };
      currentSelectionRef.current = sel;

      if (activeFileId) {
        broadcastCursor(activeFileId, cursorPosition, sel);
      }
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeFileId && value !== undefined) {
      updateLocalContent(activeFileId, value);
      sendContentChange(activeFileId, value);
    }
  };

  const handleRunCode = async (overrideLang?: string) => {
    if (!activeContent.trim()) return;

    const targetLang = overrideLang || activeLanguage;
    const normalized = targetLang.toLowerCase();

    // C and C++ are default built-in core compilers
    if (normalized === 'c' || normalized === 'cpp') {
      await runCode(normalized, activeContent);
      return;
    }

    // For other languages, check if the required compiler extension is installed
    if (!isLanguageSupported(normalized)) {
      const ext = getExtensionForLanguage(normalized);
      setRequiredExtensionModal({
        isOpen: true,
        language: targetLang,
        extension: ext,
      });
      return;
    }

    let runnerLang = normalized;
    if (runnerLang === 'typescript' || runnerLang === 'ts') runnerLang = 'typescript';
    else if (runnerLang === 'python' || runnerLang === 'py') runnerLang = 'python';
    else if (runnerLang === 'go') runnerLang = 'go';
    else if (runnerLang === 'rust' || runnerLang === 'rs') runnerLang = 'rust';
    else if (runnerLang === 'java') runnerLang = 'java';
    else runnerLang = 'javascript';

    await runCode(runnerLang, activeContent);
  };

  const handleInstallAndRun = async () => {
    if (requiredExtensionModal.extension) {
      installExtension(requiredExtensionModal.extension.id);
    }
    const langToRun = requiredExtensionModal.language;
    setRequiredExtensionModal({ isOpen: false, language: '' });
    // Execute code immediately after installing extension
    setTimeout(() => {
      handleRunCode(langToRun);
    }, 100);
  };

  const handleSendAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    const userText = aiPrompt.trim();
    setAiPrompt('');

    // Get selected code if any
    let selectedText = '';
    if (editorRef.current && currentSelectionRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        selectedText = model.getValueInRange(currentSelectionRef.current);
      }
    }

    const currentFilePayload = activeFile
      ? {
          name: activeFile.name,
          path: activeFile.path,
          language: activeFile.language || activeLanguage,
          content: activeContent,
        }
      : null;

    await sendAiMessage(userText, currentFilePayload as any, selectedText || undefined);
  };

  const handleApplyCodeToEditor = (snippet: string, msgId: string) => {
    if (activeFileId && snippet) {
      updateLocalContent(activeFileId, snippet);
      setAppliedSnippetId(msgId);
      setTimeout(() => setAppliedSnippetId(null), 2000);
    }
  };

  const handleCopySnippet = (snippet: string, msgId: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippetId(msgId);
    setTimeout(() => setCopiedSnippetId(null), 1500);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white text-slate-900 overflow-hidden font-sans">
      {/* Workspace Header */}
      <WorkspaceHeader
        project={currentProject}
        activeFileId={activeFileId}
        onOpenInviteModal={() => setIsInviteOpen(true)}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        onOpenSnapshot={() => setIsSnapshotModalOpen(true)}
        onToggleAiPanel={() => {
          setIsRightPanelOpen(true);
          setActiveSideTab('ai');
        }}
        isAiPanelOpen={isRightPanelOpen && activeSideTab === 'ai'}
        onToggleExtensionsPanel={() => {
          setIsRightPanelOpen(true);
          setActiveSideTab('extensions');
        }}
        isExtensionsPanelOpen={isRightPanelOpen && activeSideTab === 'extensions'}
        onRunCode={() => handleRunCode()}
        isRunningCode={isRunning}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left File Explorer (w-64) */}
        <div className="w-56 sm:w-64 shrink-0 flex flex-col">
          {projectId && <FileTree projectId={projectId} />}
        </div>

        {/* Center Monaco Editor & Sandbox Terminal */}
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden border-r border-slate-200/80">
          {/* Editor Tabs Bar */}
          <EditorTabs files={fileTree} />

          {/* Monaco Editor Container */}
          <div className="flex-1 overflow-hidden relative">
            {activeFile ? (
              <Editor
                height="100%"
                language={activeLanguage}
                theme="vs"
                value={activeContent}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                options={{
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, Fira Code, monospace',
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 select-none">
                <FileCode2 className="h-10 w-10 text-slate-400 mb-2.5" />
                <h4 className="text-xs font-semibold text-slate-700">No file open</h4>
                <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
                  Select a file from the explorer to begin editing.
                </p>
              </div>
            )}
          </div>

          {/* Sandboxed Interactive Terminal & Console */}
          <WorkspaceTerminal onRunCode={handleRunCode} />
        </div>

        {/* Right Drawer Toggle Bar */}
        {!isRightPanelOpen && (
          <div className="w-10 border-l border-slate-200/80 bg-slate-50/80 flex flex-col items-center py-3 gap-2.5 shrink-0">
            <button
              onClick={() => {
                setIsRightPanelOpen(true);
                setActiveSideTab('ai');
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
              title="Open Gemini AI Assistant"
            >
              <Bot className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                setIsRightPanelOpen(true);
                setActiveSideTab('chat');
              }}
              className="relative p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
              title="Open Team Chat & Voice"
            >
              <MessageSquare className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
              )}
            </button>

            <button
              onClick={() => {
                setIsRightPanelOpen(true);
                setActiveSideTab('extensions');
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
              title="Language Compilers & Extensions (Default: C & C++)"
            >
              <Boxes className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Right Multi-Tab Communication Drawer */}
        {isRightPanelOpen && (
          <div className="w-80 flex flex-col bg-white border-l border-slate-200/80 shrink-0 overflow-hidden animate-in slide-in-from-right-10 duration-200">
            {/* Tab Header Selector */}
            <div className="h-10 px-3 border-b border-slate-200/80 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1 font-mono text-xs">
                <button
                  onClick={() => setActiveSideTab('ai')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                    activeSideTab === 'ai'
                      ? 'bg-white text-blue-700 font-semibold border border-slate-200 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Gemini AI</span>
                </button>

                <button
                  onClick={() => setActiveSideTab('chat')}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                    activeSideTab === 'chat'
                      ? 'bg-white text-blue-700 font-semibold border border-slate-200 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Chat</span>
                  {unreadCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-bold text-[9px]">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveSideTab('extensions')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                    activeSideTab === 'extensions'
                      ? 'bg-white text-blue-700 font-semibold border border-slate-200 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Language Compilers & Extensions"
                >
                  <Boxes className="h-3.5 w-3.5 text-blue-600" />
                  <span>Extensions</span>
                </button>
              </div>

              <button
                onClick={() => setIsRightPanelOpen(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-md transition-colors"
                title="Close side panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* AI Assistant View */}
            {activeSideTab === 'ai' && (
              <div className="flex-1 flex flex-col p-3 space-y-2.5 overflow-hidden">
                {/* Engine Status & AI Settings */}
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-mono shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-slate-700 font-semibold truncate text-[11px]">
                      {geminiApiKey ? 'Gemini 2.0 • Active' : 'CodeSync AI • Active'}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsApiKeyModalOpen(true)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] text-slate-600 hover:text-slate-900 transition-all shrink-0"
                    title="AI Engine Settings"
                  >
                    <Key className="h-3 w-3 text-blue-600" />
                    <span>Settings</span>
                  </button>
                </div>

                {/* AI Quick Action Chips */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono shrink-0">
                  <button
                    onClick={() => explainCode(activeContent, activeLanguage)}
                    disabled={isAiLoading || !activeContent}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50/40 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>Explain</span>
                  </button>

                  <button
                    onClick={() => refactorCode(activeContent, activeLanguage)}
                    disabled={isAiLoading || !activeContent}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50/40 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>Refactor</span>
                  </button>

                  <button
                    onClick={() =>
                      fixError(
                        activeContent,
                        'Runtime syntax or execution error in active file',
                        activeLanguage
                      )
                    }
                    disabled={isAiLoading || !activeContent}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50/40 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                  >
                    <Wrench className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span>Fix bugs</span>
                  </button>

                  <button
                    onClick={() => generateTests(activeContent, activeLanguage)}
                    disabled={isAiLoading || !activeContent}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50/40 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                  >
                    <FlaskConical className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Tests</span>
                  </button>
                </div>

                {/* AI Chat Stream & Message History */}
                <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 custom-scrollbar text-xs">
                  {aiMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl leading-relaxed space-y-2 font-sans ${
                        msg.sender === 'ai'
                          ? 'bg-white border border-slate-200 text-slate-800 shadow-xs'
                          : 'bg-blue-50 text-blue-900 border border-blue-200/80 ml-4 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="font-semibold flex items-center gap-1">
                          {msg.sender === 'ai' ? (
                            <>
                              <Bot className="h-3.5 w-3.5 text-blue-600" />{' '}
                              <span className="text-slate-700">{msg.model?.includes('gemini') ? 'Gemini 2.0' : 'CodeSync AI'}</span>
                            </>
                          ) : (
                            <span className="text-blue-700">👤 You</span>
                          )}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div className="whitespace-pre-wrap leading-relaxed text-xs">
                        {msg.text}
                      </div>

                      {/* Code Snippet Block with Apply, Run & Copy Actions */}
                      {msg.codeSnippet && (
                        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-900 p-2.5 space-y-2 font-mono text-[11px] text-slate-100">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                            <span className="text-blue-400 text-[10px]">
                              Generated Code
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleCopySnippet(msg.codeSnippet!, msg.id)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white text-[10px]"
                              >
                                {copiedSnippetId === msg.id ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                <span>{copiedSnippetId === msg.id ? 'Copied' : 'Copy'}</span>
                              </button>

                              <button
                                onClick={() => runCode(msg.language || activeLanguage, msg.codeSnippet!)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-medium transition-all"
                                title="Run this snippet in sandbox"
                              >
                                <Play className="h-3 w-3 fill-white" />
                                <span>Run</span>
                              </button>

                              {activeFileId && (
                                <button
                                  onClick={() =>
                                    handleApplyCodeToEditor(msg.codeSnippet!, msg.id)
                                  }
                                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-medium transition-all"
                                >
                                  {appliedSnippetId === msg.id ? (
                                    <CheckCheck className="h-3 w-3 text-emerald-300" />
                                  ) : (
                                    <Sparkles className="h-3 w-3" />
                                  )}
                                  <span>
                                    {appliedSnippetId === msg.id ? 'Applied!' : 'Apply to File'}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>

                          <pre className="overflow-x-auto text-slate-200 custom-scrollbar max-h-48 text-[10px]">
                            {msg.codeSnippet}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}

                  {isAiLoading && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                      <span>Thinking...</span>
                    </div>
                  )}

                  <div ref={aiMessagesEndRef} />
                </div>

                {/* AI Prompt Input Bar */}
                <form
                  onSubmit={handleSendAi}
                  className="flex items-center gap-1.5 pt-2 border-t border-slate-100"
                >
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ask AI a question or request code..."
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={!aiPrompt.trim() || isAiLoading}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={clearAiHistory}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Clear AI conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* Team Chat & Voice View */}
            {activeSideTab === 'chat' && projectId && (
              <WorkspaceChatPanel
                projectId={projectId}
                activeFile={activeFile}
                currentLine={cursorPosition.line}
                onNavigateToFile={handleNavigateToFile}
              />
            )}

            {/* Extensions & Compilers Marketplace View */}
            {activeSideTab === 'extensions' && (
              <ExtensionsPanel
                onClose={() => setIsRightPanelOpen(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* Workspace Footer Status Bar */}
      <WorkspaceFooter
        cursorPosition={cursorPosition}
        language={activeLanguage}
        onOpenExtensions={() => {
          setIsRightPanelOpen(true);
          setActiveSideTab('extensions');
        }}
      />

      {/* Extension Required On Execution Modal */}
      <ExtensionRequiredModal
        isOpen={requiredExtensionModal.isOpen}
        language={requiredExtensionModal.language}
        extension={requiredExtensionModal.extension}
        onClose={() => setRequiredExtensionModal({ isOpen: false, language: '' })}
        onInstallAndRun={handleInstallAndRun}
        onOpenExtensionsPanel={() => {
          setRequiredExtensionModal({ isOpen: false, language: '' });
          setIsRightPanelOpen(true);
          setActiveSideTab('extensions');
        }}
      />

      {/* Invite Collaborator Modal */}
      <ProjectMembersModal
        isOpen={isInviteOpen}
        project={currentProject}
        onClose={() => setIsInviteOpen(false)}
      />

      {/* Version History Drawer */}
      {projectId && (
        <VersionHistoryDrawer
          isOpen={isHistoryDrawerOpen}
          projectId={projectId}
          onClose={() => setIsHistoryDrawerOpen(false)}
          onOpenCreateSnapshot={() => {
            setIsHistoryDrawerOpen(false);
            setIsSnapshotModalOpen(true);
          }}
        />
      )}

      {/* Create Snapshot Modal */}
      {projectId && (
        <SnapshotModal
          isOpen={isSnapshotModalOpen}
          projectId={projectId}
          onClose={() => setIsSnapshotModalOpen(false)}
          onSuccess={() => setIsHistoryDrawerOpen(true)}
        />
      )}

      {/* Gemini API Key Configuration Modal */}
      <GeminiApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
};
