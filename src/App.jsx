import React from 'react'
import Header from './components/Header'
import ErrorBoundary from './ErrorBoundary'

function App() {
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
