import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { GalaxyScene } from './GalaxyScene';
import { useHandTracking } from './useHandTracking';
import './GalaxyMode.css';

export function GalaxyMode({ isOpen, onClose }) {
    const posts = useSelector((storeState) => storeState.postModule.posts);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
    const [showWelcome, setShowWelcome] = useState(true);
    const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
    const [isPhotoViewMode, setIsPhotoViewMode] = useState(false);

    const { gesture, handPosition, isTracking, fingerCount, swipeDirection, isHandInFrame, handEdgeWarning } = useHandTracking(
        videoRef,
        canvasRef,
        isOpen && cameraPermissionGranted
    );

    const photos = posts.filter(post => post.imgUrl);

    // Enter photo view mode when Victory gesture is detected
    useEffect(() => {
        if (gesture === 'Victory' && !isPhotoViewMode && photos.length > 0) {
            setIsPhotoViewMode(true);
            if (selectedPhotoIndex === null) {
                setSelectedPhotoIndex(0);
            }
        } else if (gesture !== 'Victory' && isPhotoViewMode) {
            const timer = setTimeout(() => {
                if (gesture !== 'Victory') {
                    setIsPhotoViewMode(false);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [gesture, isPhotoViewMode, photos.length, selectedPhotoIndex]);

    // Handle swipe for photo navigation
    useEffect(() => {
        if (swipeDirection && isPhotoViewMode && photos.length > 0) {
            if (swipeDirection === 'right') {
                setSelectedPhotoIndex(prev =>
                    prev === null ? 0 : (prev + 1) % photos.length
                );
            } else if (swipeDirection === 'left') {
                setSelectedPhotoIndex(prev =>
                    prev === null ? photos.length - 1 : (prev - 1 + photos.length) % photos.length
                );
            }
        }
    }, [swipeDirection, isPhotoViewMode, photos.length]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (isPhotoViewMode) {
                    setIsPhotoViewMode(false);
                } else if (!showWelcome) {
                    onClose();
                }
            }
            if (isPhotoViewMode && photos.length > 0) {
                if (e.key === 'ArrowRight') {
                    setSelectedPhotoIndex(prev =>
                        prev === null ? 0 : (prev + 1) % photos.length
                    );
                } else if (e.key === 'ArrowLeft') {
                    setSelectedPhotoIndex(prev =>
                        prev === null ? photos.length - 1 : (prev - 1 + photos.length) % photos.length
                    );
                }
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose, isPhotoViewMode, photos.length, showWelcome]);

    // Reset state when closing
    useEffect(() => {
        if (!isOpen) {
            setSelectedPhotoIndex(null);
            setIsPhotoViewMode(false);
            setShowWelcome(true);
            setCameraPermissionGranted(false);
        }
    }, [isOpen]);

    const handleStartExperience = () => {
        setCameraPermissionGranted(true);
        setShowWelcome(false);
    };

    if (!isOpen) return null;

    const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

    return (
        <div className="galaxy-mode-overlay">
            {/* Welcome Screen */}
            {showWelcome && (
                <div className="welcome-overlay">
                    <div className="welcome-content">
                        <div className="welcome-header">
                            <h1>Galaxy Mode</h1>
                            <p className="welcome-subtitle">Explore your photos in an immersive 3D galaxy</p>
                        </div>

                        <div className="welcome-features">
                            <div className="feature-item camera-notice">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                </div>
                                <div className="feature-text">
                                    <strong>Camera Required</strong>
                                    <p>We'll use your camera to track hand gestures</p>
                                </div>
                            </div>

                            <div className="feature-item">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 22c1-2 4-4 4-8a4 4 0 0 0-8 0c0 4 3 6 4 8z" />
                                        <circle cx="12" cy="13" r="1" />
                                        <path d="M7 10c-1.5-1-2.5-2.5-2.5-4.5a4.5 4.5 0 0 1 9 0" />
                                        <path d="M17 10c1.5-1 2.5-2.5 2.5-4.5a4.5 4.5 0 0 0-9 0" />
                                    </svg>
                                </div>
                                <div className="feature-text">
                                    <strong>Closed Fist</strong>
                                    <p>Zoom in to reveal your photos</p>
                                </div>
                            </div>

                            <div className="feature-item">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
                                        <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
                                        <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
                                        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                                    </svg>
                                </div>
                                <div className="feature-text">
                                    <strong>Open Palm</strong>
                                    <p>Navigate through the galaxy</p>
                                </div>
                            </div>

                            <div className="feature-item">
                                <div className="feature-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M8 14V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
                                        <path d="M12 10V2a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
                                        <path d="M12 10a2 2 0 1 1 4 0v2a2 2 0 1 1-4 0v-2z" />
                                        <path d="M4 14a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6v-2" />
                                        <path d="M18 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                                    </svg>
                                </div>
                                <div className="feature-text">
                                    <strong>Two Fingers + Swipe</strong>
                                    <p>Browse photos left and right</p>
                                </div>
                            </div>
                        </div>

                        <div className="welcome-actions">
                            <button className="start-btn" onClick={handleStartExperience}>
                                Start Experience
                            </button>
                            <button className="cancel-btn" onClick={onClose}>
                                Cancel
                            </button>
                        </div>

                        <p className="welcome-note">
                            Your camera feed stays on your device and is not stored or transmitted
                        </p>
                    </div>
                </div>
            )}

            {/* Main Galaxy Experience (only show after welcome) */}
            {!showWelcome && (
                <>
                    {/* Close button */}
                    <button className="galaxy-close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    {/* 3D Galaxy Scene */}
                    <div className="galaxy-canvas-container">
                        <GalaxyScene
                            photos={photos}
                            gesture={gesture}
                            handPosition={handPosition}
                            onPhotoSelect={(photo) => {
                                const index = photos.findIndex(p => p._id === photo._id);
                                setSelectedPhotoIndex(index);
                                setIsPhotoViewMode(true);
                            }}
                            selectedPhotoIndex={selectedPhotoIndex}
                        />
                    </div>

                    {/* Webcam preview (small) */}
                    <div className="webcam-preview">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="webcam-video"
                        />
                        <canvas
                            ref={canvasRef}
                            className="webcam-canvas"
                            width={320}
                            height={240}
                        />
                        {!isTracking && (
                            <div className="webcam-loading">
                                <span>Loading camera...</span>
                            </div>
                        )}
                    </div>

                    {/* Hand out of frame warning */}
                    {isTracking && !isHandInFrame && (
                        <div className="hand-warning hand-out">
                            <svg className="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>Hand not detected - Move hand into camera view</span>
                        </div>
                    )}

                    {/* Hand near edge warning */}
                    {isTracking && isHandInFrame && handEdgeWarning && (
                        <div className={`hand-warning hand-edge ${handEdgeWarning}`}>
                            <svg className="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            <span>
                                {handEdgeWarning === 'left' && 'Hand moving out left - Move right'}
                                {handEdgeWarning === 'right' && 'Hand moving out right - Move left'}
                                {handEdgeWarning === 'top' && 'Hand moving out top - Move down'}
                                {handEdgeWarning === 'bottom' && 'Hand moving out bottom - Move up'}
                            </span>
                        </div>
                    )}

                    {/* Gesture status indicator */}
                    <div className="gesture-status">
                        <div className={`status-indicator ${gesture ? 'active' : ''}`}>
                            {gesture === 'Closed_Fist' && (
                                <>
                                    <svg className="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M12 22c1-2 4-4 4-8a4 4 0 0 0-8 0c0 4 3 6 4 8z" />
                                        <circle cx="12" cy="13" r="1" />
                                    </svg>
                                    <span>Zoom In - Move hand to rotate</span>
                                </>
                            )}
                            {gesture === 'Open_Palm' && (
                                <>
                                    <svg className="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
                                        <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
                                        <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
                                        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                                    </svg>
                                    <span>Navigate - Move hand to explore</span>
                                </>
                            )}
                            {gesture === 'Victory' && (
                                <>
                                    <svg className="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M8 14V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
                                        <path d="M12 10V2a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
                                        <path d="M4 14a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6v-2" />
                                    </svg>
                                    <span>Photo Mode - Swipe to navigate</span>
                                </>
                            )}
                            {!gesture && isTracking && isHandInFrame && (
                                <>
                                    <svg className="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
                                        <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
                                        <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
                                        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                                    </svg>
                                    <span>Close fist to reveal photos</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Selected photo preview - Full screen carousel */}
                    {isPhotoViewMode && selectedPhoto && (
                        <div className="photo-viewer-overlay">
                            <button
                                className="photo-viewer-close"
                                onClick={() => setIsPhotoViewMode(false)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>

                            <button
                                className="photo-nav-btn prev"
                                onClick={() => setSelectedPhotoIndex(prev =>
                                    (prev - 1 + photos.length) % photos.length
                                )}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>

                            <div className="photo-viewer-content">
                                <img src={selectedPhoto.imgUrl} alt="Selected" />
                                {selectedPhoto.txt && (
                                    <div className="photo-caption">{selectedPhoto.txt}</div>
                                )}
                                <div className="photo-counter">
                                    {selectedPhotoIndex + 1} / {photos.length}
                                </div>
                            </div>

                            <button
                                className="photo-nav-btn next"
                                onClick={() => setSelectedPhotoIndex(prev =>
                                    (prev + 1) % photos.length
                                )}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>

                            <div className="swipe-hint">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
                                    <path d="M8 14V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
                                    <path d="M12 10V2a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
                                    <path d="M4 14a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6v-2" />
                                </svg>
                                Swipe left/right to navigate
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
