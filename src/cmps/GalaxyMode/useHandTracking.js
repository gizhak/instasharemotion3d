import { useState, useEffect, useRef, useCallback } from 'react';
import { GestureRecognizer, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

export function useHandTracking(videoRef, canvasRef, enabled = true) {
    const [gesture, setGesture] = useState(null); // 'Open_Palm', 'Closed_Fist', 'Victory', null
    const [handPosition, setHandPosition] = useState({ x: 0.5, y: 0.5 });
    const [isTracking, setIsTracking] = useState(false);
    const [fingerCount, setFingerCount] = useState(0);
    const [swipeDirection, setSwipeDirection] = useState(null); // 'left', 'right', null
    const [isHandInFrame, setIsHandInFrame] = useState(false);
    const [handEdgeWarning, setHandEdgeWarning] = useState(null); // 'left', 'right', 'top', 'bottom', null
    const [debugInfo, setDebugInfo] = useState({ delegate: null, error: null, fps: 0, lastDetection: null }); // For debugging
    const frameCountRef = useRef(0);
    const lastFpsUpdateRef = useRef(Date.now());

    const gestureRecognizerRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastVideoTimeRef = useRef(-1);
    const noHandFrameCountRef = useRef(0);

    // For swipe detection
    const lastVictoryPositionRef = useRef(null);
    const swipeThreshold = 0.08; // Lower threshold for easier swipe detection
    const swipeCooldownRef = useRef(false);
    const positionHistoryRef = useRef([]); // Track position history for smoother detection

    // Edge detection thresholds
    const edgeThreshold = 0.12; // 12% from edge triggers warning

    // Count extended fingers based on landmarks
    const countFingers = useCallback((landmarks) => {
        if (!landmarks || landmarks.length < 21) return 0;

        let count = 0;

        // Thumb - check if tip is to the side of the knuckle
        const thumbTip = landmarks[4];
        const thumbKnuckle = landmarks[2];
        if (Math.abs(thumbTip.x - thumbKnuckle.x) > 0.05) count++;

        // Index finger - tip above pip joint
        if (landmarks[8].y < landmarks[6].y) count++;

        // Middle finger
        if (landmarks[12].y < landmarks[10].y) count++;

        // Ring finger
        if (landmarks[16].y < landmarks[14].y) count++;

        // Pinky
        if (landmarks[20].y < landmarks[18].y) count++;

        return count;
    }, []);

    // Check for Victory/Peace sign (exactly 2 fingers - index and middle)
    const isVictorySign = useCallback((landmarks) => {
        if (!landmarks || landmarks.length < 21) return false;

        // Index and middle should be up
        const indexUp = landmarks[8].y < landmarks[6].y;
        const middleUp = landmarks[12].y < landmarks[10].y;

        // Ring and pinky should be down
        const ringDown = landmarks[16].y > landmarks[14].y;
        const pinkyDown = landmarks[20].y > landmarks[18].y;

        return indexUp && middleUp && ringDown && pinkyDown;
    }, []);

    // Check if hand is near edge of frame
    const checkHandEdge = useCallback((landmarks) => {
        if (!landmarks || landmarks.length < 21) return null;

        const wrist = landmarks[0];
        const x = wrist.x;
        const y = wrist.y;

        // Check edges (remember x is mirrored later, so left/right are swapped)
        if (x < edgeThreshold) return 'right'; // Will be mirrored to right
        if (x > 1 - edgeThreshold) return 'left'; // Will be mirrored to left
        if (y < edgeThreshold) return 'top';
        if (y > 1 - edgeThreshold) return 'bottom';

        return null;
    }, []);

    // Detect swipe while in Victory pose - improved detection
    const detectSwipe = useCallback((currentX, isVictory) => {
        if (!isVictory) {
            lastVictoryPositionRef.current = null;
            positionHistoryRef.current = [];
            return null;
        }

        if (swipeCooldownRef.current) {
            return null;
        }

        // Add current position to history
        positionHistoryRef.current.push({ x: currentX, time: Date.now() });

        // Keep only last 10 positions (about 300ms of data at 30fps)
        if (positionHistoryRef.current.length > 10) {
            positionHistoryRef.current.shift();
        }

        // Need at least 3 positions to detect swipe
        if (positionHistoryRef.current.length < 3) {
            return null;
        }

        // Calculate movement from oldest to newest position in our window
        const oldest = positionHistoryRef.current[0];
        const newest = positionHistoryRef.current[positionHistoryRef.current.length - 1];
        const deltaX = newest.x - oldest.x;
        const deltaTime = newest.time - oldest.time;

        // Check if movement is fast enough (velocity-based detection)
        const velocity = Math.abs(deltaX) / (deltaTime / 1000); // units per second

        // Trigger swipe if: movement exceeds threshold OR velocity is high enough
        if (Math.abs(deltaX) > swipeThreshold || (velocity > 0.3 && Math.abs(deltaX) > 0.05)) {
            const direction = deltaX > 0 ? 'right' : 'left';

            // Clear history after successful swipe
            positionHistoryRef.current = [];

            // Set cooldown to prevent rapid firing
            swipeCooldownRef.current = true;
            setTimeout(() => {
                swipeCooldownRef.current = false;
            }, 300); // 300ms cooldown between swipes

            return direction;
        }

        return null;
    }, []);

    useEffect(() => {
        if (!enabled) return;

        let mounted = true;

        const initializeGestureRecognizer = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
                );

                // Detect if mobile device
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const isAndroid = /Android/i.test(navigator.userAgent);

                // Try GPU first, fallback to CPU if it fails (for Android compatibility)
                let recognizer;
                const createRecognizer = async (delegate) => {
                    return await GestureRecognizer.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
                            delegate: delegate
                        },
                        runningMode: 'VIDEO',
                        numHands: 1,
                        minHandDetectionConfidence: 0.3,  // Lower threshold for better detection
                        minHandPresenceConfidence: 0.3,   // Lower threshold
                        minTrackingConfidence: 0.3        // Lower threshold
                    });
                };

                try {
                    // On Android, try CPU first as it's often more reliable
                    if (isAndroid) {
                        try {
                            recognizer = await createRecognizer('CPU');
                            console.log('Android: Gesture recognizer initialized with CPU');
                            setDebugInfo({ delegate: 'CPU (Android)', error: null });
                        } catch (cpuError) {
                            console.warn('CPU failed on Android, trying GPU:', cpuError);
                            recognizer = await createRecognizer('GPU');
                            console.log('Android: Gesture recognizer initialized with GPU');
                            setDebugInfo({ delegate: 'GPU (Android)', error: null });
                        }
                    } else {
                        // On other devices, try GPU first
                        try {
                            recognizer = await createRecognizer('GPU');
                            console.log('Gesture recognizer initialized with GPU');
                            setDebugInfo({ delegate: 'GPU', error: null });
                        } catch (gpuError) {
                            console.warn('GPU delegate failed, falling back to CPU:', gpuError);
                            recognizer = await createRecognizer('CPU');
                            console.log('Gesture recognizer initialized with CPU');
                            setDebugInfo({ delegate: 'CPU', error: null });
                        }
                    }
                } catch (error) {
                    console.error('All delegates failed:', error);
                    setDebugInfo({ delegate: 'FAILED', error: error.message });
                    return;
                }

                if (mounted) {
                    gestureRecognizerRef.current = recognizer;
                    startCamera();
                }
            } catch (error) {
                console.error('Failed to initialize gesture recognizer:', error);
            }
        };

        const startCamera = async () => {
            try {
                // Try different camera constraints for better mobile compatibility
                const constraints = {
                    video: {
                        facingMode: 'user',
                        width: { ideal: 640, max: 1280 },
                        height: { ideal: 480, max: 720 },
                        frameRate: { ideal: 30, max: 30 }
                    }
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);

                if (videoRef.current && mounted) {
                    videoRef.current.srcObject = stream;

                    // Get actual video settings for debugging
                    const videoTrack = stream.getVideoTracks()[0];
                    const settings = videoTrack.getSettings();
                    console.log('Camera settings:', settings);
                    setDebugInfo(prev => ({
                        ...prev,
                        resolution: `${settings.width}x${settings.height}`
                    }));

                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play().then(() => {
                            console.log('Video playing, dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
                            // Wait a bit for video to stabilize on mobile
                            setTimeout(() => {
                                setIsTracking(true);
                                predictWebcam();
                            }, 500);
                        }).catch(err => {
                            console.error('Video play error:', err);
                            setDebugInfo(prev => ({ ...prev, error: 'Play failed' }));
                        });
                    };
                }
            } catch (error) {
                console.error('Failed to access camera:', error);
                setDebugInfo(prev => ({ ...prev, error: error.message }));
            }
        };

        const predictWebcam = () => {
            if (!mounted || !videoRef.current || !gestureRecognizerRef.current) {
                return;
            }

            const video = videoRef.current;

            if (video.currentTime !== lastVideoTimeRef.current && video.readyState >= 2) {
                lastVideoTimeRef.current = video.currentTime;

                let results;
                try {
                    results = gestureRecognizerRef.current.recognizeForVideo(
                        video,
                        performance.now()
                    );

                    // Update FPS counter
                    frameCountRef.current++;
                    const now = Date.now();
                    if (now - lastFpsUpdateRef.current >= 1000) {
                        setDebugInfo(prev => ({
                            ...prev,
                            fps: frameCountRef.current,
                            hasResults: results?.landmarks?.length > 0
                        }));
                        frameCountRef.current = 0;
                        lastFpsUpdateRef.current = now;
                    }
                } catch (recognitionError) {
                    console.warn('Recognition error:', recognitionError);
                    setDebugInfo(prev => ({ ...prev, error: 'Recognition failed' }));
                    if (mounted) {
                        animationFrameRef.current = requestAnimationFrame(predictWebcam);
                    }
                    return;
                }

                try {
                    // Clear canvas
                    if (canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d');
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    }

                    // Check if hand is detected
                    if (results.landmarks && results.landmarks.length > 0) {
                        noHandFrameCountRef.current = 0;
                        setIsHandInFrame(true);

                        // Draw landmarks on canvas
                        if (canvasRef.current) {
                            const ctx = canvasRef.current.getContext('2d');
                            const drawingUtils = new DrawingUtils(ctx);
                            for (const landmarks of results.landmarks) {
                                drawingUtils.drawConnectors(
                                    landmarks,
                                    GestureRecognizer.HAND_CONNECTIONS,
                                    { color: '#00FF00', lineWidth: 2 }
                                );
                                drawingUtils.drawLandmarks(landmarks, {
                                    color: '#FF0000',
                                    lineWidth: 1,
                                    radius: 3
                                });
                            }
                        }

                        const landmarks = results.landmarks[0];

                        // Check if hand is near edge
                        const edgeWarning = checkHandEdge(landmarks);
                        setHandEdgeWarning(edgeWarning);

                        // Get hand center position (use average of index and middle finger for Victory pose)
                        let currentX = 0.5;
                        if (landmarks && landmarks.length > 0) {
                            const indexTip = landmarks[8]; // Index finger tip
                            const middleTip = landmarks[12]; // Middle finger tip
                            const wrist = landmarks[0];
                            // Use average of both fingers for swipe detection (more stable)
                            currentX = 1 - ((indexTip.x + middleTip.x) / 2); // Mirror x
                            setHandPosition({ x: 1 - wrist.x, y: wrist.y });
                        }

                        // Count fingers
                        const fingers = countFingers(landmarks);
                        setFingerCount(fingers);

                        // Process gestures
                        if (results.gestures && results.gestures.length > 0) {
                            const gesture = results.gestures[0][0];

                            // Check for victory sign (2 fingers)
                            const isVictory = isVictorySign(landmarks);

                            if (isVictory) {
                                setGesture('Victory');

                                // Detect swipe while in Victory pose
                                const swipe = detectSwipe(currentX, true);
                                if (swipe) {
                                    setSwipeDirection(swipe);
                                    // Clear swipe direction after a short delay
                                    setTimeout(() => setSwipeDirection(null), 100);
                                }
                            } else {
                                // Reset swipe tracking when not in Victory pose
                                detectSwipe(currentX, false);

                                if (gesture.score > 0.5) {
                                    setGesture(gesture.categoryName);
                                } else {
                                    setGesture(null);
                                }
                            }
                        } else {
                            setGesture(null);
                        }
                    } else {
                        // No hand detected
                        noHandFrameCountRef.current++;

                        // After 10 frames without hand, mark as out of frame
                        if (noHandFrameCountRef.current > 10) {
                            setIsHandInFrame(false);
                            setHandEdgeWarning(null);
                        }

                        setGesture(null);
                        setFingerCount(0);
                        lastVictoryPositionRef.current = null;
                    }
                } catch (processingError) {
                    console.warn('Processing error:', processingError);
                }
            }

            if (mounted) {
                animationFrameRef.current = requestAnimationFrame(predictWebcam);
            }
        };

        initializeGestureRecognizer();

        return () => {
            mounted = false;
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (gestureRecognizerRef.current) {
                gestureRecognizerRef.current.close();
            }
        };
    }, [enabled, videoRef, canvasRef, countFingers, isVictorySign, detectSwipe, checkHandEdge]);

    return {
        gesture,
        handPosition,
        isTracking,
        fingerCount,
        swipeDirection,
        isHandInFrame,
        handEdgeWarning,
        debugInfo
    };
}
