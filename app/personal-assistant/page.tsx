"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Mic,
  Square,
  User,
  Bot,
  Send,
  RotateCcw,
  Play,
  Pause,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { getChatResponse } from "@/lib/chat";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileUploadComponent from "@/components/FileUploadComponent";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";
import QueryHistoryHub from '@/components/QueryHistoryHub';

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
  const [activeTab, setActiveTab] = useState("input");
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [userName, setUserName] = useState("");
  const [isNameSubmitted, setIsNameSubmitted] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [showRecordingGuide, setShowRecordingGuide] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [pdfContent, setPdfContent] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState("option1");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReturnButton, setShowReturnButton] = useState(false);

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

  const fetchPdfContent = async (company_id: string) => {
    try {
      const response = await fetch(
        `https://devazmth.globaltfn.tech/pdfs/${company_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setPdfContent(data);
    } catch (error) {
      console.error("Error fetching PDF content:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load PDF content",
      });
    }
  };

  const handleUploadSuccess = async () => {
    toast({
      title: "Data Processed",
      description: "Your uploaded content is now available to the assistant",
    });
    await fetchPdfContent(user?.id || "anonymous");
  };

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
  };

  const sendMessage = async (text: string) => {
    try {
      setIsLoading(true);
      setResponse("Processing your message...");

      const chatResponse = await Promise.race([
        getChatResponse(text),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Chat response timed out")), 15000)
        ),
      ]);

      if (chatResponse.success && chatResponse.text) {
        setResponse(chatResponse.text);
      } else {
        throw new Error(chatResponse.text || "Failed to get chat response");
      }
    } catch (error) {
      console.error("Message processing failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to process message: ${
          (error as Error).message || "Unknown error"
        }`,
      });
      setResponse("");
    } finally {
      setIsLoading(false);
    }
  };

  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Show button when mouse is near the right edge of the screen
      const windowWidth = window.innerWidth;
      if (e.clientX > windowWidth - 100) {
        setShowReturnButton(true);
      } else {
        setShowReturnButton(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (isNameSubmitted) {
      setWelcomeMessage(`Welcome to azmth, ${userName}!`);
      setShowRecordingGuide(true);
    }
  }, [isNameSubmitted, userName]);

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

  
  useEffect(() => {
    if (activeTab === "log") {
      setIsNameSubmitted(false);
    }
  }, [activeTab]);

  if (activeTab === "log") {
    return (
      <>
        <QueryHistoryHub />
      
        {showReturnButton && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-1/2 right-4 transform -translate-y-1/2 bg-white text-black p-4 rounded-full shadow-lg hover:bg-gray-200 transition-all z-50 flex items-center gap-2"
            onClick={() => setActiveTab("input")}
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Return to Input</span>
          </motion.button>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900/50 flex relative">
      <div className="w-64 bg-gray-800/90 backdrop-blur-sm border-r border-gray-700 flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-8">
            Personal Assistant
          </h2>
        </div>

        <div className="flex flex-col px-4 gap-3 flex-grow">
          <button
            className={`px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
              activeTab === 'input' ? "bg-white text-black" : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
            onClick={() => {
              setActiveTab('input');
            }}
          >
            <span>Input</span>
          </button>

          <button 
            className={`px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
              activeTab === 'log' ? "bg-white text-black" : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
            onClick={() => setActiveTab('log')}
          >
            <span>Log</span>
          </button>
        </div>

        <div className="p-6 border-t border-gray-700 mt-auto">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">v1.0.0</div>
            <UserButton />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative">
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
                    {user?.firstName ? (
                      <>
                        Hi,{" "}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
                          {user.firstName}
                        </span>
                      </>
                    ) : (
                      "Enter Your Name"
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your Company Name"
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
                          userName={userName}
                          onUploadSuccess={handleUploadSuccess}
                        />
                      </div>
                      <p className="text-sm text-gray-400">
                        Upload files or add URLs
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="app-interface"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <div className="flex gap-6">
                <Card className="flex-1 bg-gray-800/80 backdrop-blur-sm border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-white">
                      {welcomeMessage}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <label className="block text-white mb-2">
                        Select Voice
                      </label>
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="w-full p-2 rounded-lg bg-gray-700 text-white border border-gray-600"
                      >
                        <option value="option1">Option 1</option>
                        <option value="option2">Option 2</option>
                      </select>
                    </div>

                    <div className="space-y-4 mb-6">
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
                          <div className="text-sm text-gray-400">
                            {recordingTime > 0
                              ? `${Math.floor(recordingTime / 60)
                                  .toString()
                                  .padStart(2, "0")}:${(recordingTime % 60)
                                  .toString()
                                  .padStart(2, "0")}`
                              : "00:00"}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            className={`p-3 rounded-full transition-colors ${
                              isRecording
                                ? "bg-red-500 text-white"
                                : "bg-white text-black hover:bg-gray-400"
                            }`}
                            onClick={
                              isRecording ? stopRecording : startRecording
                            }
                          >
                            {isRecording ? (
                              <Square className="h-5 w-5" />
                            ) : (
                              <Mic className="h-5 w-5" />
                            )}
                          </button>

                          <button
                            className={`p-3 rounded-full transition-colors ${
                              !audioBlob
                                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                : "bg-white text-black hover:bg-gray-400"
                            }`}
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
                    </div>

                    <div className="bg-gray-700/50 p-6 rounded-xl mb-6 min-h-[200px] max-h-[300px] overflow-y-auto">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <p className="font-medium text-white">You</p>
                        </div>
                        <p className="text-white ml-10">{currentMessage}</p>
                      </div>
                      
                      {response && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            <p className="font-medium text-white">Assistant</p>
                          </div>
                          <p className="text-white ml-10">{response}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        className={`p-3 rounded-lg transition-colors ${
                          isConverting ? "bg-red-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                        onClick={() =>
                          isConverting ? stopSpeechToText() : handleSpeechToText()
                        }
                      >
                        {isConverting ? (
                          <Square className="h-5 w-5" />
                        ) : (
                          <Mic className="h-5 w-5" />
                        )}
                      </button>
                      
                      <input
                        className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
                        placeholder="Type your message..."
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && currentMessage.trim() !== "") {
                            sendMessage(currentMessage);
                          }
                        }}
                      />
                      
                      <button
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          !currentMessage.trim() || isLoading
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-white text-black hover:bg-gray-200"
                        }`}
                        disabled={!currentMessage.trim() || isLoading}
                        onClick={() => {
                          if (currentMessage.trim() !== "") {
                            sendMessage(currentMessage);
                          }
                        }}
                      >
                        <Send className="h-6 w-6" />
                      </button>
                      
                      <button
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        onClick={() => {
                          setCurrentMessage("");
                          setResponse("");
                        }}
                      >
                        <RefreshCw className="h-6 w-6" />
                      </button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="flex-1 bg-gray-800/80 backdrop-blur-sm border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                      <FileText className="h-6 w-6" />
                      Document Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-700/50 p-6 rounded-xl max-h-[600px] overflow-y-auto">
                      <Markdown>
                        {pdfContent ||
                          "No content available. Please upload a document."}
                      </Markdown>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <audio ref={audioRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}