import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import AuditSidebar from './components/AuditSidebar';
import NodeWorkspace from './components/NodeWorkspace';
import PushToLiveButton from './components/PushToLiveButton';
import {
  getContractData,
  getCampaignFields,
  getAuditFlags,
  getComplianceScore,
  remediateField,
  pushToLive,
} from './services/api';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [complianceScore, setComplianceScore] = useState(0);
  const [flags, setFlags] = useState([]);
  const [contractData, setContractData] = useState({
    fields: {},
  });
  const [fieldData, setFieldData] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState({});

  // Fetch initial data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [contract, fields, auditFlags, score] = await Promise.all([
          getContractData().catch(() => ({ fields: {} })),
          getCampaignFields().catch(() => []),
          getAuditFlags().catch(() => []),
          getComplianceScore().catch(() => ({ score: 0 })),
        ]);

        setContractData(contract);
        setFieldData(fields);
        setFlags(auditFlags);
        setComplianceScore(score.score || score);

        // Build connection status from field data
        const statusMap = {};
        fields.forEach((field) => {
          statusMap[field.fieldType] = field.status || 'PASS';
        });
        setConnectionStatus(statusMap);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err.message || 'Failed to load data from backend');
        // Fallback to mock data if API fails
        setContractData({
          fields: {
            Budget: '$50,000',
            Genres: 'Action, Drama',
            Geos: 'US, CA, UK',
          },
        });
        setFieldData([
          {
            fieldType: 'Budget',
            value: '$55,000',
            expected: '$50,000',
            status: 'FAIL',
            remediatedAt: null,
          },
          {
            fieldType: 'Genres',
            value: 'Action, Drama, Comedy',
            expected: 'Action, Drama',
            status: 'WARN',
            remediatedAt: null,
          },
          {
            fieldType: 'Geos',
            value: 'US, CA, UK',
            expected: 'US, CA, UK',
            status: 'PASS',
            remediatedAt: null,
          },
        ]);
        setFlags([
          {
            id: '1',
            status: 'FAIL',
            message: 'Budget exceeds contract limit by $5,000',
            field: 'Budget',
          },
          {
            id: '2',
            status: 'WARN',
            message: 'Genre selection may not match target demographics',
            field: 'Genres',
          },
          {
            id: '3',
            status: 'PASS',
            message: 'Geographic targeting matches contract specifications',
            field: 'Geos',
          },
        ]);
        setComplianceScore(75);
        setConnectionStatus({
          Budget: 'FAIL',
          Genres: 'WARN',
          Geos: 'PASS',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Poll for updates every 30 seconds
    const interval = setInterval(async () => {
      try {
        const [auditFlags, score] = await Promise.all([
          getAuditFlags().catch(() => flags),
          getComplianceScore().catch(() => ({ score: complianceScore })),
        ]);
        setFlags(auditFlags);
        setComplianceScore(score.score || score);
      } catch (err) {
        console.error('Failed to refresh data:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calculate compliance score based on flags (fallback)
  useEffect(() => {
    if (flags.length > 0 && complianceScore === 0) {
      const totalFlags = flags.length;
      const failCount = flags.filter((f) => f.status === 'FAIL').length;
      const warnCount = flags.filter((f) => f.status === 'WARN').length;
      const passCount = flags.filter((f) => f.status === 'PASS').length;

      // Score calculation: PASS = 100%, WARN = 50%, FAIL = 0%
      const score = Math.round(
        ((passCount * 100 + warnCount * 50) / totalFlags) || 0
      );
      setComplianceScore(score);
    }
  }, [flags, complianceScore]);

  // Announce compliance score changes to screen readers
  useEffect(() => {
    const announcement = document.getElementById('compliance-announcement');
    if (announcement) {
      announcement.textContent = `Compliance score updated to ${complianceScore} percent`;
    }
  }, [complianceScore]);

  const handleRemediate = useCallback(async (flag) => {
    try {
      // Call backend API to remediate
      const result = await remediateField(flag.id, flag.field);

      // Find the corresponding field and update it
      const fieldIndex = fieldData.findIndex(
        (f) => f.fieldType === flag.field
      );

      if (fieldIndex !== -1) {
        const updatedFieldData = [...fieldData];
        const field = updatedFieldData[fieldIndex];

        // Morph animation: update field to match expected value
        updatedFieldData[fieldIndex] = {
          ...field,
          value: result.value || field.expected || field.value,
          status: 'PASS',
          remediatedAt: Date.now(), // Track when remediation happened
        };

        setFieldData(updatedFieldData);

        // Update connection status
        setConnectionStatus((prev) => ({
          ...prev,
          [flag.field]: 'PASS',
        }));

        // Update flag status
        setFlags((prevFlags) =>
          prevFlags.map((f) =>
            f.id === flag.id ? { ...f, status: 'PASS' } : f
          )
        );

        // Refresh compliance score
        try {
          const scoreData = await getComplianceScore();
          setComplianceScore(scoreData.score || scoreData);
        } catch (err) {
          console.error('Failed to refresh compliance score:', err);
        }

        // Announce remediation to screen readers
        const announcement = document.getElementById('remediation-announcement');
        if (announcement) {
          announcement.textContent = `${flag.field} field has been remediated and now matches contract specifications`;
        }
      }
    } catch (err) {
      console.error('Remediation failed:', err);
      alert(`Failed to remediate: ${err.message}`);
    }
  }, [fieldData]);

  const handlePushToLive = useCallback(async () => {
    if (complianceScore === 100) {
      try {
        const result = await pushToLive();
        alert(result.message || 'Campaign pushed to live successfully!');
        // Optionally refresh data after push
        window.location.reload();
      } catch (err) {
        console.error('Push to live failed:', err);
        alert(`Failed to push to live: ${err.message}`);
      }
    }
  }, [complianceScore]);

  const handleNodeUpdate = useCallback((node) => {
    // Handle node interaction if needed
    console.log('Node updated:', node);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green mx-auto mb-4"></div>
          <p className="text-gray-400">Loading staging area...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center max-w-md">
          <div className="text-accent-red text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Using fallback data. Make sure your backend is running at{' '}
            {import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-dark-bg overflow-hidden">
      {/* ARIA live regions for screen reader announcements */}
      <div
        id="compliance-announcement"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
      <div
        id="remediation-announcement"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      <Header complianceScore={complianceScore} />

      <div className="flex flex-1 overflow-hidden">
        <AuditSidebar flags={flags} onRemediate={handleRemediate} />

        <div className="flex-1 relative">
          <AnimatePresence>
            <NodeWorkspace
              contractData={contractData}
              fieldData={fieldData}
              onNodeUpdate={handleNodeUpdate}
              connectionStatus={connectionStatus}
            />
          </AnimatePresence>
        </div>
      </div>

      <PushToLiveButton
        complianceScore={complianceScore}
        onPush={handlePushToLive}
      />
    </div>
  );
}

export default App;

