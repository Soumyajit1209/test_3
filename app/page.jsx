"use client";

import { useState, useRef, useEffect } from "react";
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
      // Simulate API call - Replace with your actual backend call
      const response = await new Promise(resolve => 
        setTimeout(() => resolve({ 
          role: "assistant", 
          content: "This is a simulated response. Replace this with your actual backend integration." 
        }), 1000)
      );

      setMessages(prev => [...prev, response]);
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
    <div className="flex h-screen bg-background">
      <Sidebar onNewChat={handleNewChat} />
      
      <main className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-2xl w-full space-y-8 py-20">
                <div className="text-center space-y-2">
                  <MessageSquare className="h-12 w-12 mx-auto" />
                  <h1 className="text-3xl font-bold">How can I help you today?</h1>
                  <p className="text-muted-foreground">
                    Start a conversation and I&apos;ll assist you with your questions
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 space-y-2 hover:bg-accent cursor-pointer">
                    <h3 className="font-medium">Saved Prompt Templates</h3>
                    <p className="text-sm text-muted-foreground">
                      Use saved prompt templates for faster interactions
                    </p>
                  </Card>
                  <Link href="/personal-assistant">
                    <Card className="p-4 space-y-2 hover:bg-accent cursor-pointer">
                      <h3 className="font-medium">Personal Assistant</h3>
                      <p className="text-sm text-muted-foreground">
                        Introduce yourself to get personalized assistance
                      </p>
                    </Card>
                  </Link>
                  <Card className="p-4 space-y-2 hover:bg-accent cursor-pointer">
                    <h3 className="font-medium">Multilingual Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose language for better interaction
                    </p>
                  </Card>
                </div>

                <div className="flex gap-2 justify-center text-2xl">
                  {["All", "Text"].map((type) => (
                    <Button 
                      key={type} 
                      variant="ghost" 
                      className={`text-muted-foreground border ${
                        activeType === type ? 'border-white' : 'border-transparent'
                      }`}
                      onClick={() => {
                        setActiveType(type);
                        if (type === "Text") {
                          setShowMic(false);
                        } else {
                          setShowMic(true);
                        }
                      }}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
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
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="max-w-2xl mx-auto flex gap-2">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                placeholder="Type your message..."
                className="w-full resize-none overflow-hidden bg-background border rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] max-h-[150px]"
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
            </div>
            {showMic && (
              <TooltipProvider>
                <Tooltip content="Start voice chat">
                  <Button 
                    size="icon" 
                    variant="ghost"
                    className="border border-white"
                    disabled={isLoading || !hasSupport}
                    onClick={handleVoiceToggle}
                  >
                    <Mic className={`h-4 w-4 ${isListening ? 'text-destructive animate-pulse' : ''}`} />
                  </Button>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="border border-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

      <VoiceOverlay 
        isListening={isListening}
        onClose={stopListening}
        onToggleListen={handleVoiceToggle}
        transcript={transcript}
        isProcessing={isProcessing}
        responseText={responseText}
      />
    </div>
  );
}