import React, { useRef, useEffect } from 'react';
import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs';
import * as THREE from 'three';

const VideoMask2 = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const threeRef = useRef({});

    useEffect(() => {
        const setupCamera = async () => {
            const video = videoRef.current;
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            await new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    resolve(video);
                };
            });
            video.play();
        };

        const setupThreeJS = () => {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, 1280 / 960, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
            renderer.setSize(1280, 960);
            camera.position.z = 5;

            // Reduce particle count for performance
            const particleCount = 5000; // Adjust particle count as needed
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);

            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] = (Math.random() - 0.5) * 4; // Scale to fit wider range
                positions[i * 3 + 1] = (Math.random() - 0.5) * 4; // Scale to fit wider range
                positions[i * 3 + 2] = (Math.random() - 0.5) * 2; // Slightly random depth

                // Random colors for each particle
                colors[i * 3] = Math.random();
                colors[i * 3 + 1] = Math.random();
                colors[i * 3 + 2] = Math.random();
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            // Set a smaller size for the particles to make them more dot-like
            const material = new THREE.PointsMaterial({ size: 0.02, vertexColors: true }); // Smaller size for dots
            const pointCloud = new THREE.Points(geometry, material);
            scene.add(pointCloud);

            threeRef.current = { scene, camera, renderer, geometry, positions, pointCloud };
        };

        const applyMask = async () => {  
            const net = await bodyPix.load(); // Load the BodyPix model
            const video = videoRef.current;

            const detect = async () => {
                const segmentation = await net.segmentPerson(video, {
                    flipHorizontal: false,
                    internalResolution: 'medium', // Use 'medium' for better performance
                    segmentationThreshold: 0.6,
                });

                // Get the mask
                const mask = bodyPix.toMask(segmentation);
                const maskData = new Uint8Array(mask.data);
                const particleCount = threeRef.current.geometry.attributes.position.count;

                for (let i = 0; i < particleCount; i++) {
                    const x = Math.floor(Math.random() * mask.width);
                    const y = Math.floor(Math.random() * mask.height);
                    const index = (y * mask.width + x) * 4; // Get the pixel index
                    const alpha = maskData[index + 3]; // Get the alpha value

                    // If the pixel is transparent (outside the body), update particle position
                    if (alpha === 0) {
                        const pos = threeRef.current.geometry.attributes.position.array;
                        pos[i * 3] = (x / mask.width) * 4 - 2; // Normalize and scale to fit wider range
                        pos[i * 3 + 1] = -(y / mask.height) * 4 + 2; // Invert Y and normalize, scale to fit wider range
                        pos[i * 3 + 2] = (Math.random() - 0.5) * 2; // Randomize depth for a more 3D effect
                    }
                }

                // Mark positions for update
                threeRef.current.geometry.attributes.position.needsUpdate = true;

                // Render the updated scene
                threeRef.current.renderer.render(threeRef.current.scene, threeRef.current.camera);
            };

            const throttledDetect = () => {
                // Run detect at a lower frequency
                setTimeout(() => {
                    detect(); // Start the detection loop
                    throttledDetect(); // Call itself for next frame
                }, 100); // Update every 100ms (10 FPS)
            };

            throttledDetect(); // Start the throttled detection loop
        };

        setupCamera().then(() => {
            setupThreeJS();
            applyMask();
        });
    }, []);

    return (
        <>
            <video ref={videoRef} width="640" height="480" autoPlay muted style={{ display: 'none' }} />
            <canvas ref={canvasRef} width="1280" height="960" />
        </>
    );
};

export default VideoMask2;
