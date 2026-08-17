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
    <div className="relative min-h-screen bg-background overflow-hidden">
      
      {/* Background Radial Atmosphere */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] radial-gold-glow pointer-events-none -z-10" />
      <div className="absolute top-[800px] -left-48 w-96 h-96 rounded-full bg-gold-500/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[1400px] -right-48 w-96 h-96 rounded-full bg-sky-500/5 blur-[120px] pointer-events-none -z-10" />

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Release Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-surface-200/80 px-3.5 py-1.5 text-xs font-medium text-gold-300 backdrop-blur-md mb-8 hover:border-gold-400/60 transition-all shadow-gold-sm">
            <span className="flex h-2 w-2 rounded-full bg-gold-400 animate-ping" />
            <span className="font-mono uppercase tracking-wider text-[11px]">CodeSync AI 1.0 Release</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">The Real-Time Collaborative Cloud IDE</span>
            <ArrowRight className="h-3.5 w-3.5 text-gold-400" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.15]">
            Code Together in Real Time.{' '}
            <span className="block mt-2 gold-gradient-text">
              Synchronize. Execute. Build.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            The next-generation cloud development platform that merges the power of <span className="text-white font-medium">Monaco Editor</span>, conflict-free <span className="text-gold-300 font-medium">CRDT synchronization</span>, in-project <span className="text-sky-300 font-medium">WebRTC voice</span>, and <span className="text-purple-300 font-medium">AI Pair Programming</span> into one unified workspace.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 bg-size-200 px-8 py-4 text-base font-semibold text-background shadow-gold-glow hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
            >
              <Zap className="h-5 w-5 fill-background" />
              <span>Launch Cloud Workspace</span>
            </Link>
            
            <a
              href="#workspace-preview"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl border border-surface-50 bg-surface-200/80 px-8 py-4 text-base font-medium text-slate-200 hover:text-white hover:border-gold-400/40 hover:bg-surface-100 transition-all backdrop-blur-sm"
            >
              <Play className="h-4 w-4 text-gold-400 fill-gold-400" />
              <span>Explore Interactive Mockup</span>
            </a>
          </div>

          {/* Highlights Row */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Sub-millisecond Yjs CRDT Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Sandboxed Docker Code Execution</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>P2P WebRTC Voice Rooms</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Google Gemini 2.0 AI Engine</span>
            </div>
          </div>

          {/* ================= WORKSPACE INTERACTIVE MOCKUP ================= */}
          <div id="workspace-preview" className="mt-16 sm:mt-20 relative mx-auto max-w-6xl rounded-2xl border border-gold-400/30 bg-surface-300/90 p-2 sm:p-3 shadow-2xl shadow-black/80 backdrop-blur-2xl">
            
            {/* Window Top Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-50/60 bg-surface-400/90 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <FileCode2 className="h-3.5 w-3.5 text-gold-400" />
                  CodeSyncAI / src / <strong className="text-slate-200">RealtimeWorkspace.tsx</strong>
                </span>
              </div>

              {/* Live Collaborators Online */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="relative h-6 w-6 rounded-full bg-amber-500 border border-background flex items-center justify-center text-[10px] font-bold text-black ring-1 ring-amber-400" title="Sarah (Online)">
                    S
                  </div>
                  <div className="relative h-6 w-6 rounded-full bg-sky-500 border border-background flex items-center justify-center text-[10px] font-bold text-black ring-1 ring-sky-400" title="Alex (Editing)">
                    A
                  </div>
                  <div className="relative h-6 w-6 rounded-full bg-emerald-500 border border-background flex items-center justify-center text-[10px] font-bold text-black ring-1 ring-emerald-400" title="Praveen (You)">
                    P
                  </div>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> 3 Live
                </span>
              </div>
            </div>

            {/* Workspace Main Body Simulation */}
            <div className="grid grid-cols-12 gap-0 text-left h-[440px] font-mono text-xs overflow-hidden bg-editor-bg rounded-b-xl border border-surface-50/40">
              
              {/* Left File Tree Panel (2 cols) */}
              <div className="hidden md:block md:col-span-3 border-r border-surface-50/60 bg-editor-sidebar p-3 space-y-1 overflow-y-auto">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <FolderTree className="h-3.5 w-3.5 text-gold-400" /> Explorer
                </div>
                <div className="text-slate-400 hover:text-slate-200 py-1 px-2 rounded hover:bg-surface-200/50 cursor-pointer flex items-center gap-2">
                  <span>📁</span> <span>src/components</span>
                </div>
                <div className="text-gold-300 bg-gold-400/10 border-l-2 border-gold-400 py-1 px-2 rounded-r flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileCode2 className="h-3.5 w-3.5 text-gold-400" /> RealtimeWorkspace.tsx
                  </span>
                  <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
                </div>
                <div className="text-slate-400 hover:text-slate-200 py-1 px-2 rounded hover:bg-surface-200/50 cursor-pointer flex items-center gap-1.5">
                  <FileCode2 className="h-3.5 w-3.5 text-sky-400" /> CollaborationEngine.ts
                </div>
                <div className="text-slate-400 hover:text-slate-200 py-1 px-2 rounded hover:bg-surface-200/50 cursor-pointer flex items-center gap-1.5">
                  <FileCode2 className="h-3.5 w-3.5 text-emerald-400" /> DockerSandbox.ts
                </div>
                <div className="text-slate-400 hover:text-slate-200 py-1 px-2 rounded hover:bg-surface-200/50 cursor-pointer flex items-center gap-1.5">
                  <FileCode2 className="h-3.5 w-3.5 text-purple-400" /> AIAssistantService.ts
                </div>
                <div className="text-slate-400 hover:text-slate-200 py-1 px-2 rounded hover:bg-surface-200/50 cursor-pointer flex items-center gap-1.5">
                  <FileCode2 className="h-3.5 w-3.5 text-slate-400" /> package.json
                </div>
              </div>

              {/* Center Code Editor Area (6 cols) */}
              <div className="col-span-12 md:col-span-6 flex flex-col bg-editor-bg border-r border-surface-50/60">
                {/* Editor Tabs */}
                <div className="flex items-center border-b border-surface-50/60 bg-editor-inactiveTab overflow-x-auto text-[11px]">
                  <div className="flex items-center gap-2 bg-editor-activeTab text-white px-3 py-1.5 border-t border-gold-400">
                    <FileCode2 className="h-3.5 w-3.5 text-gold-400" /> RealtimeWorkspace.tsx
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 px-3 py-1.5 hover:text-slate-200 cursor-pointer">
                    <FileCode2 className="h-3.5 w-3.5 text-sky-400" /> CollaborationEngine.ts
                  </div>
                </div>

                {/* Editor Code Canvas with Multi-User Cursors */}
                <div className="flex-1 p-4 text-[12px] leading-relaxed text-slate-300 overflow-y-auto select-none space-y-1 relative">
                  <div className="text-slate-500">// CodeSync AI: Zero-conflict CRDT synchronization</div>
                  <div><span className="text-purple-400">import</span> &#123; YDoc, MonacoBinding &#125; <span className="text-purple-400">from</span> <span className="text-emerald-300">'@codesync/crdt'</span>;</div>
                  <div><span className="text-purple-400">import</span> &#123; WebRTCVoiceRoom &#125; <span className="text-purple-400">from</span> <span className="text-emerald-300">'@codesync/voice'</span>;</div>
                  <br />
                  <div><span className="text-sky-400">export const</span> <span className="text-gold-300">initWorkspaceSession</span> = <span className="text-purple-400">async</span> (projectId) =&gt; &#123;</div>
                  <div className="pl-4">
                    <span className="text-slate-400">const</span> doc = <span className="text-purple-400">new</span> <span className="text-gold-300">YDoc</span>(&#123; projectId &#125;);
                  </div>
                  <div className="pl-4 relative">
                    <span className="text-slate-400">const</span> binding = <span className="text-purple-400">new</span> <span className="text-gold-300">MonacoBinding</span>(doc.getText(), editor);
                    
                    {/* Simulated Sarah Cursor */}
                    <span className="inline-block relative">
                      <span className="border-r-2 border-amber-400 animate-pulse ml-0.5 h-4 inline-block align-middle" />
                      <span className="absolute -top-5 -left-1 bg-amber-500 text-black text-[9px] font-sans font-bold px-1.5 py-0.5 rounded shadow-sm">
                        Sarah ✍️
                      </span>
                    </span>
                  </div>
                  <div className="pl-4">
                    <span className="text-slate-400">const</span> voice = <span className="text-purple-400">await</span> <span className="text-gold-300">WebRTCVoiceRoom</span>.join(projectId);
                  </div>
                  <div className="pl-4 relative">
                    <span className="text-emerald-400">console</span>.<span className="text-sky-300">log</span>(<span className="text-emerald-300">`🚀 Workspace synced: $&#123;projectId&#125;`</span>);
                    
                    {/* Simulated Alex Cursor */}
                    <span className="inline-block relative">
                      <span className="border-r-2 border-sky-400 animate-pulse ml-0.5 h-4 inline-block align-middle" />
                      <span className="absolute -top-5 -left-1 bg-sky-500 text-black text-[9px] font-sans font-bold px-1.5 py-0.5 rounded shadow-sm">
                        Alex ✍️
                      </span>
                    </span>
                  </div>
                  <div>&#125;;</div>
                </div>

                {/* Bottom Terminal Output */}
                <div className="h-28 border-t border-surface-50/60 bg-surface-400 p-2.5 font-mono text-[11px] overflow-hidden">
                  <div className="flex items-center justify-between text-slate-400 border-b border-surface-50/40 pb-1 mb-1.5">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <Terminal className="h-3 w-3" /> Terminal / Output
                    </span>
                    <span className="text-[10px] text-slate-500">Node v20.12.0 Sandbox (256MB Cap)</span>
                  </div>
                  <div className="text-slate-400">$ node dist/RealtimeWorkspace.js</div>
                  <div className="text-emerald-400">✔ CRDT Synchronization active (2 peers connected)</div>
                  <div className="text-sky-400">⚡ WebRTC Voice mesh initialized (latency: 18ms)</div>
                </div>
              </div>

              {/* Right AI Assistant & Voice Panel (3 cols) */}
              <div className="hidden md:flex md:col-span-3 flex-col bg-surface-300/80 p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-surface-50/60 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-purple-400" /> AI Assistant
                  </span>
                  <span className="text-[9px] bg-purple-950/60 text-purple-300 border border-purple-800/40 px-1.5 py-0.5 rounded">
                    Gemini 2.0
                  </span>
                </div>

                {/* Quick Action Chips */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <button className="rounded border border-surface-50 bg-surface-100/60 p-1 text-slate-300 hover:border-gold-400/40 hover:text-gold-300 text-center">
                    ⚡ Explain Code
                  </button>
                  <button className="rounded border border-surface-50 bg-surface-100/60 p-1 text-slate-300 hover:border-gold-400/40 hover:text-gold-300 text-center">
                    🛠️ Fix Bugs
                  </button>
                  <button className="rounded border border-surface-50 bg-surface-100/60 p-1 text-slate-300 hover:border-gold-400/40 hover:text-gold-300 text-center">
                    🚀 Optimize
                  </button>
                  <button className="rounded border border-surface-50 bg-surface-100/60 p-1 text-slate-300 hover:border-gold-400/40 hover:text-gold-300 text-center">
                    🧪 Generate Tests
                  </button>
                </div>

                {/* Simulated AI Suggestion Bubble */}
                <div className="rounded-lg border border-purple-500/20 bg-purple-950/20 p-2.5 text-[11px] text-slate-300 space-y-1.5">
                  <div className="text-purple-300 font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Code Optimization Found
                  </div>
                  <p className="text-slate-400 text-[10px] leading-normal">
                    Debounce awareness broadcasts by 50ms to optimize WebSocket throughput.
                  </p>
                  <button className="w-full rounded bg-purple-600/80 hover:bg-purple-600 text-white font-sans text-[10px] py-1 font-semibold transition-colors">
                    Apply Diff (1-Click)
                  </button>
                </div>

                {/* Voice Room Status */}
                <div className="mt-auto rounded-lg border border-surface-50/80 bg-surface-400 p-2 text-[10px] space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1 text-slate-200 font-semibold">
                      <Mic className="h-3 w-3 text-emerald-400" /> Team Voice
                    </span>
                    <span className="text-[9px] text-emerald-400">Connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-slate-300">Alex is speaking...</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ================= CORE FEATURES GRID ================= */}
      <section id="features" className="py-24 border-t border-surface-50/50 bg-background-subtle relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-mono tracking-widest text-gold-400 font-semibold">
              Engineered For Excellence
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything Your Engineering Team Needs in One Place
            </p>
            <p className="mt-4 text-base text-slate-400">
              No switching between editor, terminal, Discord, and AI chat. CodeSync AI brings full development lifecycle tooling under one roof.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1: Monaco Core */}
            <div className="glass-card rounded-2xl p-8 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-surface-200 border border-gold-400/30 flex items-center justify-center text-gold-400">
                <Code2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Monaco Code Editor</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                The exact editing engine powering VS Code. Full multi-language syntax highlighting, IntelliSense, keyboard shortcuts, tabs, and mini-map.
              </p>
            </div>

            {/* Feature 2: Yjs CRDT Collaboration */}
            <div className="glass-card rounded-2xl p-8 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-surface-200 border border-sky-400/30 flex items-center justify-center text-sky-400">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Real-Time CRDT Sync</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Sub-millisecond conflict-free synchronized editing powered by Yjs. Multi-user cursor tracking, active text selections, and automatic offline recovery.
              </p>
            </div>

            {/* Feature 3: Docker Sandbox Execution */}
            <div className="glass-card rounded-2xl p-8 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-surface-200 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Terminal className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Sandboxed Code Execution</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Execute JavaScript, TypeScript, Python, C++, and Java safely inside isolated Docker containers with CPU/memory limits and terminal output streaming.
              </p>
            </div>

            {/* Feature 4: WebRTC Voice & Chat */}
            <div className="glass-card rounded-2xl p-8 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-surface-200 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Mic className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">WebRTC Voice & Chat</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Low-latency peer-to-peer audio channels and instant project chat. Discuss bugs, conduct pair-programming reviews, and talk without external apps.
              </p>
            </div>

            {/* Feature 5: AI Pair Programmer */}
            <div className="glass-card rounded-2xl p-8 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-surface-200 border border-purple-400/30 flex items-center justify-center text-purple-400">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">AI Pair Programmer</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Integrated Google Gemini 2.0 assistant. Explain complex code, fix bugs, generate unit tests, and review proposed diffs with 1-click apply.
              </p>
            </div>

            {/* Feature 6: Version History & Snapshots */}
            <div className="glass-card rounded-2xl p-8 space-y-4">
              <div className="h-12 w-12 rounded-xl bg-surface-200 border border-rose-400/30 flex items-center justify-center text-rose-400">
                <GitBranch className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Version History & Git</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
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
            <h2 className="text-xs uppercase font-mono tracking-widest text-gold-400 font-semibold">
              Seamless Workflow
            </h2>
            <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              From Concept to Execution in Seconds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="relative glass-card rounded-xl p-6 space-y-3">
              <div className="text-2xl font-mono font-bold text-gold-400">01</div>
              <h4 className="text-lg font-bold text-white">Create Project</h4>
              <p className="text-xs text-slate-400">
                Instantly spin up a project with customizable boilerplate templates across supported languages.
              </p>
            </div>

            <div className="relative glass-card rounded-xl p-6 space-y-3">
              <div className="text-2xl font-mono font-bold text-sky-400">02</div>
              <h4 className="text-lg font-bold text-white">Invite Collaborators</h4>
              <p className="text-xs text-slate-400">
                Share your secure project link or invite team members with granular Owner, Editor, or Viewer roles.
              </p>
            </div>

            <div className="relative glass-card rounded-xl p-6 space-y-3">
              <div className="text-2xl font-mono font-bold text-purple-400">03</div>
              <h4 className="text-lg font-bold text-white">Edit & Communicate</h4>
              <p className="text-xs text-slate-400">
                Write code concurrently with live cursors, discuss implementation via voice room and persistent chat.
              </p>
            </div>

            <div className="relative glass-card rounded-xl p-6 space-y-3">
              <div className="text-2xl font-mono font-bold text-emerald-400">04</div>
              <h4 className="text-lg font-bold text-white">Run & Optimize with AI</h4>
              <p className="text-xs text-slate-400">
                Execute code in isolated sandboxes, view terminal output, and ask AI for instant refactoring.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ================= FINAL CTA BANNER ================= */}
      <section className="py-20 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl border border-gold-400/40 bg-gradient-to-br from-surface-300 via-surface-200 to-background p-10 sm:p-16 text-center shadow-gold-glow overflow-hidden">
            
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto">
              Ready to Upgrade Your Collaborative Coding Experience?
            </h2>
            
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
              Join thousands of developers building faster, smarter, and together with CodeSync AI.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 px-8 py-4 text-base font-semibold text-background shadow-lg hover:scale-105 transition-all"
              >
                <Zap className="h-5 w-5 fill-background" />
                <span>Create Free Account</span>
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-surface-50 bg-surface-100/80 px-8 py-4 text-base font-medium text-slate-200 hover:text-white transition-all"
              >
                <span>Sign In to Existing Project</span>
              </Link>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};
