import React from 'react';
import { ChevronRight } from 'lucide-react';

const Header = ({ complianceScore = 75 }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (complianceScore / 100) * circumference;
  
  // Determine color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return '#00d4aa'; // green
    if (score >= 50) return '#ffa500'; // amber
    return '#e50914'; // red
  };

  const scoreColor = getScoreColor(complianceScore);

  return (
    <header className="bg-dark-surface border-b border-dark-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2">
          <ol className="flex items-center space-x-2" role="list">
            <li>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent-green rounded px-1"
                aria-label="Navigate to Sales"
              >
                Sales
              </a>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </li>
            <li>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent-green rounded px-1"
                aria-label="Navigate to Setup"
              >
                Setup
              </a>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </li>
            <li>
              <span className="text-white font-medium" aria-current="page">
                Audit
              </span>
            </li>
          </ol>
        </nav>

        {/* Compliance Score Gauge */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-400" id="compliance-label">
              Compliance Score
            </span>
            <div className="relative" role="img" aria-labelledby="compliance-label" aria-valuenow={complianceScore} aria-valuemin="0" aria-valuemax="100">
              <svg width="100" height="100" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#2d2d2d"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-xl font-bold"
                  style={{ color: scoreColor }}
                  aria-label={`Compliance score: ${complianceScore} percent`}
                >
                  {complianceScore}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

