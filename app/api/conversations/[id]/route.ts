import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Conversation } from "@/lib/db/models/conversation";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  const id = params.id;
  
  try {
    await connectToDatabase();
    
    // Find the conversation by ID and user ID
    const conversation = await Conversation.findOne({
      _id: id,
      userId
    });
    
    if (!conversation) {
      return new Response("Conversation not found or not authorized", { status: 404 });
    }
    
    // Return the conversation with all its data including messages
    return Response.json(conversation);
  } catch (error) {
    console.error("Failed to fetch conversation:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  const id = params.id;
  
  await connectToDatabase();
  
  try {
    const result = await Conversation.findOneAndDelete({
      _id: id,
      userId
    });
    
    if (!result) {
      return new Response("Conversation not found or not authorized", { status: 404 });
    }
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Route handler for PATCH requests (for editing the title)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  const id = params.id;
  
  try {
    const body = await req.json();
    const { title } = body;
    
    if (!title || typeof title !== 'string' || !title.trim()) {
      return new Response("Invalid title", { status: 400 });
    }
    
    await connectToDatabase();
    
    // Verify ownership and update
    const updatedConversation = await Conversation.findOneAndUpdate(
      { _id: id, userId },
      { $set: { title: title.trim() } },
      { new: true }
    );
    
    if (!updatedConversation) {
      return new Response("Conversation not found or not authorized", { status: 404 });
    }
    
    return Response.json(updatedConversation);
  } catch (error) {
    console.error("Failed to update conversation:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}