import { useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { adminApi } from '../../api/index.js';
import { ta } from '../../utils/adminI18n.js';
import { normalizeError } from '../../utils/errors.js';

const SizedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) => element.style.width || '100%',
        renderHTML: (attributes) => ({ style: `width: ${attributes.width || '100%'}` }),
      },
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') || 'center',
        renderHTML: (attributes) => ({ 'data-align': attributes.align || 'center' }),
      },
    };
  },
});

function Tool({ label, active, onClick, children }) {
  return (
    <button
      type="button"
      className={active ? 'is-on' : ''}
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function readFile(file) {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
    return Promise.reject(new Error('image-type'));
  }
  if (file.type === 'image/gif' && file.size <= 4 * 1024 * 1024) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('image-read'));
      reader.readAsDataURL(file);
    });
  }
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    const local = URL.createObjectURL(file);
    image.onload = () => {
      const max = 1600;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(local);
      resolve(canvas.toDataURL('image/jpeg', 0.84));
    };
    image.onerror = () => {
      URL.revokeObjectURL(local);
      reject(new Error('image-read'));
    };
    image.src = local;
  });
}

export function RichTextEditor({ value, onChange, language, dir = 'ltr' }) {
  const fileRef = useRef(null);
  const [imageUrl, setImageUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [linkValue, setLinkValue] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      SizedImage.configure({ inline: false, allowBase64: false }),
    ],
    content: value || '',
    editorProps: { attributes: { dir } },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  if (!editor) return null;
  const imageOn = editor.isActive('image');
  const image = imageOn ? editor.getAttributes('image') : null;

  function insertImage(src) {
    const address = String(src || '').trim();
    if (!/^https?:\/\//i.test(address) && !address.startsWith('/')) {
      setError(ta(language, 'editorImageUrl'));
      return;
    }
    editor.chain().focus().setImage({ src: address, alt: alt.trim(), width: '70%', align: 'center' }).run();
    setImageUrl('');
    setError('');
  }

  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const dataUrl = await readFile(file);
      const payload = await adminApi.uploadImage(dataUrl);
      editor.chain().focus().setImage({ src: payload.data.url, alt: alt.trim() || file.name, width: '70%', align: 'center' }).run();
    } catch (err) {
      const code = err?.message;
      if (code === 'image-type') setError(ta(language, 'editorType'));
      else if (code === 'image-read') setError(ta(language, 'editorRead'));
      else setError(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  }

  function layout(patch) {
    editor.chain().focus().updateAttributes('image', patch).run();
  }

  return (
    <div className="rich-editor" dir={dir}>
      <div className="rich-toolbar" role="toolbar" aria-label={ta(language, 'body')}>
        <Tool label={ta(language, 'editorBold')} active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>B</Tool>
        <Tool label={ta(language, 'editorItalic')} active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></Tool>
        <Tool label={ta(language, 'editorUnderline')} active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></Tool>
        <Tool label={ta(language, 'editorStrike')} active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></Tool>
        <Tool label={ta(language, 'editorH2')} active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Tool>
        <Tool label={ta(language, 'editorH3')} active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Tool>
        <Tool label={ta(language, 'editorList')} active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>•</Tool>
        <Tool label={ta(language, 'editorNumbers')} active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</Tool>
        <Tool label={ta(language, 'editorQuote')} active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>“</Tool>
        <Tool label={ta(language, 'editorAlignLeft')} active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>⇤</Tool>
        <Tool label={ta(language, 'editorAlignCenter')} active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>↔</Tool>
        <Tool label={ta(language, 'editorAlignRight')} active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>⇥</Tool>
        <Tool label={ta(language, 'editorLink')} active={editor.isActive('link')} onClick={() => { setLinkValue(editor.getAttributes('link').href || ''); setLinkOpen((open) => !open); }}>↗</Tool>
        <Tool label={ta(language, 'editorRule')} onClick={() => editor.chain().focus().setHorizontalRule().run()}>—</Tool>
        <Tool label={ta(language, 'editorUndo')} onClick={() => editor.chain().focus().undo().run()}>↶</Tool>
        <Tool label={ta(language, 'editorRedo')} onClick={() => editor.chain().focus().redo().run()}>↷</Tool>
        <Tool label={ta(language, 'editorClear')} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>×</Tool>
      </div>
      {linkOpen ? (
        <div className="rich-imagebar">
          <input value={linkValue} placeholder="https://" aria-label={ta(language, 'editorLink')} onChange={(event) => setLinkValue(event.target.value)} />
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => {
            if (!linkValue.trim()) editor.chain().focus().unsetLink().run();
            else editor.chain().focus().extendMarkRange('link').setLink({ href: linkValue.trim() }).run();
            setLinkOpen(false);
          }}>{ta(language, 'editorInsert')}</button>
        </div>
      ) : null}
      <div className="rich-imagebar">
        <input value={imageUrl} placeholder={ta(language, 'editorImageUrl')} aria-label={ta(language, 'editorImageUrl')} onChange={(event) => setImageUrl(event.target.value)} />
        <input value={alt} placeholder={ta(language, 'editorAlt')} aria-label={ta(language, 'editorAlt')} onChange={(event) => setAlt(event.target.value)} />
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => insertImage(imageUrl)}>{ta(language, 'editorInsert')}</button>
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? ta(language, 'saving') : ta(language, 'editorUpload')}</button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={onFile} />
      </div>
      {imageOn ? (
        <div className="rich-imagebar" role="group" aria-label={ta(language, 'editorImage')}>
          {[['40%', 'editorSmall'], ['70%', 'editorMedium'], ['100%', 'editorFull']].map(([width, key]) => (
            <button key={width} type="button" className={image.width === width ? 'is-on' : ''} onMouseDown={(event) => event.preventDefault()} onClick={() => layout({ width })}>{ta(language, key)}</button>
          ))}
          {[['left', 'editorPlaceLeft'], ['center', 'editorPlaceCenter'], ['right', 'editorPlaceRight']].map(([align, key]) => (
            <button key={align} type="button" className={image.align === align ? 'is-on' : ''} onMouseDown={(event) => event.preventDefault()} onClick={() => layout({ align })}>{ta(language, key)}</button>
          ))}
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().deleteSelection().run()}>{ta(language, 'editorRemove')}</button>
        </div>
      ) : <p className="rich-hint">{ta(language, 'editorImageNote')}</p>}
      {error ? <p className="form-error">{error}</p> : null}
      <EditorContent editor={editor} />
    </div>
  );
}
