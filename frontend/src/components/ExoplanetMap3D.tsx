import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Exoplanet {
  id: number;
  name: string;
  classification: string;
  coordinates: {
    rightAscension: number;
    declination: number;
  };
  radius: number;
  orbitalPeriod: number;
  discoveryYear: number;
  mission: string;
}

interface ExoplanetMap3DProps {
  exoplanets: Exoplanet[];
  onExoplanetClick: (exoplanet: Exoplanet) => void;
  selectedClassification: string;
}

const ExoplanetMap3D: React.FC<ExoplanetMap3DProps> = ({
  exoplanets,
  onExoplanetClick,
  selectedClassification
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<any>();
  const animationRef = useRef<number>();
  const exoplanetMeshesRef = useRef<THREE.Mesh[]>([]);
  const starFieldRef = useRef<THREE.Points>();
  const exoplanetGroupRef = useRef<THREE.Group>();
  
  const [hoveredExoplanet, setHoveredExoplanet] = useState<Exoplanet | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  

  // Convert astronomical coordinates to 3D position
  const convertTo3DPosition = (ra: number, dec: number, radius: number = 100) => {
    // Convert RA (0-360) and Dec (-90 to 90) to spherical coordinates
    const phi = (dec + 90) * (Math.PI / 180); // 0 to PI
    const theta = ra * (Math.PI / 180); // 0 to 2PI
    
    // Convert to Cartesian coordinates
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
  };

  // Create exoplanet mesh
  const createExoplanetMesh = (exoplanet: Exoplanet) => {
    const size = Math.max(2, Math.min(8, exoplanet.radius * 2)); // Hacer los puntos más grandes
    let color = 0x6B7280; // Default gray
    
    switch (exoplanet.classification) {
      case 'exoplanet':
        color = 0x10B981; // Green
        break;
      case 'candidate':
        color = 0xFDE047; // Yellow
        break;
      case 'false_positive':
        color = 0xEF4444; // Red
        break;
    }
    
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshLambertMaterial({ 
      color,
      emissive: color,
      emissiveIntensity: 0.3 // Más brillante
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position the exoplanet
    const position = convertTo3DPosition(
      exoplanet.coordinates.rightAscension,
      exoplanet.coordinates.declination
    );
    mesh.position.copy(position);
    
    // Store exoplanet data
    (mesh as any).exoplanetData = exoplanet;
    
    return mesh;
  };

  // Create star field with fixed seed for consistent generation
  const createStarField = () => {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    
    // Fixed seed for consistent star generation
    const seed = 12345; // Fixed seed
    
    // Simple seeded random function
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    let currentSeed = seed;
    
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Use seeded random for consistent positions
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const random1 = currentSeed / 233280;
      
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const random2 = currentSeed / 233280;
      
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const random3 = currentSeed / 233280;
      
      // Fixed positions on sphere
      const radius = 150 + random1 * 50;
      const phi = Math.acos(2 * random2 - 1);
      const theta = 2 * Math.PI * random3;
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi);
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8
    });
    
    return new THREE.Points(starGeometry, starMaterial);
  };

  // Initialize Three.js scene (only once)
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011); // Dark blue space
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 200);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add star field
    const starField = createStarField();
    scene.add(starField);
    starFieldRef.current = starField;

    // Create a group to hold all exoplanets for unified rotation
    const exoplanetGroup = new THREE.Group();
    scene.add(exoplanetGroup);
    exoplanetGroupRef.current = exoplanetGroup;

    // Mouse controls
    let isMouseDown = false;
    let mouseX = 0, mouseY = 0;
    let targetRotationX = 0, targetRotationY = 0;
    let rotationX = 0, rotationY = 0;

    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault(); // Prevent default mouse behavior
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseUp = () => {
      isMouseDown = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;
      
      event.preventDefault(); // Prevent default mouse behavior
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.01;
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault(); // Prevent page scroll
      event.stopPropagation(); // Stop event bubbling
      
      const zoomSpeed = 5;
      camera.position.z += event.deltaY * zoomSpeed;
      camera.position.z = Math.max(50, Math.min(300, camera.position.z));
    };

    // Raycaster for exoplanet selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      // Prevent camera dragging when clicking on exoplanets
      event.stopPropagation();
      
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(exoplanetMeshesRef.current);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh;
        const exoplanetData = (clickedMesh as any).exoplanetData;
        onExoplanetClick(exoplanetData);
        return; // Don't allow camera movement
      }
    };

    // Hover effect
    const handleMouseMoveForHover = (event: MouseEvent) => {
      if (isMouseDown) return; // Don't interfere with dragging
      
      event.preventDefault(); // Prevent default mouse behavior
      
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update mouse position for tooltip
      setMousePosition({ x: event.clientX, y: event.clientY });

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(exoplanetMeshesRef.current);

      // Reset all exoplanets to normal size
      exoplanetMeshesRef.current.forEach(mesh => {
        mesh.scale.set(1, 1, 1);
      });

      // Highlight hovered exoplanet
      if (intersects.length > 0) {
        const hoveredMesh = intersects[0].object as THREE.Mesh;
        hoveredMesh.scale.set(1.5, 1.5, 1.5); // Make it bigger
        renderer.domElement.style.cursor = 'pointer';
        
        // Set hovered exoplanet for tooltip
        const exoplanetData = (hoveredMesh as any).exoplanetData;
        setHoveredExoplanet(exoplanetData);
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredExoplanet(null);
      }
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousemove', handleMouseMoveForHover);
    renderer.domElement.addEventListener('wheel', handleWheel);
    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Smooth rotation
      rotationX += (targetRotationX - rotationX) * 0.05;
      rotationY += (targetRotationY - rotationY) * 0.05;
      
      // Auto-rotation when not interacting
      if (!isMouseDown) {
        rotationY += 0.002;
      }
      
      // Apply rotation to star field and exoplanet group together
      if (starFieldRef.current) {
        starFieldRef.current.rotation.x = rotationX;
        starFieldRef.current.rotation.y = rotationY;
      }
      
      // Rotate the entire exoplanet group together
      if (exoplanetGroupRef.current) {
        exoplanetGroupRef.current.rotation.x = rotationX;
        exoplanetGroupRef.current.rotation.y = rotationY;
      }
      
      // Individual exoplanet rotation (just for visual effect)
      exoplanetMeshesRef.current.forEach(mesh => {
        mesh.rotation.z += 0.01;
      });
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mousemove', handleMouseMoveForHover);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('click', handleClick);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, []); // Solo se ejecuta una vez al montar el componente

  // Update exoplanets when data changes
  useEffect(() => {
    if (!sceneRef.current || !exoplanetGroupRef.current) return;

    // Clear existing exoplanets
    exoplanetGroupRef.current.clear();
    exoplanetMeshesRef.current = [];

    // Add new exoplanets
    exoplanets.forEach(exoplanet => {
      if (selectedClassification === 'all' || exoplanet.classification === selectedClassification) {
        const mesh = createExoplanetMesh(exoplanet);
        exoplanetGroupRef.current!.add(mesh);
        exoplanetMeshesRef.current.push(mesh);
      }
    });
  }, [exoplanets, selectedClassification]);


  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mountRef} 
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ background: 'radial-gradient(circle, #000011 0%, #000000 100%)' }}
      />
      
      {/* Controls info */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span>Confirmados</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span>Candidatos</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span>Falsos Positivos</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-300">
          <div>🖱️ Arrastra para rotar</div>
          <div>🎯 Haz clic en exoplaneta</div>
          <div>🔍 Scroll para zoom</div>
        </div>
      </div>
      
      {/* Tooltip con nombre del exoplaneta */}
      {hoveredExoplanet && (
        <div 
          className="fixed z-[9999] pointer-events-none bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg border border-space-blue/30"
          style={{
            left: mousePosition.x - 60,
            top: mousePosition.y - 30,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              hoveredExoplanet.classification === 'exoplanet' ? 'bg-green-400' :
              hoveredExoplanet.classification === 'candidate' ? 'bg-yellow-400' :
              'bg-red-400'
            }`}></div>
            <span>{hoveredExoplanet.name}</span>
          </div>
          <div className="text-xs text-gray-300 mt-1">
            {hoveredExoplanet.classification === 'exoplanet' ? 'Exoplaneta Confirmado' :
             hoveredExoplanet.classification === 'candidate' ? 'Candidato' :
             'Falso Positivo'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExoplanetMap3D;
