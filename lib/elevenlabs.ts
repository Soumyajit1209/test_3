import axios from "axios"

const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"

export async function cloneVoice(audioBlob: Blob, userName: string): Promise<{ voice_id: string; success: boolean }> {
  const formData = new FormData()
  formData.append("name", userName)
  formData.append("files", audioBlob, "voice_sample.wav")

  try {
    const response = await axios.post(`${ELEVENLABS_API_URL}/voices/add`, formData, {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "multipart/form-data",
      },
    })

    return { voice_id: response.data.voice_id, success: true }
  } catch (error) {
    console.error("Voice cloning failed:", error)
    return { voice_id: "", success: false }
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
      },
    )

    const audioBlob = new Blob([response.data], { type: "audio/mpeg" })
    return URL.createObjectURL(audioBlob)
  } catch (error) {
    console.error("Voice synthesis failed:", error)
    return null
  }
}

