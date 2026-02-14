import React, { useCallback, useRef, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ContractNode from './ContractNode';
import FieldNode from './FieldNode';
import AudienceNode from './nodes/AudienceNode';
import OptimizationNode from './nodes/OptimizationNode';
import CreativeNode from './nodes/CreativeNode';
import CopyNode from './nodes/CopyNode';
import TemporalNode from './nodes/TemporalNode';
import { motion } from 'framer-motion';

const nodeTypes = {
  contract: ContractNode,
  field: FieldNode,
  audience: AudienceNode,
  optimization: OptimizationNode,
  creative: CreativeNode,
  copy: CopyNode,
  temporal: TemporalNode,
};

const NodeWorkspace = ({
  contractData,
  fieldData = [],
  audienceData,
  optimizationData,
  creativeData,
  copyData,
  temporalData,
  onNodeUpdate,
  connectionStatus = {},
  onFixAllTrigger,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const pulseIntervalRef = useRef(null);
  const [isPulsing, setIsPulsing] = useState(false);

  // Calculate positions in a radial layout around the Master Contract
  const getNodePositions = (centerX, centerY, radius, count) => {
    const positions = [];
    const angleStep = (2 * Math.PI) / count;
    
    for (let i = 0; i < count; i++) {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      positions.push({ x, y });
    }
    
    return positions;
  };

  // Initialize nodes and edges
  useEffect(() => {
    const centerX = 600;
    const centerY = 400;
    const radius = 350;

    // Master Contract node (center)
    const contractNode = {
      id: 'contract',
      type: 'contract',
      position: { x: centerX - 100, y: centerY - 100 },
      data: contractData,
    };

    // All sub-nodes
    const subNodes = [];
    const nodeConfigs = [
      { id: 'audience', type: 'audience', data: audienceData },
      { id: 'optimization', type: 'optimization', data: optimizationData },
      { id: 'creative', type: 'creative', data: creativeData },
      { id: 'copy', type: 'copy', data: copyData },
      { id: 'temporal', type: 'temporal', data: temporalData },
      ...fieldData.map((field) => ({
        id: `field-${field.fieldType}`,
        type: 'field',
        data: { ...field, fieldType: field.fieldType },
      })),
    ];

    const positions = getNodePositions(centerX, centerY, radius, nodeConfigs.length);
    
    nodeConfigs.forEach((config, index) => {
      subNodes.push({
        id: config.id,
        type: config.type,
        position: positions[index],
        data: config.data,
      });
    });

    // Create edges from Master Contract to all sub-nodes
    const initialEdges = subNodes.map((node) => {
      const nodeId = node.id;
      const nodeStatus = node.data?.status || connectionStatus[nodeId] || 'PASS';
      const hasSeverance = node.data?.hasSeverance || false;
      const isFailing = nodeStatus === 'FAIL' || hasSeverance;

      return {
        id: `edge-${nodeId}`,
        source: 'contract',
        target: nodeId,
        type: 'smoothstep',
        animated: !isFailing, // Don't animate failing connections
        style: {
          stroke: isFailing ? '#e50914' : '#00d4aa',
          strokeWidth: hasSeverance ? 3 : 2,
          strokeDasharray: hasSeverance ? '5,5' : undefined, // Dashed line for severance
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isFailing ? '#e50914' : '#00d4aa',
        },
        label: hasSeverance ? 'SEVERANCE' : undefined,
        labelStyle: hasSeverance ? { fill: '#e50914', fontWeight: 'bold' } : undefined,
      };
    });

    setNodes([contractNode, ...subNodes]);
    setEdges(initialEdges);
  }, [
    contractData,
    fieldData,
    audienceData,
    optimizationData,
    creativeData,
    copyData,
    temporalData,
    connectionStatus,
    setNodes,
    setEdges,
  ]);

  // Data pulse animation for Fix All
  useEffect(() => {
    if (onFixAllTrigger && onFixAllTrigger > 0) {
      setIsPulsing(true);
      
      // Animate all edges with pulses
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          animated: true,
          style: {
            ...edge.style,
            stroke: '#00d4aa',
            strokeWidth: 3,
          },
        }))
      );

      // Reset after animation
      setTimeout(() => {
        setIsPulsing(false);
        setEdges((eds) =>
          eds.map((edge) => {
            const nodeId = edge.target;
            const node = nodes.find((n) => n.id === nodeId);
            const nodeStatus = node?.data?.status || 'PASS';
            const isFailing = nodeStatus === 'FAIL';
            
            return {
              ...edge,
              animated: !isFailing,
              style: {
                ...edge.style,
                stroke: isFailing ? '#e50914' : '#00d4aa',
                strokeWidth: 2,
              },
            };
          })
        );
      }, 2000);
    }
  }, [onFixAllTrigger, setEdges, nodes]);

  // Animated data pulse effect for normal operation
  useEffect(() => {
    if (isPulsing) return; // Don't interfere with Fix All animation

    const pulseEdges = () => {
      setEdges((eds) =>
        eds.map((edge) => {
          const nodeId = edge.target;
          const node = nodes.find((n) => n.id === nodeId);
          const nodeStatus = node?.data?.status || connectionStatus[nodeId] || 'PASS';
          const hasSeverance = node?.data?.hasSeverance || false;
          const isFailing = nodeStatus === 'FAIL' || hasSeverance;

          return {
            ...edge,
            animated: !isFailing,
            style: {
              ...edge.style,
              stroke: isFailing ? '#e50914' : '#00d4aa',
              strokeWidth: hasSeverance ? 3 : 2,
              strokeDasharray: hasSeverance ? '5,5' : undefined,
            },
            markerEnd: {
              ...edge.markerEnd,
              color: isFailing ? '#e50914' : '#00d4aa',
            },
            label: hasSeverance ? 'SEVERANCE' : undefined,
            labelStyle: hasSeverance ? { fill: '#e50914', fontWeight: 'bold' } : undefined,
          };
        })
      );
    };

    pulseIntervalRef.current = setInterval(pulseEdges, 2000);
    return () => {
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
      }
    };
  }, [connectionStatus, setEdges, nodes, isPulsing]);

  const onNodeClick = useCallback(
    (event, node) => {
      if (node.type !== 'contract') {
        onNodeUpdate?.(node);
      }
    },
    [onNodeUpdate]
  );

  return (
    <div className="flex-1 bg-dark-bg" style={{ height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-dark-bg"
        style={{ background: '#121212' }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#2d2d2d" gap={16} />
        <Controls className="bg-dark-surface border-dark-border" />
        <MiniMap
          className="bg-dark-surface border-dark-border"
          nodeColor={(node) => {
            if (node.type === 'contract') return '#00d4aa';
            const status = node.data?.status;
            if (status === 'FAIL' || node.data?.hasSeverance) return '#e50914';
            if (status === 'WARN') return '#ffa500';
            return '#00d4aa';
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default NodeWorkspace;
