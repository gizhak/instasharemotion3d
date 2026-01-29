import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
    Stars,
    OrbitControls,
    PerspectiveCamera,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

// Photo card component that floats in space
function PhotoCard({ photo, index, totalPhotos, gesture, handPosition, onSelect, isSelected }) {
    const meshRef = useRef();
    const frameRef = useRef();
    const starRef = useRef(); // For star mode
    const [hovered, setHovered] = useState(false);
    const currentScale = useRef(0.06); // Start as star size
    const currentPosition = useRef(new THREE.Vector3());
    const currentOpacity = useRef(0); // Start with photo hidden
    const starOpacity = useRef(1); // Start with star visible
    const twinklePhase = useRef(Math.random() * Math.PI * 2); // Random phase for twinkling

    // Load texture
    const texture = useMemo(() => {
        const loader = new THREE.TextureLoader();
        const tex = loader.load(photo.imgUrl);
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        return tex;
    }, [photo.imgUrl]);

    // Calculate spiral galaxy position - use fixed seed for consistent positions
    const basePosition = useMemo(() => {
        const angle = (index / totalPhotos) * Math.PI * 6; // 3 full spirals
        const radius = 8 + (index / totalPhotos) * 20; // Expanding radius
        const height = Math.sin(index * 1.5) * 4;

        return new THREE.Vector3(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
    }, [index, totalPhotos]);

    // Dispersed position for zoom out - spread across the galaxy
    const dispersedPosition = useMemo(() => {
        const seed = index * 12345;
        const pseudoRandom = (n) => {
            const x = Math.sin(seed + n) * 10000;
            return x - Math.floor(x);
        };
        // Spread them more widely like stars
        const angle = pseudoRandom(1) * Math.PI * 4;
        const radius = 10 + pseudoRandom(2) * 45;
        const height = (pseudoRandom(3) - 0.5) * 20;

        return new THREE.Vector3(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
    }, [index]);

    // Initialize position
    useEffect(() => {
        currentPosition.current.copy(basePosition);
    }, [basePosition]);

    // Star color - realistic distant star colors (white-blue tint, slightly different from background)
    const starColor = useMemo(() => {
        const colors = [
            new THREE.Color(0xffffff), // Pure white
            new THREE.Color(0xeeeeff), // Slight blue-white
            new THREE.Color(0xddddff), // Light blue-white
            new THREE.Color(0xccddff), // Soft blue
            new THREE.Color(0xffeedd), // Warm white (rare)
        ];
        return colors[index % colors.length];
    }, [index]);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        const isZoomOut = gesture === 'Open_Palm';
        const isZoomIn = gesture === 'Closed_Fist';

        // Target position based on gesture
        const targetPosition = isZoomOut ? dispersedPosition : basePosition;

        // Very smooth position transition
        currentPosition.current.lerp(targetPosition, delta * 1.2);
        meshRef.current.position.copy(currentPosition.current);

        // Rotate card to face camera
        meshRef.current.lookAt(state.camera.position);

        // Calculate target scale and opacity based on gesture
        let targetScale, targetPhotoOpacity, targetStarOpacity;

        if (isZoomIn) {
            // Zoom in - photos are big and visible
            targetScale = 2.5;
            targetPhotoOpacity = 1;
            targetStarOpacity = 0;
        } else {
            // Default and Zoom out - photos are tiny stars
            targetScale = 0.06; // Very small like stars
            targetPhotoOpacity = 0; // Hide photo texture
            targetStarOpacity = 1; // Show star
        }

        // Apply hover/selection effects only when zoomed in
        if (isZoomIn) {
            targetScale = isSelected ? targetScale * 1.5 : (hovered ? targetScale * 1.15 : targetScale);
        }

        // Smooth transitions
        currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, delta * 2);
        currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, targetPhotoOpacity, delta * 3);
        starOpacity.current = THREE.MathUtils.lerp(starOpacity.current, targetStarOpacity, delta * 3);

        meshRef.current.scale.setScalar(currentScale.current);

        // Update photo material opacity
        if (meshRef.current.material) {
            meshRef.current.material.opacity = currentOpacity.current;
        }

        // Update frame
        if (frameRef.current) {
            frameRef.current.scale.setScalar(currentScale.current);
            frameRef.current.position.copy(currentPosition.current);
            frameRef.current.lookAt(state.camera.position);
            frameRef.current.material.opacity = currentOpacity.current * 0.95;
        }

        // Update star with twinkling effect
        if (starRef.current) {
            starRef.current.position.copy(currentPosition.current);

            // Twinkling effect - faster and more varied
            const twinkle = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 4 + twinklePhase.current);
            const twinkle2 = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2.5 + twinklePhase.current * 1.5);
            const combinedTwinkle = (twinkle + twinkle2) / 2;

            // Stars are visible when NOT zoomed in
            const showStar = !isZoomIn;
            const starSize = showStar ? (0.15 + combinedTwinkle * 0.1) : 0.01;
            starRef.current.scale.setScalar(starSize);

            if (starRef.current.material) {
                starRef.current.material.opacity = starOpacity.current * (0.6 + combinedTwinkle * 0.4);
            }
        }
    });

    // Photo size
    const photoSize = 3.5;
    const frameSize = photoSize + 0.4;

    return (
        <group>
            {/* Star representation (visible when zoomed out) */}
            <mesh ref={starRef} position={basePosition}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshBasicMaterial
                    color={starColor}
                    transparent
                    opacity={1}
                />
            </mesh>

            {/* White frame/border behind photo for better visibility */}
            <mesh
                ref={frameRef}
                position={basePosition}
            >
                <planeGeometry args={[frameSize, frameSize]} />
                <meshBasicMaterial
                    color="#ffffff"
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0}
                />
            </mesh>

            {/* Photo */}
            <mesh
                ref={meshRef}
                position={basePosition}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={() => onSelect(photo, index)}
            >
                <planeGeometry args={[photoSize, photoSize]} />
                <meshBasicMaterial
                    map={texture}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0}
                />
            </mesh>
        </group>
    );
}

// Galaxy particles (stars in the background) - controlled by hand
function GalaxyParticles({ count = 8000, handPosition, gesture }) {
    const points = useRef();
    const currentRotationY = useRef(0);
    const currentRotationX = useRef(0);

    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            // Spiral galaxy distribution
            const angle = Math.random() * Math.PI * 4;
            const radius = Math.random() * 50 + 5;
            const height = (Math.random() - 0.5) * 10 * (1 - radius / 55);

            positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 5;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 5;

            // Color variation (blue to purple to white)
            const colorChoice = Math.random();
            if (colorChoice < 0.3) {
                // Blue stars
                colors[i * 3] = 0.5 + Math.random() * 0.3;
                colors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
                colors[i * 3 + 2] = 1;
            } else if (colorChoice < 0.6) {
                // Purple stars
                colors[i * 3] = 0.7 + Math.random() * 0.3;
                colors[i * 3 + 1] = 0.4 + Math.random() * 0.3;
                colors[i * 3 + 2] = 1;
            } else {
                // White/yellow stars
                colors[i * 3] = 1;
                colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
                colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
            }
        }

        return { positions, colors };
    }, [count]);

    useFrame((state, delta) => {
        if (!points.current) return;

        // Control rotation based on hand position when gesture is active
        if (gesture === 'Open_Palm' || gesture === 'Closed_Fist') {
            // Map hand position to rotation target
            const targetRotationY = (handPosition.x - 0.5) * Math.PI * 1.5;
            const targetRotationX = (handPosition.y - 0.5) * Math.PI * 0.3;

            // Very smooth rotation towards target (slower lerp)
            currentRotationY.current = THREE.MathUtils.lerp(
                currentRotationY.current,
                targetRotationY,
                delta * 1.5
            );
            currentRotationX.current = THREE.MathUtils.lerp(
                currentRotationX.current,
                targetRotationX,
                delta * 1.5
            );

            points.current.rotation.y = currentRotationY.current;
            points.current.rotation.x = currentRotationX.current;
        } else {
            // Slow auto rotation when no gesture
            currentRotationY.current += delta * 0.03;
            points.current.rotation.y = currentRotationY.current;
        }
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particlesPosition.positions.length / 3}
                    array={particlesPosition.positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={particlesPosition.colors.length / 3}
                    array={particlesPosition.colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.12}
                vertexColors
                transparent
                opacity={0.7}
                sizeAttenuation
            />
        </points>
    );
}

// Camera controller that responds to hand gestures
function CameraController({ gesture, handPosition }) {
    const { camera } = useThree();
    const controlsRef = useRef();
    const currentDistance = useRef(45);
    const currentAzimuth = useRef(0);
    const currentPolar = useRef(Math.PI / 3);

    // Calculate zoom based on gesture and hand Y position for "diving" effect
    const getTargetZoom = () => {
        if (gesture === 'Closed_Fist') {
            return 25; // Zoom in closer to see photos
        }
        if (gesture === 'Open_Palm') {
            // Hand Y position controls dive depth (higher hand = further away, lower hand = diving in)
            // Inverted: moving hand down (higher Y value) = diving closer
            const diveDepth = handPosition.y; // 0 to 1
            const minZoom = 30; // Closest when diving
            const maxZoom = 80; // Furthest when zoomed out
            return maxZoom - (diveDepth * (maxZoom - minZoom));
        }
        return 45; // Default
    };

    useFrame((state, delta) => {
        if (!controlsRef.current) return;

        const targetZoom = getTargetZoom();

        // Smooth zoom (slower lerp for stability)
        currentDistance.current = THREE.MathUtils.lerp(
            currentDistance.current,
            targetZoom,
            delta * 1.5
        );

        // Control camera angle based on hand position when gesture is active
        if (gesture === 'Open_Palm' || gesture === 'Closed_Fist') {
            // Map hand X position to camera orbit (horizontal movement)
            const targetAzimuth = (handPosition.x - 0.5) * Math.PI * 1.5;
            // For Open_Palm, polar angle also follows Y for diving feeling
            const targetPolar = gesture === 'Open_Palm'
                ? Math.PI / 4 + handPosition.y * Math.PI * 0.3
                : Math.PI / 3 + (handPosition.y - 0.5) * Math.PI * 0.3;

            // Smooth camera movement (slower for stability)
            currentAzimuth.current = THREE.MathUtils.lerp(
                currentAzimuth.current,
                targetAzimuth,
                delta * 1.5
            );
            currentPolar.current = THREE.MathUtils.lerp(
                currentPolar.current,
                targetPolar,
                delta * 1.5
            );

            controlsRef.current.autoRotate = false;
        } else {
            // Slow auto rotation when no gesture
            currentAzimuth.current += delta * 0.1;
            controlsRef.current.autoRotate = false;
        }

        // Update camera position based on spherical coordinates
        const radius = currentDistance.current;
        camera.position.x = radius * Math.sin(currentPolar.current) * Math.cos(currentAzimuth.current);
        camera.position.y = radius * Math.cos(currentPolar.current);
        camera.position.z = radius * Math.sin(currentPolar.current) * Math.sin(currentAzimuth.current);

        camera.lookAt(0, 0, 0);
        controlsRef.current.update();
    });

    return (
        <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            minDistance={15}
            maxDistance={100}
            enableDamping
            dampingFactor={0.1}
            rotateSpeed={0.3}
        />
    );
}

// Main scene component
export function GalaxyScene({ photos, gesture, handPosition, onPhotoSelect, selectedPhotoIndex }) {
    const handleSelect = (photo, index) => {
        onPhotoSelect(photo);
    };

    // Adjust lighting based on gesture - brighter overall
    const ambientIntensity = gesture === 'Closed_Fist' ? 1.2 : 0.8;

    return (
        <Canvas
            camera={{ position: [0, 20, 45], fov: 60 }}
            style={{ background: '#000000' }}
            gl={{ antialias: true }}
        >
            <PerspectiveCamera makeDefault position={[0, 20, 45]} />

            {/* Strong ambient lighting for photo visibility */}
            <ambientLight intensity={ambientIntensity} />

            {/* Directional light for even illumination */}
            <directionalLight position={[0, 10, 10]} intensity={1} color="#ffffff" />
            <directionalLight position={[0, -10, -10]} intensity={0.5} color="#ffffff" />

            {/* Colored accent lights */}
            <pointLight position={[0, 0, 0]} intensity={1} color="#8844ff" />
            <pointLight position={[30, 15, 30]} intensity={0.8} color="#4488ff" />
            <pointLight position={[-30, -15, -30]} intensity={0.8} color="#ff44aa" />

            {/* Background stars */}
            <Stars
                radius={100}
                depth={50}
                count={3000}
                factor={3}
                saturation={0}
                fade
                speed={0.3}
            />

            {/* Galaxy particle system - controlled by hand */}
            <GalaxyParticles count={5000} handPosition={handPosition} gesture={gesture} />

            {/* Photo cards */}
            {photos.map((photo, index) => (
                <PhotoCard
                    key={photo._id || index}
                    photo={photo}
                    index={index}
                    totalPhotos={photos.length}
                    gesture={gesture}
                    handPosition={handPosition}
                    onSelect={handleSelect}
                    isSelected={selectedPhotoIndex === index}
                />
            ))}

            {/* Camera controls */}
            <CameraController gesture={gesture} handPosition={handPosition} />

            {/* Post-processing effects */}
            <EffectComposer>
                <Bloom
                    intensity={gesture === 'Open_Palm' ? 0.6 : (gesture === 'Closed_Fist' ? 0.3 : 0.4)}
                    luminanceThreshold={0.3}
                    luminanceSmoothing={0.9}
                />
                <Vignette eskil={false} offset={0.1} darkness={0.4} />
            </EffectComposer>
        </Canvas>
    );
}
