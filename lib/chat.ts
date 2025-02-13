const CHAT_API_URL = "https://api.globaltfn.tech/aboutazmth";

export async function getChatResponse(message: string): Promise<{ text: string; success: boolean }> {
  try {
    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userInput: message }),
    });

    const data = await response.json();
    //console.log("Full API Response:", data);

    if (!response.ok || !data.data) {
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${JSON.stringify(data)}`);
    }

    return { text: data.data, success: true };
  } catch (error) {
    console.error("Chat response failed:", error);
    return { text: "", success: false };
  }
}



