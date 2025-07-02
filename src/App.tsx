import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import MobilePhoneList from './components/MobilePhoneList';
import MobilePhoneDetail from './components/MobilePhoneDetail';
import './App.css';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* List all mobile phones */}
            <Route path="/" element={<MobilePhoneList />} />
            
            {/* Individual mobile phone detail page using content URL field */}
            <Route path="*" element={<MobilePhoneDetail />} />
          </Routes>
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;