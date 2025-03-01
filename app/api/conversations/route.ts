import { auth } from "@clerk/nextjs/server"
import { connectToDatabase } from "@/lib/db/mongodb"
import { Conversation } from "@/lib/db/models/conversation"

export async function GET(req: Request) {
  const { userId } = await auth()
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }
  
  await connectToDatabase()
  
  try {
    // Find all conversations for this user, sorted by last updated
    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .select('_id title updatedAt')
      .lean()
    
    return Response.json(conversations)
  } catch (error) {
    console.error("Failed to fetch conversations:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}