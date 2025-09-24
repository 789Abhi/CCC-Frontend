import React from 'react'
import Header from './components/Header'
import MetaboxApp from './metabox/MetaboxApp'
import ErrorBoundary from './ErrorBoundary'
import FieldAccessPreloader from './components/FieldAccessPreloader'
import { Toaster } from 'react-hot-toast'

function App() {
  // Check if we're in a metabox context
  const isMetabox = document.getElementById('ccc-metabox-root');

  if (isMetabox) {
    return (
      <>
        <FieldAccessPreloader />
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
      <FieldAccessPreloader />
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
