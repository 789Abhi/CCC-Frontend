import React from 'react'
import Header from './components/Header'
import MetaboxApp from './metabox/MetaboxApp'
import ErrorBoundary from './ErrorBoundary'


function App() {
  // Check if we're in a metabox context
  const isMetabox = document.getElementById('ccc-metabox-root');

  if (isMetabox) {
    return (
      <ErrorBoundary>
        <MetaboxApp />
      </ErrorBoundary>
    );
  }

  // Main admin app
  return (
    <section className='bg-custom-gradient h-full -ml-5'>
      <div className='container mx-auto'>
       <ErrorBoundary>
       <Header/>
       </ErrorBoundary>
      </div>
    </section>
  )
}

export default App
