import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';
import { TOOLS, TOOL_CATEGORIES } from '../lib/tools';
import { Button } from './ui/button';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState(false);
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/70 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-fuchsia-500/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white font-semibold text-lg tracking-tight">Toolverse</span>
            <span className="text-[10px] text-zinc-500">PDF & AI tools</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          <div className="relative" onMouseEnter={()=>setDrop(true)} onMouseLeave={()=>setDrop(false)}>
            <button className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors">All Tools</button>
            {drop && (
              <div className="absolute top-full left-0 w-[680px] max-h-[80vh] overflow-y-auto bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 grid grid-cols-2 gap-2">
                {TOOL_CATEGORIES.map(cat => (
                  <div key={cat.id}>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2 px-2">{cat.label}</div>
                    {TOOLS.filter(t=>t.category===cat.id).map(t=>(
                      <button key={t.id} onClick={()=>{nav(`/tool/${t.id}`); setDrop(false);}} className="w-full text-left px-2 py-1.5 rounded-md text-sm text-zinc-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors">
                        <t.icon className="w-3.5 h-3.5 text-zinc-500" />{t.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link to="/?cat=ai" className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors">AI Tools</Link>
          <Link to="/?cat=image" className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors">Image</Link>
          <Link to="/pricing" className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors">Pricing</Link>
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-white/5">Sign in</Button>
          <Button className="bg-white text-zinc-900 hover:bg-zinc-100 font-medium">Get started</Button>
        </div>

        <button className="lg:hidden text-white" onClick={()=>setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 bg-zinc-950 px-5 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
          {TOOLS.map(t => (
            <button key={t.id} onClick={()=>{nav(`/tool/${t.id}`); setOpen(false);}} className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-zinc-300 hover:bg-white/5">
              <t.icon className="w-4 h-4" />{t.name}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
