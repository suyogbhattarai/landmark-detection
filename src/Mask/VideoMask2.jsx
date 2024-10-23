import React, { useRef, useEffect } from 'react';
import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs';
import * as THREE from 'three';

const VideoMask2 = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const maskCanvasRef = useRef(null);
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
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.position.z = 5;

            const particleCount = 100000; 
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);

            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] = (Math.random() - 0.5) * 4; 
                positions[i * 3 + 1] = (Math.random() - 0.5) * 4; 
                positions[i * 3 + 2] = (Math.random() - 0.5) * 2; 

                colors[i * 3] = Math.random();
                colors[i * 3 + 1] = Math.random();
                colors[i * 3 + 2] = Math.random();
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const material = new THREE.PointsMaterial({ size: 0.001, vertexColors: true });
            const pointCloud = new THREE.Points(geometry, material);
            scene.add(pointCloud);

            threeRef.current = { scene, camera, renderer, geometry, positions, pointCloud };
        };

        const displayMask = (maskData, width, height) => {
            const maskCanvas = maskCanvasRef.current;
            const ctx = maskCanvas.getContext('2d');
            maskCanvas.width = width;
            maskCanvas.height = height;

            const imageData = ctx.createImageData(width, height);
            for (let i = 0; i < maskData.length; i += 4) {
                const alpha = maskData[i + 3]; 
                imageData.data[i] = alpha; 
                imageData.data[i + 1] = alpha; 
                imageData.data[i + 2] = alpha; 
                imageData.data[i + 3] = 255; 
            }

            ctx.putImageData(imageData, 0, 0);
        };

        const applyMask = async () => {
            const net = await bodyPix.load(); 
            const video = videoRef.current;

            const detect = async () => {
                const segmentation = await net.segmentPerson(video, {
                    flipHorizontal: false,
                    internalResolution: 'medium',
                    segmentationThreshold: 0.6,
                });

                const mask = bodyPix.toMask(segmentation);
                const maskData = new Uint8Array(mask.data);
                const particleCount = threeRef.current.geometry.attributes.position.count;

                displayMask(maskData, mask.width, mask.height); // Display mask on the canvas

                for (let i = 0; i < particleCount; i++) {
                    const x = Math.floor(Math.random() * mask.width);
                    const y = Math.floor(Math.random() * mask.height);
                    const index = (y * mask.width + x) * 4;
                    const alpha = maskData[index + 3]; 

                    if (alpha === 0) {
                        const pos = threeRef.current.geometry.attributes.position.array;
                        pos[i * 3] = (x / mask.width) * 4 - 2; 
                        pos[i * 3 + 1] = -(y / mask.height) * 4 + 2; 
                        pos[i * 3 + 2] = (Math.random() - 0.5) * 2; 
                    }
                }

                threeRef.current.geometry.attributes.position.needsUpdate = true;
                threeRef.current.renderer.render(threeRef.current.scene, threeRef.current.camera);
            };

            const throttledDetect = () => {
                setTimeout(() => {
                    detect();
                    throttledDetect();
                }, 600);
            };

            throttledDetect();
        };

        setupCamera().then(() => {
            setupThreeJS();
            applyMask();
        });

        const handleResize = () => {
            threeRef.current.renderer.setSize(window.innerWidth, window.innerHeight);
            threeRef.current.camera.aspect = window.innerWidth / window.innerHeight;
            threeRef.current.camera.updateProjectionMatrix();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <>
            <video ref={videoRef} style={{ display: 'none' }} />
            <canvas
                ref={canvasRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'black',
                    zIndex: 1,
                }}
            />
            <canvas
                ref={maskCanvasRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 0, 
                }}
            />
        </>
    );
};

export default VideoMask2;
