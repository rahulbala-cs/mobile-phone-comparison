import React from 'react';
import { Check } from 'lucide-react';
import './ProgressIndicator.css';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
}

const defaultSteps = ['Choose Category', 'Select Devices', 'Compare Features', 'Make Decision'];

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  steps = defaultSteps
}) => {
  return (
    <div className="progress-indicator">
      <div className="progress-indicator__container">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const stepLabel = steps[index] || `Step ${stepNumber}`;

          return (
            <div key={stepNumber} className="progress-indicator__step-wrapper">
              <div className="progress-indicator__step">
                <div 
                  className={`progress-indicator__circle ${
                    isCompleted ? 'progress-indicator__circle--completed' :
                    isCurrent ? 'progress-indicator__circle--current' :
                    'progress-indicator__circle--upcoming'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} />
                  ) : (
                    <span className="progress-indicator__number">{stepNumber}</span>
                  )}
                </div>
                <span 
                  className={`progress-indicator__label ${
                    isCompleted ? 'progress-indicator__label--completed' :
                    isCurrent ? 'progress-indicator__label--current' :
                    'progress-indicator__label--upcoming'
                  }`}
                >
                  {stepLabel}
                </span>
              </div>
              
              {stepNumber < totalSteps && (
                <div 
                  className={`progress-indicator__connector ${
                    isCompleted ? 'progress-indicator__connector--completed' : ''
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;