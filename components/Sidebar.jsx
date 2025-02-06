"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, FolderClosed, MoreVertical } from "lucide-react";
import { Logo } from "./Logo";

const folders = [
  {
    name: "Work chats",
    chats: []
  },
  {
    name: "Life chats",
    chats: []
  },
  {
    name: "Projects chats",
    chats: []
  },
  {
    name: "Clients chats",
    chats: []
  }
];

const chats = [
  {
    id: "1",
    name: "Plan a 3-day trip",
    preview: "A 3-day trip to see the northern lights in Norway"
  },
  {
    id: "2",
    name: "Ideas for a customer loyalty program",
    preview: "Here are some ideas for a customer loyal..."
  },
  {
    id: "3",
    name: "Help me pick",
    preview: "Here are some gift ideas for your fishing loving..."
  }
];

export function Sidebar({ onNewChat }) {
  return (
    <div className="flex h-screen w-80 flex-col bg-background border-r">
      <div className="p-4 flex justify-between items-center">
        <Logo />
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search" className="pl-8" />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 p-2">
          <div className="space-y-2">
            <h4 className="text-sm font-medium leading-none text-muted-foreground flex items-center justify-between">
              Folders
              <Button variant="ghost" size="icon" className="h-4 w-4">
                <Plus className="h-3 w-3" />
              </Button>
            </h4>
            {folders.map((folder) => (
              <Button
                key={folder.name}
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <FolderClosed className="h-4 w-4" />
                {folder.name}
                <MoreVertical className="h-4 w-4 ml-auto" />
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium leading-none text-muted-foreground">Chats</h4>
            {chats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                className="w-full justify-start text-left flex flex-col items-start gap-1 h-auto"
              >
                <span>{chat.name}</span>
                {chat.preview && (
                  <span className="text-xs text-muted-foreground line-clamp-1">
                    {chat.preview}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button className="w-full gap-2" onClick={onNewChat}>
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
    </div>
  );
}