import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import MetaboxApp from './metabox/MetaboxApp'
import ErrorBoundary from './ErrorBoundary'
import { Toaster } from 'react-hot-toast'

function App() {
  const [cssLibrary, setCssLibrary] = useState('tailwind');

  useEffect(() => {
    // Load CSS library setting
    loadCssLibrary();
  }, []);

  const loadCssLibrary = async () => {
    try {
      const response = await fetch(ajaxurl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_get_css_library',
          nonce: ccc_ajax.nonce,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCssLibrary(data.data.library);
        loadCssLibraryFiles(data.data.library);
      }
    } catch (error) {
      console.error('Error loading CSS library:', error);
    }
  };

  const loadCssLibraryFiles = (library) => {
    if (library === 'bootstrap') {
      // Load Bootstrap CSS and JS
      const bootstrapCSS = document.createElement('link');
      bootstrapCSS.rel = 'stylesheet';
      bootstrapCSS.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css';
      bootstrapCSS.integrity = 'sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM';
      bootstrapCSS.crossOrigin = 'anonymous';
      document.head.appendChild(bootstrapCSS);

      const bootstrapJS = document.createElement('script');
      bootstrapJS.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js';
      bootstrapJS.integrity = 'sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz';
      bootstrapJS.crossOrigin = 'anonymous';
      document.body.appendChild(bootstrapJS);
    }
    // Tailwind is already loaded by default
    // Custom CSS is handled by user
  };

  // Check if we're in a metabox context
  const isMetabox = document.getElementById('ccc-metabox-root');

  if (isMetabox) {
    return (
      <>
        <ErrorBoundary>
          <MetaboxApp />
        </ErrorBoundary>
        <Toaster 
          position="top-center" 
          containerStyle={{
            top: 20,
            left: 50,
            bottom: 20,
            right: 50,
          }}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              zIndex: 999999,
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
            },
            success: {
              duration: 4000,
              style: {
                background: '#10B981',
                color: '#fff',
                zIndex: 999999,
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#EF4444',
                color: '#fff',
                zIndex: 999999,
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
              },
            },
          }}
        />
      </>
    );
  }

  // Main admin app
  return (
    <>
      <section className='bg-custom-gradient h-full -ml-5'>
        <div className='container mx-auto'>
         <ErrorBoundary>
         <Header/>
         </ErrorBoundary>
        </div>
      </section>
      <Toaster 
        position="top-center" 
        containerStyle={{
          top: 20,
          left: 50,
          bottom: 20,
          right: 50,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            zIndex: 999999,
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
          },
          success: {
            duration: 4000,
            style: {
              background: '#10B981',
              color: '#fff',
              zIndex: 999999,
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#EF4444',
              color: '#fff',
              zIndex: 999999,
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
            },
          },
        }}
      />
    </>
  )
}

export default App
