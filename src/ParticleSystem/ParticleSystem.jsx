import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ParticleSystem = ({ landmarks }) => {
  const particleCount = 33; // Assuming 33 landmarks for the human body
  const particlesPerLandmark = 100; // Number of particles per landmark
  const particles = useRef(new Float32Array(particleCount * particlesPerLandmark * 3)).current;
  const colors = useRef(new Float32Array(particleCount * particlesPerLandmark * 3)).current;
  const particleGeometry = useRef(new THREE.BufferGeometry()).current;

  useEffect(() => {
    const particleMaterial = new THREE.PointsMaterial({ size: 0.05, vertexColors: true });
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particles, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    // Return the particle system to the caller (add to the scene in parent)
    return particleSystem;
  }, [particles, colors]);

  useEffect(() => {
    if (landmarks.length > 0) {
      updateParticlesWithLandmarks(landmarks[0]);
    }
  }, [landmarks]);

  const updateParticlesWithLandmarks = (landmarks) => {
    // Reset particle positions and colors
    for (let i = 0; i < particleCount * particlesPerLandmark; i++) {
      particles[i * 3] = 0; // x
      particles[i * 3 + 1] = 0; // y
      particles[i * 3 + 2] = 0; // z

      // Set random colors
      colors[i * 3] = Math.random(); // Red
      colors[i * 3 + 1] = Math.random(); // Green
      colors[i * 3 + 2] = Math.random(); // Blue
    }

    for (let i = 0; i < landmarks.length; i++) {
      const baseX = (landmarks[i].x - 0.5) * 10; // Convert to 3D space
      const baseY = (0.5 - landmarks[i].y) * 10; // Convert to 3D space
      const baseZ = (landmarks[i].z || 0) * 5; // Use Z if available, else default to 0

      for (let j = 0; j < particlesPerLandmark; j++) {
        const angle = Math.random() * Math.PI * 2; // Random angle
        const radius = Math.random() * 0.2; // Random radius to spread particles

        const x = baseX + radius * Math.cos(angle);
        const y = baseY + radius * Math.sin(angle);
        const z = baseZ + (Math.random() * 0.1 - 0.05); // Slight random offset in Z direction

        const particleIndex = (i * particlesPerLandmark + j);
        particles[particleIndex * 3] = x;
        particles[particleIndex * 3 + 1] = y;
        particles[particleIndex * 3 + 2] = z;
      }
    }

    // Mark geometry as needing an update
    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.color.needsUpdate = true;
  };

  return null; // This component does not render any JSX; it operates in the 3D scene directly
};

export default ParticleSystem;
