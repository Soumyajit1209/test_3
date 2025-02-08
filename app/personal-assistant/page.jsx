"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Phone,
  RefreshCw,
  Mic,
  Play,
  Square,
  RotateCcw,
  User,
  Bot,
  Send,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export default function AssistantPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [cloningProgress, setCloningProgress] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [responseAudio, setResponseAudio] = useState(null);
  const [userName, setUserName] = useState("");
  const [isNameSubmitted, setIsNameSubmitted] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [showRecordingGuide, setShowRecordingGuide] = useState(false);

  const { toast } = useToast();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioRef = useRef(null);

  const handleNameSubmit = async () => {
    if (!userName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your name",
      });
      return;
    }

    try {
      // Simulate API call - Replace with your actual backend call
      const response = await new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              message: `Welcome to azmth, ${userName}!`,
            }),
          1000
        )
      );

      setWelcomeMessage(response.message);
      setIsNameSubmitted(true);

      // Show recording guidance toast
      toast({
        title: "Let's record your voice",
        description:
          "Press the microphone button and read the text below for voice cloning.",
        duration: 5000,
      });

      setShowRecordingGuide(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your name. Please try again.",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        setAudioBlob(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      setupAudioVisualization(stream);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Failed to access microphone. Please check your permissions.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const setupAudioVisualization = (stream) => {
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");

    const draw = () => {
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;

      analyserRef.current.fftSize = 2048;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      const drawVisual = () => {
        animationFrameRef.current = requestAnimationFrame(drawVisual);
        analyserRef.current.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = "rgb(200, 200, 200)";
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "rgb(0, 0, 0)";
        canvasCtx.beginPath();

        const sliceWidth = (WIDTH * 1.0) / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * HEIGHT) / 2;

          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
      };

      drawVisual();
    };

    draw();
  };

  const handlePlayback = () => {
    if (audioBlob) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(URL.createObjectURL(audioBlob));
      audioRef.current.play();
      setIsPlaying(true);
      audioRef.current.onended = () => setIsPlaying(false);
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("username", userName);

      const response = await fetch("/api/clone-voice", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process audio");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error("Failed to communicate with the server");
    }
  };

  const handleCloning = async () => {
    if (!audioBlob || !userName) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Please enter your name and record audio before proceeding",
      });
      return;
    }

    setIsCloning(true);
    setCloningProgress(0);

    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setCloningProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 5;
        });
      }, 500);

      // Send audio to backend
      const response = await sendAudioToBackend(audioBlob);

      // Complete progress
      clearInterval(progressInterval);
      setCloningProgress(100);

      // Set response audio and activate call
      if (response.audioUrl) {
        const audioBlob = await fetch(response.audioUrl).then((r) => r.blob());
        setResponseAudio(audioBlob);

        setTimeout(() => {
          setIsCloning(false);
          setIsCallActive(true);

          // Auto-play response
          if (audioRef.current) {
            audioRef.current.pause();
          }
          audioRef.current = new Audio(URL.createObjectURL(audioBlob));
          audioRef.current.play();
        }, 500);
      }
    } catch (error) {
      console.error("Cloning failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Voice cloning failed. Please try again.",
      });
      setIsCloning(false);
    }
  };

  const handleRestart = () => {
    if (audioRef.current && responseAudio) {
      audioRef.current.pause();
      audioRef.current = new Audio(URL.createObjectURL(responseAudio));
      audioRef.current.play();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto flex flex-wrap gap-8">
        {/* Left Section */}
        <div className="flex-1 min-w-[45%]">
          <Card className="p-6 space-y-6">
            {!isNameSubmitted ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Personal Assistant</h2>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleNameSubmit();
                      }
                    }}
                  />
                  <Button onClick={handleNameSubmit}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">{welcomeMessage}</h2>
                {showRecordingGuide && (
                  <div className="bg-primary/10 p-4 rounded-lg mb-4">
                    <p className="text-sm text-primary font-medium">
                      Please press the microphone button below and read the
                      following text:
                    </p>
                  </div>
                )}
                <div className="prose prose-sm dark:prose-invert">
                  <p className="text-muted-foreground leading-relaxed">
                    Hello, my name is {userName}, and I am _______________ (Age)
                    years old. I practice _______________ (Religion) and am a
                    _______________ (Nationality) national. My highest
                    qualification is _______________ (Highest Qualification).
                    With _______________ (Experience) years of experience, I
                    currently work as a _______________ (Current Job).
                  </p>
                  <div className="space-y-2 mt-4">
                    <h3 className="font-semibold">Today&apos;s Schedule</h3>
                    <ul className="space-y-2 list-none pl-0">
                      <li className="text-sm text-muted-foreground">
                        10:00 AM - Meeting with John from Marketing to discuss
                        our new campaign strategy
                      </li>
                      <li className="text-sm text-muted-foreground">
                        1:00 PM - Meeting with Emily from Sales to review our
                        quarterly targets
                      </li>
                      <li className="text-sm text-muted-foreground">
                        3:30 PM - Meeting with David from IT to discuss our
                        upcoming system upgrades
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Voice Recording Interface */}
            {isNameSubmitted && (
              <div className="space-y-4">
                <div className="h-10">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    width={600}
                    height={40}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isRecording ? "bg-red-500 animate-pulse" : "bg-gray-400"
                      }`}
                    />
                    <span className="text-sm font-mono">
                      {formatTime(recordingTime)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant={isRecording ? "destructive" : "secondary"}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      size="icon"
                      variant="secondary"
                      disabled={!audioBlob || isRecording}
                      onClick={handlePlayback}
                    >
                      <Play className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => {
                        setAudioBlob(null);
                        setRecordingTime(0);
                        if (audioRef.current) {
                          audioRef.current.pause();
                          audioRef.current = null;
                        }
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isNameSubmitted && (
              <Button
                className="w-full"
                size="lg"
                disabled={!audioBlob || isCloning}
                onClick={handleCloning}
              >
                Proceed with Cloning
              </Button>
            )}
          </Card>
        </div>

        {/* Right Section */}
        <div className="flex-1 min-w-[45%]">
          <Card className="p-6">
            <div className="flex justify-center gap-8 mb-8">
              <div className="relative">
                <div
                  className={`w-[150px] h-[150px] rounded-full bg-secondary flex items-center justify-center
                  ${
                    isCallActive
                      ? "ring-4 ring-primary ring-opacity-50 animate-pulse"
                      : ""
                  }`}
                >
                  <User className="w-16 h-16 text-muted-foreground" />
                </div>
              </div>

              <div className="relative">
                <div
                  className={`w-[150px] h-[150px] rounded-full bg-secondary flex items-center justify-center
                  ${
                    isCallActive
                      ? "ring-4 ring-primary ring-opacity-50 animate-pulse"
                      : ""
                  }`}
                >
                  <Bot className="w-16 h-16 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                variant="destructive"
                className="rounded-full w-12 h-12"
                disabled={!isCallActive}
                onClick={() => {
                  setIsCallActive(false);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                  }
                }}
              >
                <Phone className="w-6 h-6" />
              </Button>

              <Button
                size="lg"
                variant="secondary"
                className="rounded-full w-12 h-12"
                disabled={!isCallActive}
                onClick={handleRestart}
              >
                <RefreshCw className="w-6 h-6" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Loading Overlay */}
      {isCloning && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="max-w-md w-full p-6 space-y-4">
            <Progress value={cloningProgress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              Cloning voice... {cloningProgress}%
            </p>
          </div>
        </div>
      )}
      <footer className="w-full text-center py-4 text-gray-500 mt-8">
        azmth - All Rights Reserved.
      </footer>
    </div>
  );
}
