const fs = require('fs');
const path = require('path');

// Field type mapping
const fieldTypes = {
  'Textfield.jsx': 'text',
  'TextareaField.jsx': 'textarea',
  'ImageField.jsx': 'image',
  'VideoField.jsx': 'video',
  'OembedField.jsx': 'oembed',
  'RelationshipField.jsx': 'relationship',
  'LinkField.jsx': 'link',
  'EmailField.jsx': 'email',
  'NumberField.jsx': 'number',
  'RangeField.jsx': 'range',
  'FileField.jsx': 'file',
  'RepeaterField.jsx': 'repeater',
  'WysiwygField.jsx': 'wysiwyg',
  'ColorField.jsx': 'color',
  'SelectField.jsx': 'select',
  'CheckboxField.jsx': 'checkbox',
  'RadioField.jsx': 'radio',
  'ToggleField.jsx': 'toggle',
  'GalleryField.jsx': 'gallery',
  'DateField.jsx': 'date',
  'UserField.jsx': 'user',
  'PasswordField.jsx': 'password'
};

const fieldsDir = 'D:\\custom craft component\\frontend\\src\\metabox\\fields\\';

Object.entries(fieldTypes).forEach(([filename, fieldType]) => {
  const filePath = path.join(fieldsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has UniversalFieldWrapper
  if (content.includes('UniversalFieldWrapper')) {
    console.log(`Already updated: ${filename}`);
    return;
  }
  
  // Add import
  if (!content.includes('import UniversalFieldWrapper')) {
    content = content.replace(
      /import.*from.*['"]\.\/.*['"];?\s*\n/,
      `$&import UniversalFieldWrapper from './UniversalFieldWrapper';\n`
    );
  }
  
  // Find the main component function and wrap it
  const componentName = filename.replace('.jsx', '');
  
  // Look for the main return statement
  const returnMatch = content.match(/(\s+return\s*\([\s\S]*?\);?\s*)(?=\s*};?\s*$)/);
  
  if (returnMatch) {
    const returnStatement = returnMatch[1];
    const wrappedReturn = `return (
      <UniversalFieldWrapper 
        fieldType="${fieldType}" 
        fieldLabel={label}
        licenseKey={licenseKey || ''}
        apiUrl={apiUrl || 'https://custom-craft-component-backend.vercel.app/api/pro-features/check'}
      >
        ${returnStatement.trim()}
      </UniversalFieldWrapper>
    );`;
    
    content = content.replace(returnMatch[0], wrappedReturn);
    
    // Add props to function parameters
    const functionMatch = content.match(/(const\s+\w+\s*=\s*\(\s*{[^}]*}\s*\)\s*=>\s*{)/);
    if (functionMatch) {
      const functionStart = functionMatch[1];
      if (!functionStart.includes('licenseKey')) {
        const updatedFunctionStart = functionStart.replace(
          /(\s*{[^}]*)(\s*}\s*\)\s*=>\s*{)/,
          '$1, licenseKey = \'\', apiUrl = \'https://custom-craft-component-backend.vercel.app/api/pro-features/check\'$2'
        );
        content = content.replace(functionStart, updatedFunctionStart);
      }
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filename} with fieldType: ${fieldType}`);
  } else {
    console.log(`Could not find return statement in: ${filename}`);
  }
});

console.log('React field components update complete!');
