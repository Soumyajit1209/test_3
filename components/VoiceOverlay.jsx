"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Mic, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

function AudioSphere({ frequency }) {
  const meshRef = useRef();
  
  useEffect(() => {
    if (meshRef.current) {
      const scale = 1 + (frequency / 255) * 0.5;
      meshRef.current.scale.set(scale, scale, scale);
    }
  }, [frequency]);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhongMaterial 
        color="#ffffff"
        emissive="#000000"
        specular="#ffffff"
        shininess={100}
        wireframe={true}
      />
    </mesh>
  );
}

export function VoiceOverlay({ 
  isListening,
  stopListening,
  onClose, 
  onToggleListen,
  transcript,
  isProcessing,
  responseText 
}) {
  const [audioFrequency, setAudioFrequency] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (isListening) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          streamRef.current = stream; // Store the stream reference
          sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
          sourceRef.current.connect(analyserRef.current);
          
          const analyzeAudio = () => {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // Calculate average frequency
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioFrequency(average);
            
            animationFrameRef.current = requestAnimationFrame(analyzeAudio);
          };
          
          analyzeAudio();
        })
        .catch(err => console.error("Error accessing microphone:", err));
    }

    return () => {
      cleanupAudio();
    };
  }, [isListening]);

  // Function to cleanup and stop the microphone stream
  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {  // ✅ Now properly handled
      streamRef.current.getTracks().forEach(track => track.stop()); // Stop the microphone stream
      streamRef.current = null;
    }
  };
  // Handle overlay close
  const handleClose = () => {
    if (stopListening) {
      stopListening();
    }
    cleanupAudio();
    if (onClose) {
      onClose();
    }
  };
  


  return (
    <div 
      className={`fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300
        ${isListening || isProcessing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-4 right-4 text-foreground/60 hover:text-foreground"
        onClick={handleClose}
      >
        <X className="h-6 w-6" />
      </Button>
      
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
        <div className="w-64 h-64">
          <Canvas camera={{ position: [0, 0, 4] }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <AudioSphere frequency={audioFrequency} />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        </div>

        <div className="space-y-4 text-center">
          {transcript && (
            <p className="text-lg text-foreground/80 max-w-md">
              {transcript}
            </p>
          )}
          
          {responseText && (
            <p className="text-lg text-primary max-w-md">
              {responseText}
            </p>
          )}
          
          <p className="text-sm text-foreground/60">
            {isProcessing ? 'Processing...' : isListening ? 'Listening...' : 'Click to start'}
          </p>
        </div>

        <Button 
          size="lg" 
          className={`rounded-full w-16 h-16 ${isListening ? 'bg-destructive hover:bg-destructive/90' : ''}`}
          onClick={onToggleListen}
        >
          <Mic className={`h-8 w-8 ${isListening ? 'animate-pulse' : ''}`} />
        </Button>
      </div>
    </div>
  );
}