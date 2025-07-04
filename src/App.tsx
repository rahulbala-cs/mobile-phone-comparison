import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import HeaderNavigation from './components/HeaderNavigation';
import MobilePhoneList from './components/MobilePhoneList';
import MobilePhoneDetail from './components/MobilePhoneDetail';
import MobilePhoneComparison from './components/MobilePhoneComparison';
import { initializeLivePreview } from './utils/livePreview';
import './App.css';

function App() {
  // Initialize Live Preview globally using standard V3.0 pattern
  useEffect(() => {
    initializeLivePreview().catch(error => {
      console.error('Failed to initialize Live Preview:', error);
    });
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <div className="App">
          <HeaderNavigation />
          <main>
            <Routes>
              {/* List all mobile phones */}
              <Route path="/" element={<MobilePhoneList />} />
              
              {/* Mobile phone comparison page */}
              <Route path="/compare/:phones" element={<MobilePhoneComparison />} />
              
              {/* Individual mobile phone detail page using content URL field */}
              <Route path="*" element={<MobilePhoneDetail />} />
            </Routes>
          </main>
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;