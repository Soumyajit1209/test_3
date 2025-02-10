"use client"
import React, { useState, useRef, useEffect } from "react";
import { Phone, RefreshCw, Mic, Play, Square, RotateCcw, User, Bot, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress"

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [cloningProgress, setCloningProgress] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [isNameSubmitted, setIsNameSubmitted] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [showRecordingGuide, setShowRecordingGuide] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const {toast} = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleNameSubmit = async () => {
    if (!userName.trim()) {
      alert("Please enter your name");
      return;
    }

    try {
      setWelcomeMessage(`Welcome to azmth, ${userName}!`);
      setIsNameSubmitted(true);
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
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
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
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setAudioBlob(audioBlob);

        if (isCallActive) {
          handleSpeechToText();
        }
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
      alert("Failed to access microphone. Please check your permissions.");
    }
  };

  const handleSpeechToText = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Speech recognition is not supported in this browser.",
      });
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      setIsConverting(true);
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setCurrentMessage(text);
      if (text && voiceId) {
        sendMessage(text, voiceId);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setIsConverting(false);
      alert("Failed to recognize speech");
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsConverting(false);
    };

    recognition.start();
  };

  const sendMessage = async (text: string, voiceId: string) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          voiceId: voiceId,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();
      if (data.audioUrl) {
        playResponseAudio(data.audioUrl);
      }
    } catch (error) {
      alert("Failed to send message");
    }
  };

  const playResponseAudio = async (audioUrl: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      await audioRef.current.play();
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const setupAudioVisualization = (stream: MediaStream) => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return;

    const draw = () => {
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;

      analyserRef.current!.fftSize = 2048;
      const bufferLength = analyserRef.current!.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      const drawVisual = () => {
        animationFrameRef.current = requestAnimationFrame(drawVisual);
        analyserRef.current!.getByteTimeDomainData(dataArray);

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

  const handleCloning = async () => {
    if (!audioBlob || !userName) {
      alert("Please enter your name and record audio before proceeding");
      return;
    }

    setIsCloning(true);
    setCloningProgress(0);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("username", userName);

      const progressInterval = setInterval(() => {
        setCloningProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 5;
        });
      }, 500);

      const response = await fetch("/api/clone", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to clone voice");
      }

      clearInterval(progressInterval);
      setCloningProgress(100);

      const data = await response.json();
      if (data.voiceId) {
        setVoiceId(data.voiceId);
        setIsCallActive(true);
        alert("Voice cloned successfully! You can now start the conversation.");
      }
    } catch (error) {
      console.error("Cloning failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Voice cloning failed. Please try again.",
      });
    } finally {
      setIsCloning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto flex flex-wrap gap-8">
        {/* Left Section - Initial Setup */}
        <div className="flex-1 min-w-[45%]">
          <div className=" p-6 rounded-lg shadow-md space-y-6">
            {!isNameSubmitted ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Personal Assistant</h2>
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-4 py-2 border rounded-lg"
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleNameSubmit();
                    }}
                  />
                  <button
                    className="px-4 py-2 bg-white text-black rounded-lg"
                    onClick={handleNameSubmit}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : !voiceId ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">{welcomeMessage}</h2>
                {showRecordingGuide && (
                  <div className="bg-primary/10 p-4 rounded-lg mb-4">
                    <p className="text-2xl text-primary font-bold">
                      Please press the microphone button below and read the following text:
                    </p>
                  </div>
                )}
                <div className="prose prose-sm">
                  <p className="text-muted-foreground leading-relaxed text-2xl">
                    Hello, my name is {userName}, and I am _______________ (Age) years old.
                    I practice _______________ (Religion) and am a _______________ (Nationality) national.
                    My highest qualification is _______________ (Highest Qualification).
                    With _______________ (Experience) years of experience,
                    I currently work as a _______________ (Current Job).
                  </p>
                  <div className="space-y-2 mt-4">
                    <h3 className="font-bold text-2xl">Today&apos;s Schedule</h3>
                    <ul className="space-y-2 list-none pl-0">
                      <li className="text-2xl text-gray-400">
                        10:00 AM - Meeting with John from Marketing
                      </li>
                      <li className="text-2xl text-gray-400">
                        1:00 PM - Meeting with Emily from Sales
                      </li>
                      <li className="text-2xl text-gray-400">
                        3:30 PM - Meeting with David from IT
                      </li>
                    </ul>
                  </div>
                </div>

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
                      <button
                        className={`p-2 rounded-lg ${
                          isRecording
                            ? "bg-red-500 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                        onClick={isRecording ? stopRecording : startRecording}
                      >
                        {isRecording ? (
                          <Square className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        className="p-2 bg-gray-200 text-gray-700 rounded-lg"
                        disabled={!audioBlob || isRecording}
                        onClick={() => {
                          if (audioBlob) {
                            const audio = new Audio(URL.createObjectURL(audioBlob));
                            audio.play();
                          }
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </button>

                      <button
                        className="p-2 bg-gray-200 text-gray-700 rounded-lg"
                        onClick={() => {
                          setAudioBlob(null);
                          setRecordingTime(0);
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  className={`w-full py-3 rounded-lg ${
                    !audioBlob || isCloning
                      ? "bg-gray-500 text-black cursor-not-allowed"
                      : "bg-white text-black"
                  }`}
                  disabled={!audioBlob || isCloning}
                  onClick={handleCloning}
                >
                  Proceed with Cloning
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Section - Call Interface */}
        {voiceId && (
          <div className="flex-1 min-w-[45%]">
            <div className="bg-background p-6 rounded-lg shadow-md space-y-6">
              <div className="flex justify-center gap-8 mb-8">
                <div className="relative">
                  <div
                    className={`w-[150px] h-[150px] rounded-full bg-gray-100 flex items-center justify-center
                    ${isCallActive ? "ring-4 ring-blue-500 ring-opacity-50 animate-pulse" : ""}`}
                  >
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                </div>

                <div className="relative">
                  <div
                    className={`w-[150px] h-[150px] rounded-full bg-gray-100 flex items-center justify-center
                    ${isCallActive ? "ring-4 ring-blue-500 ring-opacity-50 animate-pulse" : ""}`}
                  >
                    <Bot className="w-16 h-16 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Text Display */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4 min-h-[60px]">
                <p className="text-sm">
                  {currentMessage || "Your message will appear here..."}
                </p>
                {isConverting && (
                  <p className="text-xs text-gray-500 mt-2">
                    Converting speech to text...
                  </p>
                )}
              </div>

              {/* Control Buttons */}
              <div className="flex justify-center gap-4">
                <button
                  className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center"
                  onClick={() => {
                    setIsCallActive(false);
                    setVoiceId(null);
                    setCurrentMessage("");
                  }}
                >
                  <Phone className="w-6 h-6" />
                </button>

                <button
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isRecording
                      ? "bg-red-500 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? (
                    <Square className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </button>

                <button
                  className="w-12 h-12 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center"
                  onClick={() => {
                    setCurrentMessage("");
                  }}
                >
                  <RefreshCw className="w-6 h-6" />
                </button>

                <button
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    !currentMessage || isConverting
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-500 text-white"
                  }`}
                  disabled={!currentMessage || isConverting}
                  onClick={() => {
                    if (currentMessage && voiceId) {
                      sendMessage(currentMessage, voiceId);
                    }
                  }}
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isCloning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center">
          <div className="max-w-md w-full bg-white p-6 rounded-lg space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${cloningProgress}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-600">
              Cloning voice... {cloningProgress}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;