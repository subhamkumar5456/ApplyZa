import { useEffect } from 'react';

interface UseEditorShortcutsProps {
  onSave?: () => void;
  onCompile?: () => void;
  onDownload?: () => void;
}

export function useEditorShortcuts({ onSave, onCompile, onDownload }: UseEditorShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Command (Mac) or Control (Windows/Linux) is pressed
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl) {
        if (e.key === 's' || e.key === 'S') {
          if (onSave) {
            e.preventDefault();
            onSave();
          }
        } else if (e.key === 'Enter') {
          if (onCompile) {
            e.preventDefault();
            onCompile();
          }
        } else if (e.key === 'p' || e.key === 'P') {
          if (onDownload) {
            e.preventDefault();
            onDownload();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSave, onCompile, onDownload]);
}
