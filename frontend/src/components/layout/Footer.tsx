import React from 'react';
import { Code2, Github, Twitter, Disc as Discord } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 bg-white/60 py-10 text-slate-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Code2 className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold text-slate-900 tracking-tight">
              CodeSync <span className="text-blue-600">AI</span>
            </span>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
            <a href="/#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="/#collaboration" className="hover:text-slate-900 transition-colors">CRDT Sync</a>
            <a href="/#execution" className="hover:text-slate-900 transition-colors">Sandboxed Runtime</a>
            <a href="/#ai" className="hover:text-slate-900 transition-colors">AI Assistant</a>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noreferrer"
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Discord"
            >
              <Discord className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>© {new Date().getFullYear()} CodeSync AI. Real-time collaborative development.</p>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-slate-500">Systems normal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
