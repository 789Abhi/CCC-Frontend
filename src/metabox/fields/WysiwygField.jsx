import React, { useEffect, useRef } from 'react';

function WysiwygField({ label, value, onChange, required, error, editorId }) {
  const textareaRef = useRef();

  useEffect(() => {
    // Remove any existing editor instance
    if (window.tinymce && window.tinymce.get(editorId)) {
      window.tinymce.get(editorId).remove();
    }

    // Initialize TinyMCE
    if (window.tinymce) {
      window.tinymce.init({
        selector: `#${editorId}`,
        menubar: false,
        branding: false,
        height: 220,
        plugins: 'lists link image paste', // removed 'code'
        toolbar: 'undo redo | bold italic underline | bullist numlist | link image', // removed 'code'
        setup: (editor) => {
          editor.on('Change KeyUp', () => {
            onChange && onChange(editor.getContent());
          });
        },
        init_instance_callback: (editor) => {
          editor.setContent(value || '');
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (window.tinymce && window.tinymce.get(editorId)) {
        window.tinymce.get(editorId).remove();
      }
    };
  }, [editorId]);

  // Update editor content if value changes externally
  useEffect(() => {
    if (window.tinymce && window.tinymce.get(editorId)) {
      if (window.tinymce.get(editorId).getContent() !== value) {
        window.tinymce.get(editorId).setContent(value || '');
      }
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
      />
      {error && <div className="text-xs text-red-500 mt-1">This field is required.</div>}
    </div>
  );
}

export default WysiwygField; 