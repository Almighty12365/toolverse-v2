import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';


const tiers = [
  { name: 'Free', price: '$0', period: '/forever', desc: 'Everything to get started.', features: ['All basic PDF tools', 'Image utilities', 'QR generator', 'Files up to 25 MB'], cta: 'Start free', highlighted: false },
  { name: 'Pro', price: '$6', period: '/month', desc: 'For power users & creators.', features: ['Everything in Free', 'AI Summarize & Chat-with-PDF', 'Batch processing', 'Files up to 200 MB', 'Priority queue'], cta: 'Go Pro', highlighted: true },
  { name: 'Team', price: '$19', period: '/month', desc: 'For teams that ship together.', features: ['Everything in Pro', '5 team seats', 'Shared workspace', 'Audit log', 'Priority support'], cta: 'Start team', highlighted: false },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <section className="max-w-6xl mx-auto px-5 lg:px-8 pt-16 pb-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
            <span className="text-xs text-zinc-300">Simple, transparent pricing</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">Pick the plan that fits.</h1>
          <p className="text-zinc-400 mt-3">Free forever. Upgrade for AI and pro features.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tiers.map(t => (
            <div key={t.name} className={`relative rounded-3xl p-7 border ${t.highlighted ? 'bg-gradient-to-br from-fuchsia-500/15 via-violet-500/10 to-cyan-500/15 border-fuchsia-400/30' : 'bg-zinc-900/60 border-white/5'}`}>
              {t.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-white text-zinc-900 font-medium">Most popular</span>
              )}
              <h3 className="text-white text-lg font-medium">{t.name}</h3>
              <p className="text-zinc-400 text-sm mt-1">{t.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-semibold text-white">{t.price}</span>
                <span className="text-zinc-500 text-sm">{t.period}</span>
              </div>
              <ul className="mt-6 space-y-2.5">
                {t.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button className={`mt-7 w-full ${t.highlighted ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-white/10 text-white hover:bg-white/20'}`}>{t.cta}</Button>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
