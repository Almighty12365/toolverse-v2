import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { findTool } from '../lib/tools';
import { ArrowLeft } from 'lucide-react';
import GenericServerTool from '../components/GenericServerTool';
import ClientToolRunner from '../components/ClientToolRunner';

export default function ToolPage() {
  const { id } = useParams();
  const tool = findTool(id);
  const nav = useNavigate();

  if (!tool) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-5 py-24 text-center">
          <h1 className="text-3xl font-semibold">Tool not found</h1>
          <button onClick={()=>nav('/')} className="mt-6 text-fuchsia-400 hover:underline">Back to home</button>
        </div>
      </div>
    );
  }

  const Icon = tool.icon;
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 lg:px-8 py-10">
        <button onClick={()=>nav('/')} className="text-zinc-400 hover:text-white text-sm inline-flex items-center gap-1.5 mb-6">
          <ArrowLeft className="w-4 h-4"/> Back to all tools
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg shadow-black/40`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">{tool.name}</h1>
            <p className="text-zinc-400 text-sm mt-1">{tool.desc}</p>
          </div>
        </div>

        {tool.client ? <ClientToolRunner tool={tool} /> : <GenericServerTool tool={tool} />}
      </div>
      <Footer />
    </div>
  );
}
