import { useState, useEffect, useCallback } from 'react';

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setTranscript(transcript);

        // Check for end of speech (final result)
        if (event.results[event.results.length - 1].isFinal) {
          handleSpeechEnd(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, []);

  const handleSpeechEnd = async (finalTranscript) => {
    setIsProcessing(true);
    try {
      // Simulate API call - Replace with your actual backend call
      const response = await new Promise(resolve => 
        setTimeout(() => resolve({ 
          text: "This is a simulated response. Replace this with your actual backend integration.",
          audio: null // In a real implementation, this would be the audio response
        }), 1000)
      );

      setResponseText(response.text);

      // Text-to-speech
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(response.text);
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("Failed to process speech:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = useCallback(() => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
      setTranscript('');
      setResponseText('');
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasSupport: !!recognition,
    isProcessing,
    responseText
  };
}