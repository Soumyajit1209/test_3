import axios from "axios";

const FALLBACK_VOICE_IDS = [
  "prWuvshrvr3mOPVsV6bJ", // dron guin
  "z8nv38zRVDhoymPBPACM"  // random voice
]
const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

export async function cloneVoice(audioBlob: Blob, userName: string): Promise<{ voice_id: string; success: boolean ; isUsingFallback: boolean }> {
  const formData = new FormData();
  formData.append("name", userName);
  formData.append("files", audioBlob, "voice_sample.wav");

  try {
    const response = await axios.post(`${ELEVENLABS_API_URL}/voices/add`, formData, {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "multipart/form-data",
      },
    });

    const voice_id = response.data.voice_id;
    
    // Store voice_id and username in session storage
    if (typeof window !== "undefined") {
      sessionStorage.setItem("voice_id", voice_id);
      sessionStorage.setItem("user_name", userName);
    }
    return { voice_id, success: true , isUsingFallback: false };
  } catch (error) {
    console.error("Voice cloning failed:", error)
    // Select a random fallback voice ID
    const fallbackVoiceId = FALLBACK_VOICE_IDS[Math.floor(Math.random() * FALLBACK_VOICE_IDS.length)]
    console.log("Using fallback voice ID:", fallbackVoiceId)

    if (typeof window !== "undefined") {
      sessionStorage.setItem("voice_id", fallbackVoiceId)
      sessionStorage.setItem("user_name", userName)
    }
    return { voice_id: fallbackVoiceId, success: true, isUsingFallback: true }
  }
}

export async function deleteVoice(voice_id: string): Promise<boolean> {
  try {
    await axios.delete(`${ELEVENLABS_API_URL}/voices/${voice_id}`, {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    });

    console.log("Voice deleted successfully:", voice_id);
    return true;
  } catch (error) {
    console.error("Voice deletion failed:", error);
    return false;
  }
}

export async function synthesizeVoice(text: string, voice_id: string): Promise<string | null> {
  try {
    const response = await axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voice_id}`,
      { text },
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
    return URL.createObjectURL(audioBlob);
  } catch (error) {
    console.error("Voice synthesis failed:", error);
    return null;
  }
}


export function registerUnloadHandler() {
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", async () => {
      const voice_id = sessionStorage.getItem("voice_id");
      if (voice_id) {
        await deleteVoice(voice_id);
        sessionStorage.removeItem("voice_id");
        sessionStorage.removeItem("user_name");
      }
    });
  }
}
