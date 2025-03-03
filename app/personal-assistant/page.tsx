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
import { UserButton, useUser } from "@clerk/nextjs";
import {
  cloneVoice,
  synthesizeVoice,
  registerUnloadHandler,
} from "@/lib/elevenlabs";
import { getChatResponse } from "@/lib/chat";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileUploadComponent from "@/components/FileUploadComponent";
//import ParticleBackground from "./background-animation";

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
  const { user } = useUser();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isCloning, setIsCloning] = useState(false);
  const [cloningProgress, setCloningProgress] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voice_id, setVoice_id] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [isNameSubmitted, setIsNameSubmitted] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [showRecordingGuide, setShowRecordingGuide] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your name",
      });
      return;
    }
    setIsNameSubmitted(true);
  };

  const handleUploadSuccess = () => {
    toast({
      title: "Data Processed",
      description: "Your uploaded content is now available to the assistant",
    });
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
  }, [audioBlob]);

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

      // Show progress while waiting
  const progressInterval = setInterval(() => {
    setCloningProgress((prev) => {
      if (prev >= 90) return prev;
      return prev + 5;
    });
  }, 500);

  try {
    // Use a timeout to prevent hanging
    const response = await Promise.race([
      cloneVoice(audioBlob, userName),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Voice cloning timed out after 30 seconds")), 30000)
      )
    ]);

    clearInterval(progressInterval);
    setCloningProgress(100);

    if (response.voice_id) {
      setVoice_id(response.voice_id);
      setIsCallActive(true);

      if (response.isUsingFallback) {
        toast({
          title: "Notice",
          description: "Voice cloning was not successful. Using a pre-made voice instead.",
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: "Voice cloned successfully! You can now start the conversation.",
        });
      }
    } else {
      throw new Error("Voice cloning failed - no voice ID returned");
    }
  } catch (error) {
    console.error("Cloning failed:", error);
    clearInterval(progressInterval);
    toast({
      variant: "destructive",
      title: "Error",
      description: `Voice cloning failed: ${(error as Error).message || "Unknown error"}`,
    });
  } finally {
    setIsCloning(false);
  }
};

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
        // Indicate processing state to user
        setCurrentMessage("Processing your message...");
        
        // Use a timeout to prevent hanging
        const chatResponse = await Promise.race([
          getChatResponse(text),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("Chat response timed out")), 15000)
          )
        ]);
    
        if (chatResponse.success && chatResponse.text) {
          const audioUrl = await Promise.race([
            synthesizeVoice(chatResponse.text, voice_id),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error("Voice synthesis timed out")), 15000)
            )
          ]);
    
          if (audioUrl) {
            setCurrentMessage(chatResponse.text);
            playResponseAudio(audioUrl);
          } else {
            throw new Error("Failed to synthesize voice - null response");
          }
        } else {
          throw new Error(chatResponse.text || "Failed to get chat response");
        }
      } catch (error) {
        console.error("Message processing failed:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to process message: ${(error as Error).message || "Unknown error"}`,
        });
        setCurrentMessage("");
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
      return `${minutes}:${
        remainingSeconds < 10 ? "0" : ""
      }${remainingSeconds}`;
    };

    return (
      <div className="min-h-screen bg-gray-900/50 flex items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4 z-50">
          <UserButton />
        </div>
        
        <AnimatePresence mode="wait">
          {!isNameSubmitted ? (
            <motion.div
              key="name-card"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md"
            >
              <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-white text-center">
                    Personal Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") handleNameSubmit();
                        }}
                      />
                      <button
                        className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-400 transition-colors"
                        onClick={handleNameSubmit}
                      >
                        <Send className="h-6 w-6" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-grow">
                        <FileUploadComponent 
                          userId={user?.id || "anonymous"} 
                          onUploadSuccess={handleUploadSuccess} 
                        />
                      </div>
                      <p className="text-sm text-gray-400">Upload files or add URLs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : !voice_id ? (
            <motion.div
              key="recording-card"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-2xl"
            >
              <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700 relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white">
                    {welcomeMessage}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 space-y-6">
                  <div className="bg-gray-700/50 p-6 rounded-xl">
                    <p className="text-lg text-gray-200 leading-relaxed">
                      Hello, my name is {userName}, and I am _______________
                      (Age) years old. I practice _______________ (Religion) and
                      am a (nationality) _______________ national. My highest
                      qualification is _______________ (Highest Qualification).
                      With _______________ (Experience) years of experience, I
                      currently work as a _______________ (Current Job).
                    </p>
                    <div className="mt-4">
                      <h3 className="font-bold text-xl text-white mb-2">
                        Today&apos;s Schedule
                      </h3>
                      <ul className="space-y-2 text-gray-300">
                        <li>10:00 AM - Meeting with John from Marketing</li>
                        <li>1:00 PM - Meeting with Emily from Sales</li>
                        <li>3:30 PM - Meeting with David from IT</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <WaveAnimation isRecording={isRecording} />

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
                      className={`w-full py-3 rounded-lg transition-colors ${
                        !audioBlob || isCloning
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : "bg-white text-black hover:bg-white"
                      }`}
                      disabled={!audioBlob || isCloning}
                      onClick={handleCloning}
                    >
                      {isCloning
                        ? "Cloning in progress..."
                        : "Proceed with Cloning"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="call-interface"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-2xl"
            >
              <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-700">
                <CardContent className="p-8">
                  <div className="flex justify-center gap-8 mb-8">
                    <motion.div
                      className="relative"
                      animate={{ scale: isCallActive ? [1, 1.05, 1] : 1 }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div
                        className={`w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center
                      ${
                        isCallActive
                          ? "ring-4 ring-blue-500 ring-opacity-50"
                          : ""
                      }`}
                      >
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    </motion.div>

                    <motion.div
                      className="relative"
                      animate={{ scale: isCallActive ? [1, 1.05, 1] : 1 }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div
                        className={`w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center
                      ${
                        isCallActive
                          ? "ring-4 ring-blue-500 ring-opacity-50"
                          : ""
                      }`}
                      >
                        <Bot className="w-12 h-12 text-gray-400" />
                      </div>
                    </motion.div>
                  </div>

                  <div className="bg-gray-700/50 p-6 rounded-xl mb-6 min-h-[100px]">
                    <p className="text-white">{currentMessage}</p>
                    {isConverting && (
                      <p className="text-sm text-gray-400 mt-2">
                        Recording your message...
                      </p>
                    )}
                  </div>

                  <div className="flex justify-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center"
                      onClick={handleEndCall}
                    >
                      <Phone className="w-6 h-6" />
                    </motion.button>

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

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center"
                      onClick={() => setCurrentMessage("")}
                    >
                      <RefreshCw className="w-6 h-6" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        !currentMessage || !voice_id
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-green-500"
                      } text-white`}
                      disabled={!currentMessage || !voice_id}
                      onClick={() => {
                        if (currentMessage && voice_id) {
                          sendMessage(currentMessage, voice_id);
                        }
                      }}
                    >
                      <Send className="w-6 h-6" />
                    </motion.button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

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