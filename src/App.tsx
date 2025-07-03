import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import HeaderNavigation from './components/HeaderNavigation';
import MobilePhoneList from './components/MobilePhoneList';
import MobilePhoneDetail from './components/MobilePhoneDetail';
import MobilePhoneComparison from './components/MobilePhoneComparison';
import './App.css';

function App() {
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