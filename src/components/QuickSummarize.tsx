import React, { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle, X } from 'lucide-react';
import { MobilePhone } from '../types/MobilePhone';
import summaryService from '../services/summaryService';
import { Button, Card } from './shared';
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

      {/* Inline Summary Response */}
      {summary && (
        <Card className="summary-response-card">
          <div className="summary-response-header">
            <div className="summary-response-title">
              <CheckCircle className="summary-success-icon" />
              <h3>AI Summary</h3>
            </div>
            <button className="summary-response-close" onClick={closeSummary}>
              <X size={20} />
            </button>
          </div>
          
          <div className="summary-response-content">
            {summary.response ? (
              <p className="summary-text">{summary.response}</p>
            ) : (
              <pre className="summary-raw-json">
                {JSON.stringify(summary, null, 2)}
              </pre>
            )}
          </div>
          
          {summary.timestamp && (
            <div className="summary-response-footer">
              <span className="summary-timestamp">
                Generated: {new Date(summary.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default QuickSummarize;