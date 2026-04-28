import { Keyboard } from 'lucide-react'

export function EditorShortcutHints() {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdKey = isMac ? '⌘' : 'Ctrl+';

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-900/50 border border-slate-800/50 rounded-lg text-xs text-slate-400 font-medium">
      <div className="flex items-center gap-1.5 text-slate-500 mr-2">
        <Keyboard className="w-3.5 h-3.5" />
        <span>Shortcuts</span>
      </div>
      
      <div className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-[10px]">{cmdKey}S</kbd>
        <span>Save Version</span>
      </div>
      
      <div className="w-px h-3 bg-slate-700"></div>
      
      <div className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-[10px]">{cmdKey}Enter</kbd>
        <span>Compile</span>
      </div>
      
      <div className="w-px h-3 bg-slate-700"></div>
      
      <div className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-[10px]">{cmdKey}P</kbd>
        <span>Download PDF</span>
      </div>
    </div>
  )
}
