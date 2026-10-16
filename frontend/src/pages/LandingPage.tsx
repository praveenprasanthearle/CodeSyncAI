import React from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  Users,
  Sparkles,
  Terminal,
  Cpu,
  Zap,
  GitBranch,
  Mic,
  Play,
  ArrowRight,
  CheckCircle2,
  FileCode2,
  FolderTree,
  Bot
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-slate-50 light-ambient-bg text-slate-900 overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(59,130,246,0.1),transparent)]" />
      <div className="absolute top-[800px] -left-48 w-96 h-96 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[1400px] -right-48 w-96 h-96 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none -z-10" />

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-10 pb-16 lg:pt-16 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Release Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-xs font-medium text-blue-700 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            <span className="font-mono text-[11px]">v1.0</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">Collaborative Cloud IDE</span>
            <ArrowRight className="h-3 w-3 text-blue-600" />
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Code together in real time.{' '}
            <span className="block text-blue-600">
              Sync, execute, and build with AI.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A collaborative cloud development platform with Monaco editor, conflict-free CRDT synchronization, integrated WebRTC voice, and AI pair programming.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-colors"
            >
              <Zap className="h-4 w-4" />
              <span>Get started</span>
            </Link>
            
            <a
              href="#workspace-preview"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Play className="h-3.5 w-3.5 text-blue-600 fill-blue-600" />
              <span>Interactive preview</span>
            </a>
          </div>

          {/* Highlights Row */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Yjs CRDT sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Sandboxed runtime</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>WebRTC voice rooms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Gemini 2.0 AI</span>
            </div>
          </div>

          {/* ================= WORKSPACE INTERACTIVE MOCKUP ================= */}
          <div id="workspace-preview" className="mt-16 sm:mt-20 relative mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-2 sm:p-3 shadow-glass-dropdown backdrop-blur-2xl">
            
            {/* Window Top Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50/80 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs font-mono text-slate-500 flex items-center gap-1.5">
                  <FileCode2 className="h-3.5 w-3.5 text-blue-600" />
                  CodeSyncAI / src / <strong className="text-slate-800">RealtimeWorkspace.tsx</strong>
                </span>
              </div>

              {/* Live Collaborators Online */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="relative h-6 w-6 rounded-full bg-amber-500 border border-white flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-amber-400 shadow-xs" title="Sarah (Online)">
                    S
                  </div>
                  <div className="relative h-6 w-6 rounded-full bg-blue-500 border border-white flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-blue-400 shadow-xs" title="Alex (Editing)">
                    A
                  </div>
                  <div className="relative h-6 w-6 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-emerald-400 shadow-xs" title="Praveen (You)">
                    P
                  </div>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> 3 Live
                </span>
              </div>
            </div>

            {/* Workspace Main Body Simulation */}
            <div className="grid grid-cols-12 gap-0 text-left h-[440px] font-mono text-xs overflow-hidden bg-white rounded-b-xl border border-slate-200">
              
              {/* Left File Tree Panel (2 cols) */}
              <div className="hidden md:block md:col-span-3 border-r border-slate-200 bg-slate-50/70 p-3 space-y-1 overflow-y-auto">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <FolderTree className="h-3.5 w-3.5 text-blue-600" /> Explorer
                </div>
                <div className="text-slate-600 hover:text-slate-900 py-1 px-2 rounded hover:bg-slate-100 cursor-pointer flex items-center gap-2">
                  <span>📁</span> <span>src/components</span>
                </div>
                <div className="text-blue-700 bg-blue-50 border-l-2 border-blue-600 py-1 px-2 rounded-r flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5">
                    <FileCode2 className="h-3.5 w-3.5 text-blue-600" /> RealtimeWorkspace.tsx
                  </span>
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                </div>
                <div className="text-slate-600 hover:text-slate-900 py-1 px-2 rounded hover:bg-slate-100 cursor-pointer flex items-center gap-1.5">
                  <FileCode2 className="h-3.5 w-3.5 text-slate-500" /> CollaborationEngine.ts
                </div>
                <div className="text-slate-600 hover:text-slate-900 py-1 px-2 rounded hover:bg-slate-100 cursor-pointer flex items-center gap-1.5">
                  <FileCode2 className="h-3.5 w-3.5 text-slate-500" /> DockerSandbox.ts
                </div>
                <div className="text-slate-600 hover:text-slate-900 py-1 px-2 rounded hover:bg-slate-100 cursor-pointer flex items-center gap-1.5">
                  <FileCode2 className="h-3.5 w-3.5 text-slate-500" /> AIAssistantService.ts
                </div>
                <div className="text-slate-600 hover:text-slate-900 py-1 px-2 rounded hover:bg-slate-100 cursor-pointer flex items-center gap-1.5">
                  <FileCode2 className="h-3.5 w-3.5 text-slate-400" /> package.json
                </div>
              </div>

              {/* Center Code Editor Area (6 cols) */}
              <div className="col-span-12 md:col-span-6 flex flex-col bg-white border-r border-slate-200">
                {/* Editor Tabs */}
                <div className="flex items-center border-b border-slate-200 bg-slate-50/80 overflow-x-auto text-[11px]">
                  <div className="flex items-center gap-2 bg-white text-slate-900 px-3 py-1.5 border-t-2 border-t-blue-600 font-semibold shadow-xs">
                    <FileCode2 className="h-3.5 w-3.5 text-blue-600" /> RealtimeWorkspace.tsx
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 px-3 py-1.5 hover:text-slate-800 cursor-pointer">
                    <FileCode2 className="h-3.5 w-3.5 text-slate-400" /> CollaborationEngine.ts
                  </div>
                </div>

                {/* Editor Code Canvas with Multi-User Cursors */}
                <div className="flex-1 p-4 text-[12px] leading-relaxed text-slate-800 bg-white overflow-y-auto select-none space-y-1 relative">
                  <div className="text-slate-400">// CodeSync AI: Zero-conflict CRDT synchronization</div>
                  <div><span className="text-purple-600 font-medium">import</span> &#123; YDoc, MonacoBinding &#125; <span className="text-purple-600 font-medium">from</span> <span className="text-emerald-600">'@codesync/crdt'</span>;</div>
                  <div><span className="text-purple-600 font-medium">import</span> &#123; WebRTCVoiceRoom &#125; <span className="text-purple-600 font-medium">from</span> <span className="text-emerald-600">'@codesync/voice'</span>;</div>
                  <br />
                  <div><span className="text-blue-600 font-medium">export const</span> <span className="text-indigo-600 font-semibold">initWorkspaceSession</span> = <span className="text-purple-600 font-medium">async</span> (projectId) =&gt; &#123;</div>
                  <div className="pl-4">
                    <span className="text-slate-500">const</span> doc = <span className="text-purple-600 font-medium">new</span> <span className="text-indigo-600 font-medium">YDoc</span>(&#123; projectId &#125;);
                  </div>
                  <div className="pl-4 relative">
                    <span className="text-slate-500">const</span> binding = <span className="text-purple-600 font-medium">new</span> <span className="text-indigo-600 font-medium">MonacoBinding</span>(doc.getText(), editor);
                    
                    {/* Simulated Sarah Cursor */}
                    <span className="inline-block relative">
                      <span className="border-r-2 border-amber-500 animate-pulse ml-0.5 h-4 inline-block align-middle" />
                      <span className="absolute -top-5 -left-1 bg-amber-500 text-white text-[9px] font-sans font-bold px-1.5 py-0.5 rounded shadow-xs">
                        Sarah ✍️
                      </span>
                    </span>
                  </div>
                  <div className="pl-4">
                    <span className="text-slate-500">const</span> voice = <span className="text-purple-600 font-medium">await</span> <span className="text-indigo-600 font-medium">WebRTCVoiceRoom</span>.join(projectId);
                  </div>
                  <div className="pl-4 relative">
                    <span className="text-emerald-600">console</span>.<span className="text-blue-600">log</span>(<span className="text-emerald-600">`🚀 Workspace synced: $&#123;projectId&#125;`</span>);
                    
                    {/* Simulated Alex Cursor */}
                    <span className="inline-block relative">
                      <span className="border-r-2 border-blue-600 animate-pulse ml-0.5 h-4 inline-block align-middle" />
                      <span className="absolute -top-5 -left-1 bg-blue-600 text-white text-[9px] font-sans font-bold px-1.5 py-0.5 rounded shadow-xs">
                        Alex ✍️
                      </span>
                    </span>
                  </div>
                  <div>&#125;;</div>
                </div>

                {/* Bottom Terminal Output */}
                <div className="h-28 border-t border-slate-200 bg-slate-900 p-2.5 font-mono text-[11px] overflow-hidden text-slate-100">
                  <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1 mb-1.5">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <Terminal className="h-3 w-3" /> Terminal / Output
                    </span>
                    <span className="text-[10px] text-slate-400">Node v20.12.0 Sandbox (256MB Cap)</span>
                  </div>
                  <div className="text-slate-400">$ node dist/RealtimeWorkspace.js</div>
                  <div className="text-emerald-400">✔ CRDT Synchronization active (2 peers connected)</div>
                  <div className="text-sky-400">⚡ WebRTC Voice mesh initialized (latency: 18ms)</div>
                </div>
              </div>

              {/* Right AI Assistant & Voice Panel (3 cols) */}
              <div className="hidden md:flex md:col-span-3 flex-col bg-slate-50/70 p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-blue-600" /> AI Assistant
                  </span>
                  <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                    Gemini 2.0
                  </span>
                </div>

                {/* Quick Action Chips */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <button className="rounded border border-slate-200 bg-white p-1 text-slate-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50/50 text-center shadow-xs">
                    ⚡ Explain Code
                  </button>
                  <button className="rounded border border-slate-200 bg-white p-1 text-slate-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50/50 text-center shadow-xs">
                    🛠️ Fix Bugs
                  </button>
                  <button className="rounded border border-slate-200 bg-white p-1 text-slate-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50/50 text-center shadow-xs">
                    🚀 Optimize
                  </button>
                  <button className="rounded border border-slate-200 bg-white p-1 text-slate-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50/50 text-center shadow-xs">
                    🧪 Generate Tests
                  </button>
                </div>

                {/* Simulated AI Suggestion Bubble */}
                <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] text-slate-700 space-y-1.5 shadow-xs">
                  <div className="text-blue-700 font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Code Optimization Found
                  </div>
                  <p className="text-slate-500 text-[10px] leading-normal">
                    Debounce awareness broadcasts by 50ms to optimize WebSocket throughput.
                  </p>
                  <button className="w-full rounded bg-slate-900 hover:bg-slate-800 text-white font-sans text-[10px] py-1 font-medium transition-colors shadow-xs">
                    Apply Diff (1-Click)
                  </button>
                </div>

                {/* Voice Room Status */}
                <div className="mt-auto rounded-lg border border-slate-200 bg-white p-2 text-[10px] space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center gap-1 text-slate-800 font-semibold">
                      <Mic className="h-3 w-3 text-emerald-600" /> Team Voice
                    </span>
                    <span className="text-[9px] text-emerald-600 font-medium">Connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Alex is speaking...</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ================= CORE FEATURES GRID ================= */}
      <section id="features" className="py-24 border-t border-slate-200 bg-slate-100/60 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-mono tracking-widest text-blue-600 font-semibold">
              Engineered For Excellence
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything Your Engineering Team Needs in One Place
            </p>
            <p className="mt-4 text-base text-slate-600">
              No switching between editor, terminal, Discord, and AI chat. CodeSync AI brings full development lifecycle tooling under one roof.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1: Monaco Core */}
            <div className="glass-card rounded-2xl p-8 space-y-4 border border-slate-200/80 bg-white hover:border-slate-300 shadow-xs hover:shadow-glass-hover transition-all">
              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Code2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Monaco Code Editor</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The exact editing engine powering VS Code. Full multi-language syntax highlighting, IntelliSense, keyboard shortcuts, tabs, and mini-map.
              </p>
            </div>

            {/* Feature 2: Yjs CRDT Collaboration */}
            <div className="glass-card rounded-2xl p-8 space-y-4 border border-slate-200/80 bg-white hover:border-slate-300 shadow-xs hover:shadow-glass-hover transition-all">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Real-Time CRDT Sync</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sub-millisecond conflict-free synchronized editing powered by Yjs. Multi-user cursor tracking, active text selections, and automatic offline recovery.
              </p>
            </div>

            {/* Feature 3: Docker Sandbox Execution */}
            <div className="glass-card rounded-2xl p-8 space-y-4 border border-slate-200/80 bg-white hover:border-slate-300 shadow-xs hover:shadow-glass-hover transition-all">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Terminal className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Sandboxed Code Execution</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Execute JavaScript, TypeScript, Python, C++, and Java safely inside isolated Docker containers with CPU/memory limits and terminal output streaming.
              </p>
            </div>

            {/* Feature 4: WebRTC Voice & Chat */}
            <div className="glass-card rounded-2xl p-8 space-y-4 border border-slate-200/80 bg-white hover:border-slate-300 shadow-xs hover:shadow-glass-hover transition-all">
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Mic className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">WebRTC Voice & Chat</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Low-latency peer-to-peer audio channels and instant project chat. Discuss bugs, conduct pair-programming reviews, and talk without external apps.
              </p>
            </div>

            {/* Feature 5: AI Pair Programmer */}
            <div className="glass-card rounded-2xl p-8 space-y-4 border border-slate-200/80 bg-white hover:border-slate-300 shadow-xs hover:shadow-glass-hover transition-all">
              <div className="h-12 w-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">AI Pair Programmer</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Integrated Google Gemini 2.0 assistant. Explain complex code, fix bugs, generate unit tests, and review proposed diffs with 1-click apply.
              </p>
            </div>

            {/* Feature 6: Version History & Snapshots */}
            <div className="glass-card rounded-2xl p-8 space-y-4 border border-slate-200/80 bg-white hover:border-slate-300 shadow-xs hover:shadow-glass-hover transition-all">
              <div className="h-12 w-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <GitBranch className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Version History & Git</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automated snapshot creation with visual side-by-side diff viewers. Inspect historical edits, review contributor modifications, and rollback instantly.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section id="collaboration" className="py-24 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-mono tracking-widest text-blue-600 font-semibold">
              Seamless Workflow
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              From Concept to Execution in Seconds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="relative glass-card rounded-xl p-6 space-y-3 border border-slate-200/80 bg-white shadow-xs">
              <div className="text-2xl font-mono font-bold text-blue-600">01</div>
              <h4 className="text-lg font-bold text-slate-900">Create Project</h4>
              <p className="text-xs text-slate-600">
                Instantly spin up a project with customizable boilerplate templates across supported languages.
              </p>
            </div>

            <div className="relative glass-card rounded-xl p-6 space-y-3 border border-slate-200/80 bg-white shadow-xs">
              <div className="text-2xl font-mono font-bold text-indigo-600">02</div>
              <h4 className="text-lg font-bold text-slate-900">Invite Collaborators</h4>
              <p className="text-xs text-slate-600">
                Share your secure project link or invite team members with granular Owner, Editor, or Viewer roles.
              </p>
            </div>

            <div className="relative glass-card rounded-xl p-6 space-y-3 border border-slate-200/80 bg-white shadow-xs">
              <div className="text-2xl font-mono font-bold text-purple-600">03</div>
              <h4 className="text-lg font-bold text-slate-900">Edit & Communicate</h4>
              <p className="text-xs text-slate-600">
                Write code concurrently with live cursors, discuss implementation via voice room and persistent chat.
              </p>
            </div>

            <div className="relative glass-card rounded-xl p-6 space-y-3 border border-slate-200/80 bg-white shadow-xs">
              <div className="text-2xl font-mono font-bold text-emerald-600">04</div>
              <h4 className="text-lg font-bold text-slate-900">Run & Optimize with AI</h4>
              <p className="text-xs text-slate-600">
                Execute code in isolated sandboxes, view terminal output, and ask AI for instant refactoring.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ================= FINAL CTA BANNER ================= */}
      <section className="py-20 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 sm:p-16 text-center text-white shadow-xl overflow-hidden">
            
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight max-w-2xl mx-auto">
              Ready to code together?
            </h2>
            
            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Start collaborating in real time with synchronized editing, voice rooms, and AI.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-white text-slate-900 hover:bg-slate-100 px-5 py-2.5 text-sm font-medium transition-colors"
              >
                <Zap className="h-4 w-4 fill-slate-900 text-slate-900" />
                <span>Create free account</span>
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <span>Sign in</span>
              </Link>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};
