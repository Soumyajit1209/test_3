declare module 'react-speech-recognition' {
    export interface SpeechRecognitionHook {
      transcript: string;
      listening: boolean;
      resetTranscript: () => void;
      browserSupportsSpeechRecognition: boolean;
      startListening: () => void;
      stopListening: () => void;
    }
  
    export function useSpeechRecognition(): SpeechRecognitionHook;
  }
  