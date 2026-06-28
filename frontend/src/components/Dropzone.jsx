import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

export default function Dropzone({ multiple=false, accept='application/pdf', files, setFiles, label='Drop file here or click to upload' }) {
  const [drag, setDrag] = useState(false);
  const inputRef = React.useRef(null);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false);
    const list = Array.from(e.dataTransfer.files || []);
    setFiles(multiple ? [...(files||[]), ...list] : list.slice(0,1));
  }, [files, multiple, setFiles]);

  const onPick = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(multiple ? [...(files||[]), ...list] : list.slice(0,1));
  };

  const removeAt = (i) => {
    const next = [...files]; next.splice(i,1); setFiles(next);
  };

  return (
    <div>
      <div
        onDragOver={(e)=>{e.preventDefault(); setDrag(true);}}
        onDragLeave={()=>setDrag(false)}
        onDrop={onDrop}
        onClick={()=>inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 px-6 py-12 text-center ${drag ? 'border-fuchsia-400 bg-fuchsia-500/5' : 'border-white/10 bg-zinc-900/40 hover:border-white/20 hover:bg-zinc-900/60'}`}
      >
        <input ref={inputRef} type="file" hidden multiple={multiple} accept={accept} onChange={onPick} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-400/20 border border-white/10 flex items-center justify-center">
            <UploadCloud className="w-7 h-7 text-fuchsia-300" />
          </div>
          <div>
            <p className="text-white font-medium">{label}</p>
            <p className="text-zinc-500 text-sm mt-1">{accept.includes('pdf') ? 'PDF files' : 'Image files'} {multiple && '· multiple allowed'}</p>
          </div>
        </div>
      </div>

      {files?.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-zinc-900/60 border border-white/5 rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-fuchsia-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{f.name}</p>
                <p className="text-zinc-500 text-xs">{(f.size/1024).toFixed(1)} KB</p>
              </div>
              <button onClick={(e)=>{e.stopPropagation(); removeAt(i);}} className="text-zinc-500 hover:text-white p-1"><X className="w-4 h-4"/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
