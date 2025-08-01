import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home, Search, ArrowLeft } from 'lucide-react';
import './NotFound.css';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  // Set document title immediately for better SEO
  useEffect(() => {
    document.title = 'Page Not Found - Mobile Compare';
  }, []);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleBrowsePhones = () => {
    navigate('/browse');
  };

  return (
    <>
      <Helmet>
        <title>Page Not Found - Mobile Compare</title>
        <meta name="description" content="The page you're looking for doesn't exist. Browse our mobile phone comparisons or return to the homepage." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="not-found">
        <div className="not-found__container">
          <div className="not-found__content">
            <div className="not-found__graphic">
              <div className="not-found__phone-outline">
                <div className="not-found__screen">
                  <div className="not-found__error-code">404</div>
                  <div className="not-found__signal-bars">
                    <div className="signal-bar"></div>
                    <div className="signal-bar"></div>
                    <div className="signal-bar"></div>
                    <div className="signal-bar"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="not-found__text">
              <h1 className="not-found__title">Page Not Found</h1>
              <p className="not-found__description">
                Oops! The page you're looking for seems to have wandered off into the digital void.
                Maybe it's comparing phones in another dimension?
              </p>
              
              <div className="not-found__suggestions">
                <h3>Here are some things you can try:</h3>
                <ul>
                  <li>Check the URL for any typos</li>
                  <li>Browse our mobile phone collection</li>
                  <li>Start a new comparison from the homepage</li>
                  <li>Use the search feature to find specific phones</li>
                </ul>
              </div>
            </div>
            
            <div className="not-found__actions">
              <button 
                className="not-found__btn not-found__btn--primary"
                onClick={handleGoHome}
              >
                <Home size={20} />
                Go to Homepage
              </button>
              
              <button 
                className="not-found__btn not-found__btn--secondary"
                onClick={handleBrowsePhones}
              >
                <Search size={20} />
                Browse Phones
              </button>
              
              <button 
                className="not-found__btn not-found__btn--ghost"
                onClick={handleGoBack}
              >
                <ArrowLeft size={20} />
                Go Back
              </button>
            </div>
            
            <div className="not-found__help">
              <p>
                Still having trouble? The page might be temporarily unavailable or the link might be broken.
                Try refreshing the page or contact support if the problem persists.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;