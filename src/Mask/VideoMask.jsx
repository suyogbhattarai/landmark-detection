import React, { useRef, useEffect } from 'react';
import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs';

const VideoMask = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

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

        const applyMask = async () => {
            const net = await bodyPix.load();
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            const detect = async () => {
                // Perform segmentation with improved parameters
                const segmentation = await net.segmentPerson(video, {
                    flipHorizontal: false,
                    internalResolution: 'full',
                    segmentationThreshold: 0.6,
                    outputStride:8
                });

                // Create mask
                const mask = bodyPix.toMask(segmentation);

                // Optionally apply post-processing (like denoising, blurring, etc.)

                // Draw the video and the mask on the canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                ctx.putImageData(mask, 0, 0);

                requestAnimationFrame(detect);
            };

            detect();
        };

        setupCamera().then(applyMask);
    }, []);

    return (
        <>
            <video ref={videoRef} width="640" height="480" style={{ display: 'none' }} autoPlay muted />
            <canvas ref={canvasRef} width="1280" height="960" />
        </>
    );
};

export default VideoMask;
