import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const TestShader = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    console.log('TestShader: Initializing...');
    
    try {
      // Test basic Three.js functionality
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const renderer = new THREE.WebGLRenderer({ alpha: true });
      
      renderer.setSize(200, 200);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      // Simple colored plane
      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x8B5CF6, 
        transparent: true, 
        opacity: 0.3 
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      renderer.render(scene, camera);
      console.log('TestShader: Rendered successfully!');

      return () => {
        container.removeChild(renderer.domElement);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    } catch (error) {
      console.error('TestShader error:', error);
    }
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        zIndex: 1000, 
        border: '2px solid red' 
      }}
    />
  );
};

export default TestShader;