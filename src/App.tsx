import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import HeaderNavigation from './components/HeaderNavigation';
import MobilePhoneList from './components/MobilePhoneList';
import MobilePhoneDetail from './components/MobilePhoneDetail';
import MobilePhoneComparison from './components/MobilePhoneComparison';
import { initLivePreview, isLivePreviewEnabled } from './utils/livePreview';
import './App.css';

function App() {
  // Initialize Live Preview on app start
  useEffect(() => {
    if (isLivePreviewEnabled()) {
      initLivePreview();
      console.log('🔴 Live Preview Mode: Enabled');
    } else {
      console.log('⚪ Live Preview Mode: Disabled');
    }
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <div className="App">
          {/* Live Preview indicator */}
          {isLivePreviewEnabled() && (
            <div style={{
              position: 'fixed',
              top: 0,
              right: 0,
              background: '#ff4444',
              color: 'white',
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              zIndex: 9999,
              borderBottomLeftRadius: '4px'
            }}>
              LIVE PREVIEW
            </div>
          )}
          
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