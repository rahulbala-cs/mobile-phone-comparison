import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, X } from 'lucide-react';
import { MobilePhone } from '../types/MobilePhone';
import summaryService from '../services/summaryService';
import { Button } from './shared';
import './QuickSummarize.css';

interface QuickSummarizeProps {
  phones: (MobilePhone | null)[];
  className?: string;
}

const QuickSummarize: React.FC<QuickSummarizeProps> = ({ phones, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validPhones = phones.filter((phone): phone is MobilePhone => phone !== null);

  const handleSummarize = async () => {
    if (validPhones.length < 2) {
      setError('Please select at least 2 phones to compare');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummary(null); // Clear previous summary

    try {
      const summaryResponse = await summaryService.generateSummary({
        phones: validPhones,
        userPreferences: {
          usage: 'general' // Could be made configurable
        }
      });

      setSummary(summaryResponse);
    } catch (err) {
      setError('Failed to generate summary. Please try again.');
      console.error('Summary generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const closeSummary = () => {
    setSummary(null);
    setError(null);
  };

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && summary) {
        closeSummary();
      }
    };

    if (summary) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [summary]);

  if (validPhones.length < 2) {
    return (
      <div className={`quick-summarize-disabled ${className}`} title="Add at least 2 phones to enable smart summary">
        <Button 
          variant="ghost" 
          size="sm"
          icon={Sparkles}
          disabled
        >
          Quick Summarize
        </Button>
      </div>
    );
  }

  return (
    <div className={`quick-summarize ${className}`}>
      {/* Button Section */}
      <div className="quick-summarize-controls">
        <Button 
          variant="primary" 
          size="md"
          icon={Sparkles}
          onClick={handleSummarize}
          disabled={isLoading}
          className="quick-summarize-button"
        >
          {isLoading ? 'Generating...' : 'Quick Summarize'}
        </Button>
        
        {error && (
          <div className="quick-summarize-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Modal Summary Response */}
      {summary && (
        <div className="summary-modal-overlay" onClick={closeSummary}>
          <div className="summary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="summary-modal-header">
              <div className="summary-modal-title">
                <Sparkles className="summary-ai-icon" />
                <h2>AI Phone Comparison Summary</h2>
              </div>
              <button className="summary-modal-close" onClick={closeSummary} title="Close summary">
                <X size={24} />
              </button>
            </div>
            
            <div className="summary-modal-content">
              {summary.response ? (
                <div className="summary-content-formatted">
                  <div className="summary-main-text">
                    <h3>📱 Comparison Summary</h3>
                    <p className="summary-text">{summary.response}</p>
                  </div>
                  
                  {summary.recommendation && (
                    <div className="summary-recommendation">
                      <h3>🏆 Recommendation</h3>
                      <div className="recommendation-card">
                        <div className="recommendation-winner">
                          <strong>{summary.recommendation.winner}</strong>
                        </div>
                        <p className="recommendation-reason">{summary.recommendation.reason}</p>
                        {summary.recommendation.score && (
                          <div className="recommendation-score">
                            Score: {summary.recommendation.score}/10
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {summary.keyDifferences && summary.keyDifferences.length > 0 && (
                    <div className="summary-differences">
                      <h3>🔍 Key Differences</h3>
                      <ul className="differences-list">
                        {summary.keyDifferences.map((diff: string, index: number) => (
                          <li key={index}>{diff}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {summary.prosAndCons && Object.keys(summary.prosAndCons).length > 0 && (
                    <div className="summary-pros-cons">
                      <h3>⚖️ Pros & Cons</h3>
                      <div className="pros-cons-grid">
                        {Object.entries(summary.prosAndCons).map(([phoneName, data]: [string, any]) => (
                          <div key={phoneName} className="phone-pros-cons">
                            <h4>{phoneName}</h4>
                            {data.pros && data.pros.length > 0 && (
                              <div className="pros-section">
                                <h5>✅ Pros</h5>
                                <ul>
                                  {data.pros.map((pro: string, index: number) => (
                                    <li key={index}>{pro}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {data.cons && data.cons.length > 0 && (
                              <div className="cons-section">
                                <h5>❌ Cons</h5>
                                <ul>
                                  {data.cons.map((con: string, index: number) => (
                                    <li key={index}>{con}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="summary-content-raw">
                  <h3>⚙️ Technical Response</h3>
                  <pre className="summary-raw-json">
                    {JSON.stringify(summary, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="summary-modal-footer">
              <span className="summary-disclaimer">
                ⚠️ AI-generated content may contain errors. Please verify details before making purchase decisions.
              </span>
              <button className="summary-close-button" onClick={closeSummary}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickSummarize;