import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ToolCard from '../components/ToolCard';
import { TOOLS, TOOL_CATEGORIES } from '../lib/tools';
import { Sparkles, ArrowRight, Zap, Shield, Wand2, Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function Home() {
  const [params] = useSearchParams();
  const initialCat = params.get('cat') || 'all';
  const [cat, setCat] = useState(initialCat);
  const [q, setQ] = useState('');
  const nav = useNavigate();

  const filtered = useMemo(() => {
    return TOOLS.filter(t => (cat==='all' || t.category===cat) && (t.name.toLowerCase().includes(q.toLowerCase()) || t.desc.toLowerCase().includes(q.toLowerCase())));
  }, [cat, q]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-fuchsia-600/20 blur-[120px]" />
          <div className="absolute top-20 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(9,9,11,0.6)_60%,_rgb(9,9,11)_100%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
            <span className="text-xs text-zinc-300">Now with AI Summarize & Chat with PDF</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-white leading-[1.05]">
            Every PDF tool, <span className="bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">reimagined.</span>
          </h1>
          <p className="mt-6 text-zinc-400 text-lg max-w-2xl mx-auto">Merge, split, compress, convert, edit and unlock PDFs — plus AI superpowers. All in one beautifully fast workspace.</p>

          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search a tool e.g. merge, compress, watermark..." className="pl-11 h-12 bg-zinc-900/80 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-fuchsia-500" />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button onClick={()=>setCat('all')} className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${cat==='all' ? 'bg-white text-zinc-900 border-white' : 'border-white/10 text-zinc-300 hover:bg-white/5'}`}>All</button>
            {TOOL_CATEGORIES.map(c => (
              <button key={c.id} onClick={()=>setCat(c.id)} className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${cat===c.id ? 'bg-white text-zinc-900 border-white' : 'border-white/10 text-zinc-300 hover:bg-white/5'}`}>{c.label}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(t => <ToolCard key={t.id} tool={t} />)}
        </div>
        {filtered.length === 0 && <p className="text-zinc-500 text-center py-16">No tools match your search.</p>}
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {icon:Zap, title:'Lightning fast', text:'Native processing in milliseconds. No queues, no waiting.', grad:'from-amber-400 to-rose-500'},
          {icon:Shield, title:'Private by design', text:'Files are processed and never stored. Your data stays yours.', grad:'from-emerald-400 to-cyan-500'},
          {icon:Wand2, title:'AI built-in', text:'Summarize and chat with any PDF using state-of-the-art models.', grad:'from-fuchsia-500 to-indigo-500'},
        ].map((f, i)=>(
          <div key={i} className="relative overflow-hidden rounded-2xl bg-zinc-900/60 border border-white/5 p-6">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.grad} flex items-center justify-center mb-4`}>
              <f.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-medium">{f.title}</h3>
            <p className="text-zinc-400 text-sm mt-1.5">{f.text}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-600/20 via-violet-600/10 to-cyan-500/20 border border-white/10 p-10 md:p-16 text-center">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,_rgba(217,70,239,0.25),_transparent_60%)]" />
          <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight">Ready to upgrade your PDF workflow?</h2>
          <p className="text-zinc-300 mt-3 max-w-xl mx-auto">Pick a tool and ship in seconds. No sign-up needed for the basics.</p>
          <Button onClick={()=>nav('/tool/merge')} className="mt-6 bg-white text-zinc-900 hover:bg-zinc-100 h-11 px-6">
            Try Merge PDF <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
