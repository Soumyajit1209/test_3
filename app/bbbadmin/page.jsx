"use client"

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

  const fetchVoices = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': apiKey },
      });
      const data = await response.json();
      setVoices(data.voices);
    } catch (error) {
      console.error('Error fetching voices:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteVoice = async (voiceId) => {
    try {
      await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
        method: 'DELETE',
        headers: { 'xi-api-key': apiKey },
      });
      setVoices(voices.filter((voice) => voice.voice_id !== voiceId));
    } catch (error) {
      console.error('Error deleting voice:', error);
    }
  };

  useEffect(() => {
    fetchVoices();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6">ElevenLabs Custom Voices</h1>
      {loading ? (
        <p className="text-center text-lg text-gray-500">Loading...</p>
      ) : (
        <ul className="space-y-4">
          {voices.map((voice) => (
            <li key={voice.voice_id} className="flex items-center justify-between bg-white shadow-md p-4 rounded-lg">
              <span className="font-medium text-gray-800">{voice.name}</span>
              <button 
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                onClick={() => deleteVoice(voice.voice_id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
      <button 
        className="mt-6 block mx-auto bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition"
        onClick={fetchVoices}
      >
        Refresh
      </button>
    </div>
  );
}