import React, { useEffect, useRef } from 'react';

function WysiwygField({ label, value, onChange, required, error, editorId }) {
  const textareaRef = useRef();

  // Helper to wait for wp.editor to be available
  function waitForEditorInit(cb) {
    if (window.wp && window.wp.editor && window.wp.editor.initialize) {
      cb();
    } else {
      setTimeout(() => waitForEditorInit(cb), 100);
    }
  }

  useEffect(() => {
    // Remove any existing editor instance
    if (window.tinymce && window.tinymce.get(editorId)) {
      window.tinymce.get(editorId).remove();
    }
    if (window.wp && window.wp.editor && window.wp.editor.remove) {
      window.wp.editor.remove(editorId);
    }

    // Wait for wp.editor to be available, then initialize
    waitForEditorInit(() => {
      window.wp.editor.initialize(editorId, {
        tinymce: {
          wpautop: true,
          plugins: 'charmap colorpicker hr lists paste tabfocus textcolor fullscreen wordpress wpautoresize wpeditimage wpemoji wpgallery wplink wptextpattern',
          toolbar1: 'formatselect bold italic bullist numlist blockquote alignleft aligncenter alignright link unlink wp_more spellchecker fullscreen wp_adv',
          toolbar2: 'strikethrough hr forecolor pastetext removeformat charmap outdent indent undo redo wp_help',
        },
        quicktags: true,
        mediaButtons: true,
      });
      // Set initial value
      if (textareaRef.current) {
        textareaRef.current.value = value || '';
      }
    });

    // Cleanup on unmount
    return () => {
      if (window.tinymce && window.tinymce.get(editorId)) {
        window.tinymce.get(editorId).remove();
      }
      if (window.wp && window.wp.editor && window.wp.editor.remove) {
        window.wp.editor.remove(editorId);
      }
    };
  }, [editorId]);

  // Listen for changes
  useEffect(() => {
    const handler = () => {
      if (textareaRef.current && onChange) {
        onChange(textareaRef.current.value);
      }
    };
    if (window.tinymce && window.tinymce.get(editorId)) {
      window.tinymce.get(editorId).on('change keyup', handler);
    }
    return () => {
      if (window.tinymce && window.tinymce.get(editorId)) {
        window.tinymce.get(editorId).off('change keyup', handler);
      }
    };
  }, [editorId, onChange]);

  // Update editor content if value changes externally
  useEffect(() => {
    if (window.tinymce && window.tinymce.get(editorId)) {
      if (window.tinymce.get(editorId).getContent() !== value) {
        window.tinymce.get(editorId).setContent(value || '');
      }
    }
    if (textareaRef.current && textareaRef.current.value !== value) {
      textareaRef.current.value = value || '';
    }
  }, [value, editorId]);

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={editorId}
        ref={textareaRef}
        defaultValue={value}
        className="w-full border border-gray-300 rounded-lg shadow-sm"
        style={{ minHeight: 120 }}
        onChange={e => {
          console.log('WYSIWYG textarea change:', e.target.value);
          onChange && onChange(e.target.value);
        }}
      />
      {error && <div className="text-xs text-red-500 mt-1">This field is required.</div>}
    </div>
  );
}

export default WysiwygField; 