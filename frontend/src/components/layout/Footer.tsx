import React from 'react';
import { Code2, Github, Twitter, Disc as Discord, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-surface-50/60 bg-background-subtle py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-200 border border-gold-400/40">
                <Code2 className="h-4 w-4 text-gold-300" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                CodeSync <span className="gold-gradient-text">AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              The next-generation collaborative cloud development environment for high-velocity engineering teams.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-400/90 font-medium">All Cloud Systems Operational</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-200 mb-4 font-semibold">
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-gold-300 transition-colors">Monaco Cloud Editor</a></li>
              <li><a href="#collaboration" className="hover:text-gold-300 transition-colors">CRDT Real-Time Sync</a></li>
              <li><a href="#execution" className="hover:text-gold-300 transition-colors">Docker Sandbox Runtime</a></li>
              <li><a href="#ai" className="hover:text-gold-300 transition-colors">AI Pair Programmer</a></li>
              <li><a href="#collaboration" className="hover:text-gold-300 transition-colors">WebRTC Team Voice</a></li>
            </ul>
          </div>

          {/* Architecture & Tech */}
          <div>
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-200 mb-4 font-semibold">
              Technologies
            </h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-slate-200 transition-colors">React 18 + Vite + TypeScript</span></li>
              <li><span className="hover:text-slate-200 transition-colors">Yjs CRDT Synchronization</span></li>
              <li><span className="hover:text-slate-200 transition-colors">Monaco Editor (VS Code Engine)</span></li>
              <li><span className="hover:text-slate-200 transition-colors">Socket.IO & WebRTC Mesh</span></li>
              <li><span className="hover:text-slate-200 transition-colors">Google Gemini AI Engine</span></li>
            </ul>
          </div>

          {/* Community & Open Source */}
          <div>
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-200 mb-4 font-semibold">
              Connect
            </h4>
            <div className="flex items-center gap-3 mb-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-surface-50 bg-surface-200 text-slate-300 hover:text-white hover:border-gold-400/50 transition-all"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-surface-50 bg-surface-200 text-slate-300 hover:text-white hover:border-gold-400/50 transition-all"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-surface-50 bg-surface-200 text-slate-300 hover:text-white hover:border-gold-400/50 transition-all"
              >
                <Discord className="h-4 w-4" />
              </a>
            </div>
            <p className="text-xs text-slate-500">
              Designed & engineered for modern collaborative development.
            </p>
          </div>

        </div>

        <div className="border-t border-surface-50/40 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CodeSync AI. Built with precision for developers worldwide.</p>
          <p className="flex items-center gap-1.5">
            Engineered with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> by individual developer
          </p>
        </div>
      </div>
    </footer>
  );
};
