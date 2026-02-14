import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import AuditSidebar from './components/AuditSidebar';
import StrategyMirrorSidebar from './components/StrategyMirrorSidebar';
import NodeWorkspace from './components/NodeWorkspace';
import PushToLiveButton from './components/PushToLiveButton';
import {
  getContractData,
  getCampaignFields,
  getAuditFlags,
  getComplianceScore,
  remediateField,
  pushToLive,
  getAudienceData,
  getOptimizationData,
  getCreativeData,
  getCopyData,
  getTemporalData,
  getStrategicGaps,
} from './services/api';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [complianceScore, setComplianceScore] = useState(0);
  const [flags, setFlags] = useState([]);
  const [strategicGaps, setStrategicGaps] = useState([]);
  const [isFixingAll, setIsFixingAll] = useState(false);
  const [fixAllTrigger, setFixAllTrigger] = useState(0);
  
  // Contract and Field data
  const [contractData, setContractData] = useState({ fields: {} });
  const [fieldData, setFieldData] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState({});
  
  // New node data
  const [audienceData, setAudienceData] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);
  const [creativeData, setCreativeData] = useState(null);
  const [copyData, setCopyData] = useState(null);
  const [temporalData, setTemporalData] = useState(null);

  // Fetch node data from backend
  useEffect(() => {
    const fetchNodeData = async () => {
      try {
        const [audience, optimization, creative, copy, temporal, gaps] = await Promise.all([
          getAudienceData().catch(() => null),
          getOptimizationData().catch(() => null),
          getCreativeData().catch(() => null),
          getCopyData().catch(() => null),
          getTemporalData().catch(() => null),
          getStrategicGaps().catch(() => []),
        ]);

        if (audience) setAudienceData(audience);
        if (optimization) setOptimizationData(optimization);
        if (creative) setCreativeData(creative);
        if (copy) setCopyData(copy);
        if (temporal) setTemporalData(temporal);
        if (gaps) setStrategicGaps(gaps);
      } catch (err) {
        console.error('Failed to fetch node data:', err);
        // Fallback to mock data
        setAudienceData({
          status: 'FAIL',
          hasSeverance: true,
          contractAge: '25-35',
          setupAge: '18-24',
          interests: ['Technology', 'Gaming', 'Entertainment'],
          geos: ['US', 'CA', 'UK'],
        });
        setOptimizationData({
          status: 'FAIL',
          contractGoal: 'ROAS 4.0',
          setupGoal: 'CPC (Traffic)',
        });
        setCreativeData({
          status: 'PASS',
          type: 'image',
          thumbnail: 'https://via.placeholder.com/200x150/00d4aa/ffffff?text=Creative',
          talentRights: 'Active',
          metadata: {
            format: 'JPG',
            size: '2.4 MB',
            dimensions: '1920x1080',
          },
        });
        setCopyData({
          status: 'FAIL',
          headline: 'Get 50% Off Today Only!',
          body: 'Limited time offer. Act now before it\'s too late. Terms and conditions apply.',
          violations: ['Missing disclaimer', 'Unsubstantiated claim'],
        });
        setTemporalData({
          status: 'WARN',
          contractStart: '2024-01-01',
          contractEnd: '2024-12-31',
          setupStart: '2024-01-15',
          setupEnd: '2025-01-05',
        });
        setStrategicGaps([
          {
            message: 'Target audience age range (18-24) is broader than contract specification (25-35). Severance required.',
            remediation: 'Adjust age targeting to match contract range',
          },
          {
            message: 'The setup is optimized for Traffic (CPC), but the contract guarantees Sales (ROAS 4.0). Remediation required.',
            remediation: 'Change optimization goal from CPC to ROAS target',
          },
        ]);
      }
    };

    fetchNodeData();
  }, []);

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
        // Fallback to mock data
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

      const score = Math.round(
        ((passCount * 100 + warnCount * 50) / totalFlags) || 0
      );
      setComplianceScore(score);
    }
  }, [flags, complianceScore]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Cmd+R or Ctrl+R for remediation
      if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
        event.preventDefault();
        if (strategicGaps.length > 0 && !isFixingAll) {
          handleFixAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [strategicGaps, isFixingAll]);

  // Announce compliance score changes to screen readers
  useEffect(() => {
    const announcement = document.getElementById('compliance-announcement');
    if (announcement) {
      announcement.textContent = `Compliance score updated to ${complianceScore} percent`;
    }
  }, [complianceScore]);

  const handleRemediate = useCallback(async (flag) => {
    try {
      const result = await remediateField(flag.id, flag.field);

      const fieldIndex = fieldData.findIndex(
        (f) => f.fieldType === flag.field
      );

      if (fieldIndex !== -1) {
        const updatedFieldData = [...fieldData];
        const field = updatedFieldData[fieldIndex];

        updatedFieldData[fieldIndex] = {
          ...field,
          value: result.value || field.expected || field.value,
          status: 'PASS',
          remediatedAt: Date.now(),
        };

        setFieldData(updatedFieldData);
        setConnectionStatus((prev) => ({
          ...prev,
          [flag.field]: 'PASS',
        }));
        setFlags((prevFlags) =>
          prevFlags.map((f) =>
            f.id === flag.id ? { ...f, status: 'PASS' } : f
          )
        );

        try {
          const scoreData = await getComplianceScore();
          setComplianceScore(scoreData.score || scoreData);
        } catch (err) {
          console.error('Failed to refresh compliance score:', err);
        }

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

  const handleFixAll = useCallback(async () => {
    setIsFixingAll(true);
    setFixAllTrigger(Date.now()); // Trigger animation

    try {
      // Remediate all failing flags
      const failingFlags = flags.filter((f) => f.status === 'FAIL');
      const remediationPromises = failingFlags.map((flag) =>
        remediateField(flag.id, flag.field).catch((err) => {
          console.error(`Failed to remediate ${flag.field}:`, err);
          return null;
        })
      );

      await Promise.all(remediationPromises);

      // Fix audience severance
      if (audienceData?.hasSeverance) {
        setAudienceData((prev) => ({
          ...prev,
          status: 'PASS',
          hasSeverance: false,
          setupAge: prev.contractAge,
        }));
      }

      // Fix optimization
      if (optimizationData?.status === 'FAIL') {
        setOptimizationData((prev) => ({
          ...prev,
          status: 'PASS',
          setupGoal: prev.contractGoal,
        }));
      }

      // Fix copy violations
      if (copyData?.violations?.length > 0) {
        setCopyData((prev) => ({
          ...prev,
          status: 'PASS',
          violations: [],
        }));
      }

      // Update strategic gaps
      setStrategicGaps([]);

      // Refresh compliance score
      try {
        const scoreData = await getComplianceScore();
        setComplianceScore(scoreData.score || scoreData);
      } catch (err) {
        console.error('Failed to refresh compliance score:', err);
      }

      // Announce to screen readers
      const announcement = document.getElementById('remediation-announcement');
      if (announcement) {
        announcement.textContent = 'All issues have been remediated';
      }
    } catch (err) {
      console.error('Fix All failed:', err);
      alert(`Failed to fix all issues: ${err.message}`);
    } finally {
      setTimeout(() => {
        setIsFixingAll(false);
      }, 2000);
    }
  }, [flags, audienceData, optimizationData, copyData]);

  const handlePushToLive = useCallback(async () => {
    if (complianceScore === 100) {
      try {
        const result = await pushToLive();
        alert(result.message || 'Campaign pushed to live successfully!');
        window.location.reload();
      } catch (err) {
        console.error('Push to live failed:', err);
        alert(`Failed to push to live: ${err.message}`);
      }
    }
  }, [complianceScore]);

  const handleNodeUpdate = useCallback((node) => {
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
            {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-dark-bg overflow-hidden">
      {/* ARIA live regions */}
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
              audienceData={audienceData}
              optimizationData={optimizationData}
              creativeData={creativeData}
              copyData={copyData}
              temporalData={temporalData}
              onNodeUpdate={handleNodeUpdate}
              connectionStatus={connectionStatus}
              onFixAllTrigger={fixAllTrigger}
            />
          </AnimatePresence>
        </div>

        <StrategyMirrorSidebar
          strategicGaps={strategicGaps}
          onFixAll={handleFixAll}
          isFixing={isFixingAll}
        />
      </div>

      <PushToLiveButton
        complianceScore={complianceScore}
        onPush={handlePushToLive}
      />
    </div>
  );
}

export default App;
