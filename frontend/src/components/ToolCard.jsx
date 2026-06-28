import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function ToolCard({ tool }) {
  const nav = useNavigate();
  const Icon = tool.icon;
  return (
    <button
      onClick={() => nav(`/tool/${tool.id}`)}
      className="group relative text-left bg-zinc-900/60 border border-white/5 hover:border-white/15 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-fuchsia-500/5 overflow-hidden"
    >
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${tool.color} opacity-10 group-hover:opacity-25 blur-2xl transition-opacity`} />
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 shadow-lg shadow-black/40`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium text-[15px]">{tool.name}</h3>
        <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:rotate-12 transition-all" />
      </div>
      <p className="text-zinc-400 text-sm mt-1.5 leading-relaxed">{tool.desc}</p>
    </button>
  );
}
