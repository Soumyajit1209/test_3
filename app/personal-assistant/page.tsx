"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  RefreshCw,
  Mic,
  Square,
  User,
  Bot,
  Send,
  RotateCcw,
  Play,
  Pause,
} from "lucide-react";
import {
  cloneVoice,
  synthesizeVoice,
  registerUnloadHandler,
} from "@/lib/elevenlabs";
import { getChatResponse } from "@/lib/chat";
import { useToast } from "@/hooks/use-toast";
import { registerUnloadHandler } from "@/lib/elevenlabs";
//import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'; // Import useSpeechRecognition hook

interface CloneResponse {
  voice_id: string;
  success: boolean;
}

const WaveAnimation = ({ isRecording }: { isRecording: boolean }) => {
  return (
    <div className="h-12 flex items-center justify-center">
      {isRecording && (
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-white rounded-full"
              animate={{
                height: ["12px", "24px", "12px"],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isCloning, setIsCloning] = useState(false);
  const [cloningProgress, setCloningProgress] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voice_id, setVoice_id] = useState<string | null>("z8nv38zRVDhoymPBPACM");
  const [userName, setUserName] = useState("");
  const [isNameSubmitted, setIsNameSubmitted] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [showRecordingGuide, setShowRecordingGuide] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const toast = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  useEffect(() => {
    if (isNameSubmitted) {
      setWelcomeMessage(`Welcome to azmth, ${userName}!`);
      setShowRecordingGuide(true);
    }
  }, [isNameSubmitted, userName]);

  useEffect(() => {
    registerUnloadHandler();
  }, []);

  const handleNameSubmit = () => {
    if (userName.trim() === "") {
      toast.toast({
        variant: "default",
        title: "Hello there! 🤖",
        description:
          "Please enter your name..",
      });
      return;
    }
    setIsNameSubmitted(true);
  };

  const startRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setRecordingTime(0);
    setIsRecording(true);

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
          setAudioBlob(blob);
        };
        mediaRecorderRef.current.start(1000);
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
        //setupAudioVisualization(stream);
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "Failed to access microphone. Please check your permissions.",
        });
      });
  };
  const stopSpeechToText = () => {
    setIsConverting(false); // Stop the conversion process
    setCurrentMessage(""); // Clear the message if needed
    if (audioRef.current) {
      audioRef.current.pause(); // Stop any ongoing audio playback
      audioRef.current.src = ""; // Reset audio source
    }
    //console.log("Speech-to-text conversion stopped.");
  };
  const setupAudioVisualization = (stream: MediaStream) => {
    if (!canvasRef.current) return;

    audioContextRef.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);

    analyserRef.current.fftSize = 2048;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return;

    const draw = () => {
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;

      animationFrameRef.current = requestAnimationFrame(draw);

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

    draw();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };
  useEffect(() => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);

      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, [audioBlob]); // Reinitialize when audioBlob changes

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }

    setIsPlaying(!isPlaying);
  };

  const handleEndCall = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setIsCallActive(false);
    setVoice_id(null);
    setCurrentMessage("");
  };

  const handleCloning = async () => {
    if (!audioBlob || !userName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please record audio before proceeding",
      });
      return;
    }

    setIsCloning(true);
    setCloningProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setCloningProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 5;
        });
      }, 500);

      const response = await cloneVoice(audioBlob, userName);

      clearInterval(progressInterval);
      setCloningProgress(100);

      if (response.voice_id) {
        setVoice_id(response.voice_id);
        setIsCallActive(true);

        if (response.isUsingFallback) {
          toast({
            title: "Notice",
            description:
              "Voice cloning was not successful. Using a pre-made voice instead.",
            variant: "default",
          });
        } else {
          toast({
            title: "Success",
            description:
              "Voice cloned successfully! You can now start the conversation.",
          });
        }
      } else {
        throw new Error("Voice cloning failed");
      }
    } catch (error) {
      console.error("Cloning failed:", error);

      if ((error as any).response?.status === 401) {
        toast.toast({
          variant: "destructive",
          title: "Error",
          description: "All voices are used... Please try again later.",
        });
      } else {
        toast.toast({
          variant: "destructive",
          title: "Error",
          description:
            "Voice clonning failed. Please try again later.",
        });
      }
    } finally {
      setIsCloning(false)
    }
  }

    const handleSpeechToText = () => {
      if (!("webkitSpeechRecognition" in window)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Speech recognition is not supported in your browser.",
        });
        return;
      }
      setIsConverting(true);
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentMessage(transcript);
        setIsConverting(false);
      };
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsConverting(false);
      };
      recognition.start();
    };

    const stopSpeechToText = () => {
      setIsConverting(false);
      setCurrentMessage("");
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };

    const sendMessage = async (text: string, voice_id: string) => {
      try {
        const chatResponse = await getChatResponse(text);

        if (chatResponse.success && chatResponse.text) {
          const audioUrl = await synthesizeVoice(chatResponse.text, voice_id);

          if (audioUrl) {
            setCurrentMessage(chatResponse.text);
            playResponseAudio(audioUrl);
          } else {
            throw new Error("Failed to synthesize voice");
          }
        } else {
          throw new Error("Failed to get chat response");
        }
      } catch (error) {
        console.error("Message processing failed:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to process message. Please try again.",
        });
      }
    };

    const playResponseAudio = (audioUrl: string) => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };
  let audioInstance: HTMLAudioElement | null = null;
  let isPlaying = false;

  function handlePlayPause(audioBlob: Blob) {
    if (!audioBlob) return;

    if (!audioInstance) {
      // Create a new audio instance if not already created
      audioInstance = new Audio(URL.createObjectURL(audioBlob));
      audioInstance.onended = () => {
        isPlaying = false;
      };
    }

    if (audioInstance.paused) {
      audioInstance.play();
      isPlaying = true;
    } else {
      audioInstance.pause();
      isPlaying = false;
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto flex flex-wrap gap-8">
        {/* Left Section - Initial Setup */}
        <div className="flex-1 min-w-[45%]">
          <div className="p-6 rounded-lg shadow-md space-y-6">
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
            ) : !voice_id ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">{welcomeMessage}</h2>
                {showRecordingGuide && (
                  <div className="bg-primary/10 p-4 rounded-lg mb-4">
                    <p className="text-2xl text-primary font-bolm">
                      Please press the microphone button below and read the
                      following text:
                    </p>
                  </div>
                )}
                <div className="prose prose-sm">
                  <p className="text-muted-foreground leading-relaxed text-2xl">
                    Hello, my name is {userName}, and I am _______________ (Age)
                    years old. I practice _______________ (Religion) and am a
                    _______________ (Nationality) national. My highest
                    qualification is _______________ (Highest Qualification).
                    With _______________ (Experience) years of experience, I
                    currently work as a _______________ (Current Job).
                  </p>
                  <div className="space-y-2 mt-4">
                    <h3 className="font-bold text-2xl">
                      Today&apos;s Schedule
                    </h3>
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
                            isRecording
                              ? "bg-red-500 animate-pulse"
                              : "bg-gray-400"
                          }`}
                        />
                        {/* <span className="text-sm font-mono text-white">
                          {formatTime(recordingTime)}
                        </span> */}
                      </div>

                      <div className="flex gap-3">
                        <button
                          className={`p-3 rounded-full transition-colors ${
                            isRecording
                              ? "bg-red-500 text-white"
                              : "bg-white text-black hover:bg-gray-400"
                          }`}
                          onClick={isRecording ? stopRecording : startRecording}
                        >
                          {isRecording ? (
                            <Square className="h-5 w-5" />
                          ) : (
                            <Mic className="h-5 w-5" />
                          )}
                        </button>

                        <button
                          className="p-3 bg-white text-black rounded-full hover:bg-gray-400 transition-colors"
                          disabled={!audioBlob}
                          onClick={handlePlayPause}
                        >
                          {isPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </button>

                        <button
                          className="p-3 bg-white text-black rounded-full hover:bg-gray-400 transition-colors"
                          onClick={() => {
                            setAudioBlob(null);
                            setRecordingTime(0);
                          }}
                        >
                          <RotateCcw className="h-5 w-5" />
                        </button>
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
        {voice_id && (
          <div className="fixed inset-0 flex justify-center items-center">
            <div className="bg-background p-6 rounded-lg shadow-md space-y-6 w-[45%]">
              <div className="flex justify-center gap-8 mb-8">
                <div className="relative">
                  <div
                    className={`w-[150px] h-[150px] rounded-full bg-gray-100 flex items-center justify-center
                    ${
                      isCallActive
                        ? "ring-4 ring-blue-500 ring-opacity-50 animate-pulse"
                        : ""
                    }`}
                  >
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                </div>

                <div className="relative">
                  <div
                    className={`w-[150px] h-[150px] rounded-full bg-gray-100 flex items-center justify-center
                    ${
                      isCallActive
                        ? "ring-4 ring-blue-500 ring-opacity-50 animate-pulse"
                        : ""
                    }`}
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
                    azmth is recording your voice...
                  </p>
                )}
              </div>

              {/* Control Buttons */}
              <div className="flex justify-center gap-4">
                <button
                  className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center"
                  onClick={() => {
                    setIsCallActive(false);
                    setVoice_id(null);
                    setCurrentMessage("");
                  }}
                >
                  <Phone className="w-6 h-6" />
                </button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isConverting ? "bg-red-500" : "bg-blue-500"
                      } text-white`}
                      onClick={() =>
                        isConverting ? stopSpeechToText() : handleSpeechToText()
                      }
                    >
                      {isConverting ? (
                        <Square className="w-6 h-6" />
                      ) : (
                        <Mic className="w-6 h-6" />
                      )}
                    </motion.button>

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
                    !currentMessage || !voice_id
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-green-500 text-white"
                  }`}
                  disabled={!currentMessage || !voice_id}
                  onClick={() => {
                    if (currentMessage && voice_id) {
                      sendMessage(currentMessage, voice_id);
                    }
                  }}
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Audio Element */}
        <audio ref={audioRef} style={{ display: "none" }} />
      </div>

        <AnimatePresence>
          {isCloning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center"
            >
              <Card className="w-full max-w-md bg-gray-800/80 backdrop-blur-sm border-gray-700">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: "0%" }}
                        animate={{ width: `${cloningProgress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-center text-white">
                      Cloning voice... {cloningProgress}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <audio ref={audioRef} style={{ display: "none" }} />
      </div>
    );
  };
