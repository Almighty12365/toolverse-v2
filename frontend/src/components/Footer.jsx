import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Github, Twitter, Linkedin } from 'lucide-react';
import { TOOL_CATEGORIES, TOOLS } from '../lib/tools';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-zinc-950 mt-24">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">Toolverse</span>
          </div>
          <p className="text-zinc-400 text-sm max-w-sm">A modern, blazing-fast suite of PDF, image and AI tools. No installs. Works in your browser.</p>
          <div className="flex items-center gap-3 mt-5">
            <a className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"><Twitter className="w-4 h-4"/></a>
            <a className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"><Github className="w-4 h-4"/></a>
            <a className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"><Linkedin className="w-4 h-4"/></a>
          </div>
        </div>

        {TOOL_CATEGORIES.slice(0,3).map(cat => (
          <div key={cat.id}>
            <div className="text-white text-sm font-medium mb-3">{cat.label}</div>
            <ul className="space-y-2">
              {TOOLS.filter(t=>t.category===cat.id).slice(0,5).map(t=>(
                <li key={t.id}><Link to={`/tool/${t.id}`} className="text-zinc-400 hover:text-white text-sm transition-colors">{t.name}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-zinc-500 text-xs">© {new Date().getFullYear()} Toolverse. All rights reserved.</p>
          <p className="text-zinc-500 text-xs">Crafted with care · v1.0</p>
        </div>
      </div>
    </footer>
  );
}
