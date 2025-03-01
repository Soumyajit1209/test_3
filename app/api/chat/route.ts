import { auth } from "@clerk/nextjs/server"
import { connectToDatabase } from "@/lib/db/mongodb"
import { Conversation } from "@/lib/db/models/conversation"

export async function POST(req: Request) {
  const { userId } = await auth()
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }
  
  const { userInput, conversationId } = await req.json()
  
  await connectToDatabase()
  
  try {
    const response = await fetch("https://api.globaltfn.tech/aboutazmth", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userInput }),
    })
    
    const data = await response.json()
    
    if (data.status_code === 200) {
      let conversation
      
      if (conversationId) {
        // Find existing conversation
        conversation = await Conversation.findById(conversationId)
        
        if (!conversation || conversation.userId !== userId) {
          return new Response("Conversation not found", { status: 404 })
        }
      } else {
        // Create new conversation with truncated first message as title
        const truncatedMessage = userInput.length > 50 
          ? userInput.slice(0, 50) + "..." 
          : userInput;
          
        conversation = new Conversation({
          userId,
          title: truncatedMessage,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      
      // Add the user message
      conversation.messages.push({
        role: "user",
        content: userInput,
      })
      
      // Add the assistant response
      conversation.messages.push({
        role: "assistant",
        content: data.data,
      })
      
      // Update the last modified time
      conversation.updatedAt = new Date()
      
      await conversation.save()
      
      return Response.json({
        conversationId: conversation._id,
        response: data.data,
      })
    }
    
    return Response.json(data)
  } catch (error) {
    console.error("Failed to process chat:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}