import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import HeaderNavigation from './components/HeaderNavigation';
import HomePage from './components/home/HomePage';
import CompareHub from './components/compare/CompareHub';
import MobilePhoneList from './components/MobilePhoneList';
import MobilePhoneDetail from './components/MobilePhoneDetail';
import MobilePhoneComparison from './components/MobilePhoneComparison';
import VisualBuilderTest from './components/VisualBuilderTest';
import ErrorBoundary, { LivePreviewErrorBoundary } from './components/shared/ErrorBoundary';
import { DefaultPersonalizeProvider } from './contexts/PersonalizeContext';
import { FALLBACK_CONFIG } from './config/fallbacks';
import { isPersonalizationEnabled, logPersonalizeEvent } from './utils/personalizeUtils';
import './App.css';
import './components/shared/ErrorBoundary.css';


function App() {
  // Log personalization status on app load (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const personalizationEnabled = isPersonalizationEnabled();
      logPersonalizeEvent('APP_INITIALIZATION', {
        personalizationEnabled,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <DefaultPersonalizeProvider>
        <HelmetProvider>
          <Router>
            <div className="App">
              <ErrorBoundary fallback={
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <p>{FALLBACK_CONFIG.ERRORS.NAVIGATION_UNAVAILABLE}</p>
                </div>
              }>
                <HeaderNavigation />
              </ErrorBoundary>
              
              <main>
                <LivePreviewErrorBoundary>
                  <Routes>
                  {/* New Home Page - Hero landing with value proposition */}
                  <Route path="/" element={
                    <ErrorBoundary>
                      <HomePage />
                    </ErrorBoundary>
                  } />
                  
                  {/* Browse all mobile phones - moved from home */}
                  <Route path="/browse" element={
                    <ErrorBoundary>
                      <MobilePhoneList />
                    </ErrorBoundary>
                  } />
                  
                  {/* Compare hub - category selection */}
                  <Route path="/compare" element={
                    <ErrorBoundary>
                      <CompareHub />
                    </ErrorBoundary>
                  } />
                  
                  {/* Mobile phone comparison page */}
                  <Route path="/compare/:phones" element={
                    <ErrorBoundary>
                      <MobilePhoneComparison />
                    </ErrorBoundary>
                  } />
                  
                  {/* Visual Builder Test Page */}
                  <Route path="/visual-builder-test" element={
                    <ErrorBoundary>
                      <VisualBuilderTest />
                    </ErrorBoundary>
                  } />
                  
                  {/* Individual mobile phone detail page using content URL field */}
                  <Route path="*" element={
                    <ErrorBoundary>
                      <MobilePhoneDetail />
                    </ErrorBoundary>
                  } />
                </Routes>
              </LivePreviewErrorBoundary>
            </main>
          </div>
        </Router>
      </HelmetProvider>
    </DefaultPersonalizeProvider>
  </ErrorBoundary>
  );
}

export default App;