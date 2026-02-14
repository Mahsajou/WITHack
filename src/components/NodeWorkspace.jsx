import React, { useCallback, useRef, useEffect } from 'react';
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
import { motion } from 'framer-motion';

const nodeTypes = {
  contract: ContractNode,
  field: FieldNode,
};

const NodeWorkspace = ({
  contractData,
  fieldData,
  onNodeUpdate,
  connectionStatus,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const pulseIntervalRef = useRef(null);

  // Initialize nodes and edges
  useEffect(() => {
    const initialNodes = [
      {
        id: 'contract',
        type: 'contract',
        position: { x: 100, y: 250 },
        data: contractData,
      },
      ...fieldData.map((field, index) => ({
        id: `field-${field.fieldType}`,
        type: 'field',
        position: { x: 500 + index * 250, y: 150 + index * 150 },
        data: {
          ...field,
          fieldType: field.fieldType,
        },
      })),
    ];

    const initialEdges = fieldData.map((field) => ({
      id: `edge-${field.fieldType}`,
      source: 'contract',
      target: `field-${field.fieldType}`,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: connectionStatus[field.fieldType] === 'FAIL' ? '#e50914' : '#00d4aa',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: connectionStatus[field.fieldType] === 'FAIL' ? '#e50914' : '#00d4aa',
      },
    }));

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [contractData, fieldData, connectionStatus, setNodes, setEdges]);

  // Animated data pulse effect
  useEffect(() => {
    const pulseEdges = () => {
      setEdges((eds) =>
        eds.map((edge) => {
          const isFailing = connectionStatus[edge.target.replace('field-', '')] === 'FAIL';
          return {
            ...edge,
            style: {
              ...edge.style,
              stroke: isFailing ? '#e50914' : '#00d4aa',
            },
            markerEnd: {
              ...edge.markerEnd,
              color: isFailing ? '#e50914' : '#00d4aa',
            },
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
  }, [connectionStatus, setEdges]);

  const onNodeClick = useCallback(
    (event, node) => {
      if (node.type === 'field') {
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
      >
        <Background color="#2d2d2d" gap={16} />
        <Controls className="bg-dark-surface border-dark-border" />
        <MiniMap
          className="bg-dark-surface border-dark-border"
          nodeColor={(node) => {
            if (node.type === 'contract') return '#00d4aa';
            const status = node.data?.status;
            if (status === 'FAIL') return '#e50914';
            if (status === 'WARN') return '#ffa500';
            return '#00d4aa';
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default NodeWorkspace;

