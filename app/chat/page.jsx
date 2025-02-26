"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import { MessageSquare, Mic, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VoiceOverlay } from "@/components/VoiceOverlay";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipProvider } from "@radix-ui/react-tooltip"
import Link from "next/link";

const MotionCard = motion(Card);
const MotionButton = motion(Button);

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    hasSupport,
    isProcessing,
    responseText 
  } = useSpeechRecognition();

  const [activeType, setActiveType] = useState("All");
  const [showMic, setShowMic] = useState(true);

   // Animation variants
   const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const cardVariants = {
    hover: {
      scale: 1.02,
      boxShadow: "0 0 15px rgba(79, 70, 229, 0.3)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  const messageVariants = {
    initial: { 
      opacity: 0, 
      x: -20 
    },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    exit: { 
      opacity: 0, 
      x: 20 
    }
  };

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (responseText) {
      const assistantMessage = {
        role: "assistant",
        content: responseText
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  }, [responseText]);

  const handleSend = async () => {
    if (!input.trim()) return;
  
    const userMessage = {
      role: "user",
      content: input
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
  
    try {
      const response = await fetch("https://api.globaltfn.tech/aboutazmth", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userInput: userMessage.content })
      });
  
      const data = await response.json();
      if (data.status_code === 200) {
        const assistantMessage = {
          role: "assistant",
          content: data.data
        };
        setMessages(prev => [...prev, assistantMessage]);
  
        
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setIsLoading(false);
    if (isListening) {
      stopListening();
    }
    
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <Sidebar className="" onNewChat={handleNewChat} />
      
      <main className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <motion.div
              className="h-full flex items-center justify-center"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <div className="max-w-2xl w-full space-y-8 py-20">
                <motion.div className="text-center space-y-2" variants={itemVariants}>
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <MessageSquare className="h-12 w-12 mx-auto" />
                  </motion.div>
                  <motion.h1 className="text-3xl font-bold" variants={itemVariants}>
                    How can I help you today?
                  </motion.h1>
                  <motion.p className="text-muted-foreground" variants={itemVariants}>
                    Start a conversation and I&apos;ll assist you with your questions
                  </motion.p>
                </motion.div>

                <motion.div 
                  className="grid grid-cols-3 gap-4"
                  variants={containerVariants}
                >
                  <MotionCard
                    className="p-4 space-y-2 cursor-pointer"
                    variants={cardVariants}
                    whileHover="hover"
                    initial="hidden"
                    animate="visible"
                  >
                    <h3 className="font-medium">Saved Prompt Templates</h3>
                    <p className="text-sm text-muted-foreground">
                      Use saved prompt templates for faster interactions
                    </p>
                  </MotionCard>

                  <Link href="/personal-assistant">
                    <MotionCard
                      className="p-4 space-y-2 cursor-pointer"
                      variants={cardVariants}
                      whileHover="hover"
                      initial="hidden"
                      animate="visible"
                    >
                      <h3 className="font-medium">Personal Assistant</h3>
                      <p className="text-sm text-muted-foreground">
                        Introduce yourself to get personalized assistance. Where you can clone your own voice.
                      </p>
                    </MotionCard>
                  </Link>

                  <MotionCard
                    className="p-4 space-y-2 cursor-pointer"
                    variants={cardVariants}
                    whileHover="hover"
                    initial="hidden"
                    animate="visible"
                  >
                    <h3 className="font-medium">Multilingual Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose language for better interaction
                    </p>
                  </MotionCard>
                </motion.div>

                <motion.div 
                  className="flex gap-2 justify-center text-2xl"
                  variants={containerVariants}
                >
                  {["All", "Text"].map((type) => (
                    <MotionButton 
                      key={type} 
                      variant="ghost" 
                      className={`text-muted-foreground border ${
                        activeType === type ? 'border-white' : 'border-transparent'
                      }`}
                      onClick={() => {
                        setActiveType(type);
                        setShowMic(type !== "Text");
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {type}
                    </MotionButton>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                    variants={messageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    layout
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.content}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div 
                    className="flex justify-start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                      <div className="flex space-x-2">
                        <motion.div
                          className="w-2 h-2 rounded-full bg-current"
                          animate={{ y: [-5, 0, -5] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        />
                        <motion.div
                          className="w-2 h-2 rounded-full bg-current"
                          animate={{ y: [-5, 0, -5] }}
                          transition={{ duration: 0.6, delay: 0.2, repeat: Infinity }}
                        />
                        <motion.div
                          className="w-2 h-2 rounded-full bg-current"
                          animate={{ y: [-5, 0, -5] }}
                          transition={{ duration: 0.6, delay: 0.4, repeat: Infinity }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        <motion.div 
          className="p-4 border-t"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-2xl mx-auto flex gap-2">
            <motion.div 
              className="flex-1"
              whileFocus={{ scale: 1.01 }}
            >
              <textarea
                ref={inputRef}
                placeholder="Type your message..."
                className="w-full resize-none overflow-hidden bg-background rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] max-h-[150px]"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                }}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                rows={1}
              />
            </motion.div>
            {showMic && (
              <TooltipProvider>
                <Tooltip content="Start voice chat">
                  <MotionButton 
                    size="icon" 
                    variant="ghost"
                    className="border"
                    disabled={isLoading || !hasSupport}
                    onClick={handleVoiceToggle}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Mic className={`h-4 w-4 ${isListening ? 'text-destructive' : ''}`} />
                  </MotionButton>
                </Tooltip>
              </TooltipProvider>
            )}
            <MotionButton 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="border"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Send className="h-4 w-4" />
            </MotionButton>
          </div>
        </motion.div>
      </main>

      <VoiceOverlay 
        isListening={isListening}
        stopListening={stopListening}
        onClose={stopListening}
        onToggleListen={handleVoiceToggle}
        transcript={transcript}
        isProcessing={isProcessing}
        responseText={responseText}
      />
    </div>
  );
}