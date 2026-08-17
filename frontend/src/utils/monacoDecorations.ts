import { PeerCursorInfo } from '../stores/collaborationStore';

// Injected dynamic stylesheet cache
let styleElement: HTMLStyleElement | null = null;
const injectedColors = new Set<string>();

const ensureColorStyles = (userId: string, color: string, username: string) => {
  if (typeof document === 'undefined') return;

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'codesync-remote-cursors';
    document.head.appendChild(styleElement);
  }

  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  if (injectedColors.has(safeUserId)) return;

  const css = `
    .remote-cursor-${safeUserId} {
      position: absolute;
      border-left: 2px solid ${color} !important;
      height: 100% !important;
      z-index: 100 !important;
      pointer-events: none;
    }
    .remote-cursor-${safeUserId}::before {
      content: "${username}";
      position: absolute;
      top: -16px;
      left: -2px;
      font-size: 9px;
      font-family: monospace;
      font-weight: 600;
      color: #0b0f17;
      background-color: ${color};
      padding: 0 4px;
      border-radius: 2px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0.9;
    }
    .remote-selection-${safeUserId} {
      background-color: ${color}26 !important; /* 15% opacity */
      border-radius: 2px;
    }
  `;

  styleElement.appendChild(document.createTextNode(css));
  injectedColors.add(safeUserId);
};

export const updateRemoteCursorDecorations = (
  editor: any,
  peerCursors: Record<string, PeerCursorInfo>,
  previousDecorationIds: string[] = []
): string[] => {
  if (!editor || typeof editor.deltaDecorations !== 'function') {
    return previousDecorationIds;
  }

  const newDecorations: any[] = [];

  for (const peer of Object.values(peerCursors)) {
    const { user, cursor, selection } = peer;
    if (!cursor || !cursor.line) continue;

    const safeUserId = user.userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    ensureColorStyles(user.userId, user.color, user.username);

    // 1. Remote Cursor Marker
    newDecorations.push({
      range: {
        startLineNumber: cursor.line,
        startColumn: cursor.column,
        endLineNumber: cursor.line,
        endColumn: cursor.column,
      },
      options: {
        className: `remote-cursor-${safeUserId}`,
        hoverMessage: { value: `**${user.name}** (@${user.username})` },
        stickiness: 1, // Track with text insertion
      },
    });

    // 2. Remote Text Selection Highlight
    if (
      selection &&
      (selection.startLineNumber !== selection.endLineNumber ||
        selection.startColumn !== selection.endColumn)
    ) {
      newDecorations.push({
        range: {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn,
        },
        options: {
          className: `remote-selection-${safeUserId}`,
          stickiness: 1,
        },
      });
    }
  }

  return editor.deltaDecorations(previousDecorationIds, newDecorations);
};
