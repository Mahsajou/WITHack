'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  Connection,
  Edge,
  Background,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, AlertTriangle, Play, ShieldCheck, RefreshCcw } from 'lucide-react';
import { auditCampaign, rerunAudit, publishCampaign } from '../lib/api';

// --- Custom Node Components ---

const Header = ({ title, status }: { title: string; status?: string }) => {
  const getIcon = () => {
    switch (status) {
      case 'PASS': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'FAIL': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'WARN': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default: return null;
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 border-b border-gray-100 ${status === 'FAIL' ? 'bg-red-50' : ''}`}>
      <span className="text-xs font-bold tracking-wider text-slate-800 uppercase">{title}</span>
      {getIcon()}
    </div>
  );
};

const ContractNode = ({ data }: any) => (
  <div className="bg-white border-2 border-blue-600 rounded-lg shadow-xl w-64 overflow-hidden">
    <div className="bg-blue-600 p-3 text-white flex items-center gap-2">
      <ShieldCheck className="w-5 h-5" />
      <span className="font-bold text-sm uppercase">Source: Sales Contract</span>
    </div>
    <div className="p-4 bg-white">
      <p className="text-xs text-slate-500 mb-1 font-bold">CLIENT</p>
      <p className="text-lg font-bold text-slate-900">{data.client_name}</p>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-blue-600 font-bold tracking-tighter uppercase">
        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
        Live Enforcement Active
      </div>
    </div>
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-600" />
  </div>
);

const PillarNode = ({ data }: any) => {
  const borderClass = data.status === 'FAIL' ? 'border-l-4 border-red-600' : 'border-l-4 border-emerald-600';
  
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm w-64 overflow-hidden ${borderClass} transition-all hover:shadow-md`}>
      <Header title={data.label} status={data.status} />
      <div className="p-4">
        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{data.fieldLabel}</div>
        <div className="text-xs font-medium text-slate-800">{data.value}</div>
        
        {data.status === 'FAIL' && (
           <div className="mt-3">
             <div className="text-[9px] text-red-600 font-bold mb-1 italic uppercase">Violation Detected</div>
             <p className="text-[10px] text-slate-600 leading-tight">{data.message}</p>
             <button 
              onClick={() => data.onRemediate(data.pillarKey)}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-[10px] font-bold py-2 rounded hover:bg-slate-800 transition-colors uppercase tracking-widest"
             >
               <RefreshCcw className="w-3 h-3" />
               Remediate
             </button>
           </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-gray-300" />
    </div>
  );
};

const nodeTypes = {
  contractNode: ContractNode,
  pillarNode: PillarNode,
};

// --- Main Component ---

const initialCampaignData = {
  campaign_name: 'Nike_Valentine_Campaign_v1',
  audience: {
    geo_targeting: ['USA', 'UK'], // FAIL (UK not allowed)
    demographic: ['Male', 'Female'],
    contextual: 'Valentine gifting season'
  },
  optimization: {
    placement: 'Social Media Feed', // FAIL (Must be PMP)
    frequency_cap: '5 views per user'
  },
  creative: {
    format: '1080p',
    compliance_standard: 'IAB Standard'
  },
  copy: {
    ad_copy_text: 'Get 50% discount on cheap shoes now!' // FAIL (Forbidden keywords: Cheap, Discount)
  },
  timeframe: {
    start_date: '2026-02-09',
    end_date: '2026-02-14'
  },
  budget: {
    daily_budget: 400000,
    total_days: 10 // FAIL (Total $4M > $2M limit)
  }
};

export default function CampaignStagingCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [report, setReport] = useState<any>(null);
  const [isCertified, setIsCertified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [animatingPillar, setAnimatingPillar] = useState<string | null>(null);

  const buildNodes = useCallback((reportData: any) => {
    const newNodes: any[] = [
      {
        id: 'contract',
        type: 'contractNode',
        position: { x: 50, y: 300 },
        data: { client_name: 'Nike' }
      }
    ];

    const pillars = [
      { key: 'Audience', label: 'Audience', field: 'geo_targeting', fLabel: 'Geo Targeting' },
      { key: 'Budget', label: 'Budget', field: 'total_spend', fLabel: 'Total Spend' },
      { key: 'Timeframe', label: 'Timeframe', field: 'start_date', fLabel: 'Start Date' },
      { key: 'Optimization', label: 'Optimization', field: 'placement', fLabel: 'Placement' },
      { key: 'Creative', label: 'Creative', field: 'format', fLabel: 'Format' },
      { key: 'Copy', label: 'Copy', field: 'ad_copy_text', fLabel: 'Ad Copy' },
      { key: 'Guardrails', label: 'Guardrails', field: 'legal', fLabel: 'Legal Terms' },
    ];

    pillars.forEach((p, idx) => {
      const pData = reportData.pillars[p.key];
      newNodes.push({
        id: p.key,
        type: 'pillarNode',
        position: { x: 450, y: 50 + idx * 100 },
        data: {
          label: p.label,
          status: pData.status,
          pillarKey: p.key,
          fieldLabel: p.fLabel,
          value: p.key === 'Budget' ? '$4,000,000' : pData.status === 'PASS' ? 'Compliant' : 'Violation',
          message: pData.issues?.[0] || 'Verification needed.',
          onRemediate: handleRemediate
        }
      });
    });

    setNodes(newNodes);

    const newEdges = pillars.map(p => ({
      id: `e-contract-${p.key}`,
      source: 'contract',
      target: p.key,
      animated: reportData.pillars[p.key].status === 'PASS',
      style: { stroke: '#D1D5DB' }
    }));
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  const runInitialAudit = async () => {
    setLoading(true);
    try {
      const data = await auditCampaign('CNT-NIKE-VALENTINE', initialCampaignData);
      setReport(data);
      setIsCertified(data.is_certified);
      buildNodes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    runInitialAudit();
  }, []);

  const handleRemediate = async (pillarKey: string) => {
    setAnimatingPillar(pillarKey);
    
    // Define the fixes for our simulation
    const fixes: any = {
      'Audience': { audience: { geo_targeting: ['USA'] } },
      'Budget': { budget: { daily_budget: 200000, total_days: 6 } },
      'Optimization': { optimization: { placement: 'Premium/Direct/Programmatic PMP' } },
      'Copy': { copy: { ad_copy_text: 'The best athletic gear for your Valentine.' } },
      'Timeframe': { timeframe: { start_date: '2026-02-09' } }
    };

    setTimeout(async () => {
      try {
        const update = fixes[pillarKey];
        if (update) {
          const newData = await rerunAudit('CNT-NIKE-VALENTINE', 'Nike_Valentine_Campaign_v1', update);
          setReport(newData);
          setIsCertified(newData.is_certified);
          buildNodes(newData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setAnimatingPillar(null);
      }
    }, 1500); // Simulate "Particle Animation" delay
  };

  const handlePublish = async () => {
    try {
      await publishCampaign('Nike_Valentine_Campaign_v1');
      alert("SUCCESS: Campaign is now LIVE on servers.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 font-mono">
      <div className="flex flex-col items-center">
        <RefreshCcw className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Initializing Audit Canvas...</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#F9FAFB] flex flex-col font-sans antialiased">
      {/* Surgical Precision Header */}
      <header className="h-20 border-b border-gray-200 bg-white flex items-center justify-between px-10 shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">SetSync AI <span className="text-blue-600">Staging Canvas</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Autonomous Compliance Layer • v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Logic Score</span>
            <span className={`text-2xl font-black ${report.is_certified ? 'text-emerald-600' : 'text-red-600'}`}>
              {report.is_certified ? '100' : '45'}/100
            </span>
          </div>
          
          <button 
            disabled={!isCertified}
            onClick={handlePublish}
            className={`px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all ${
              isCertified 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
            }`}
          >
            {isCertified ? 'Publish to Live' : 'Certification Required'}
          </button>
        </div>
      </header>

      {/* Main Flow Area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          panOnDrag={false}
          zoomOnScroll={false}
          draggable={false}
        >
          <Background color="#E5E7EB" gap={20} size={1} />
        </ReactFlow>

        {/* Pulse Animation Simulation Overlay */}
        <AnimatePresence>
          {animatingPillar && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center z-10"
            >
               <div className="bg-blue-600/10 w-full h-full animate-pulse" />
               <div className="absolute top-1/2 left-1/4 flex flex-col items-center">
                 <p className="text-[10px] font-bold text-blue-600 uppercase mb-4 animate-bounce">Recalibrating Pillar: {animatingPillar}...</p>
                 <div className="w-1 h-20 bg-gradient-to-b from-blue-600 to-transparent" />
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <footer className="h-12 border-t border-gray-200 bg-white flex items-center justify-between px-10 shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <div>System Status: <span className="text-emerald-500">Healthy</span></div>
        <div>Last Scanned: {mounted ? new Date().toLocaleTimeString() : '--:--:--'}</div>
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Agentic Reasoning Active
        </div>
      </footer>
    </div>
  );
}
