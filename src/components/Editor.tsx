import { useRef, type ReactNode } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { safeHref } from '../lib/html';
import {
  ListIcon,
  LinkIcon,
  OrderedListIcon,
  QuoteIcon,
  RedoIcon,
  UndoIcon,
} from './Icons';

interface EditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
  footer?: ReactNode;
}

// Mod+K belongs to the global search palette, so the link shortcut is removed here.
const JournalLink = Link.extend({
  addKeyboardShortcuts: () => ({}),
});

function ToolButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`tool-btn ${active ? 'is-active' : ''} disabled:opacity-35`}
    >
      {children}
    </button>
  );
}

export function Editor({ initialHtml, onChange, footer }: EditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      JournalLink.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      Placeholder.configure({
        placeholder:
          'Your thoughts, ideas, feelings, plans…\nHere’s a safe space for everything.',
      }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: 'polaris-editor',
        'aria-label': 'Journal entry',
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChangeRef.current(instance.getHTML());
    },
  });

  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const answer = window.prompt('Link URL', previous ?? 'https://');
    if (answer === null) return;
    if (answer.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const href = safeHref(answer);
    if (!href) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  };

  return (
    <div className="glass rounded-2xl">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--border)] px-3 py-2.5 sm:px-4">
        <ToolButton
          label="Bold"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <span className="font-serif text-[17px] font-semibold">B</span>
        </ToolButton>
        <ToolButton
          label="Italic"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <span className="font-serif text-[17px] italic">I</span>
        </ToolButton>
        <ToolButton
          label="Underline"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="font-serif text-[17px] underline underline-offset-2">U</span>
        </ToolButton>
        <ToolButton
          label="Link"
          active={editor.isActive('link')}
          onClick={setLink}
        >
          <LinkIcon className="h-[17px] w-[17px]" />
        </ToolButton>

        <span className="mx-1.5 h-5 w-px bg-[var(--border)]" />

        <ToolButton
          label="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListIcon className="h-[17px] w-[17px]" />
        </ToolButton>
        <ToolButton
          label="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <OrderedListIcon className="h-[17px] w-[17px]" />
        </ToolButton>
        <ToolButton
          label="Quote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <QuoteIcon className="h-[17px] w-[17px]" />
        </ToolButton>

        <span className="mx-1.5 h-5 w-px bg-[var(--border)]" />

        <ToolButton
          label="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <UndoIcon className="h-[17px] w-[17px]" />
        </ToolButton>
        <ToolButton
          label="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <RedoIcon className="h-[17px] w-[17px]" />
        </ToolButton>
      </div>

      <div
        className="cursor-text px-5 pb-6 pt-4 sm:px-7"
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>

      {footer ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3 sm:px-5">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
