"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Plus, 
  MessageSquare, 
  MoreVertical, 
  Menu, 
  Trash, 
  Edit,
  Check,
  X 
} from 'lucide-react';
import { Logo } from "./Logo";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const sidebarVariants = {
  open: {
    width: "320px",
    transition: { duration: 0.3, ease: "easeInOut" },
  },
  closed: {
    width: "60px",
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

const contentVariants = {
  open: {
    opacity: 1,
    x: 0,
    transition: { delay: 0.1, duration: 0.2 },
  },
  closed: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
    },
  }),
};

interface Conversation {
  _id: string;
  title: string;
  updatedAt: string;
}

interface ConversationGroup {
  label: string;
  conversations: Conversation[];
}

interface SidebarProps {
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
}

export function Sidebar({ onNewChat, onSelectConversation }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { isSignedIn } = useAuth();
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchConversations();
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // If we're deleting the currently selected conversation, clear it
        if (id === selectedId) {
          setSelectedId(null);
          onNewChat(); // Reset to empty chat
        }
        setConversations(prev => prev.filter(conv => conv._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const updateConversationTitle = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });
      
      if (response.ok) {
        setConversations(prev => 
          prev.map(conv => 
            conv._id === id ? { ...conv, title: newTitle } : conv
          )
        );
      }
    } catch (error) {
      console.error('Failed to update conversation title:', error);
    } finally {
      setEditingId(null);
    }
  };

  const handleEditStart = (e: React.MouseEvent, conversation: Conversation) => {
    e.stopPropagation(); // Prevent conversation selection
    setEditingId(conversation._id);
    setEditTitle(conversation.title);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleEditSave = () => {
    if (editingId) {
      updateConversationTitle(editingId, editTitle);
    }
  };

  const handleConversationSelect = (id: string) => {
    // Don't select if we're in edit mode or deletion mode
    if (editingId || deletingId) return;
    
    setSelectedId(id);
    onSelectConversation(id);
    
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent conversation selection
    setDeletingId(id);
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChatClick = () => {
    setSelectedId(null);
    onNewChat();
    // Optionally close the sidebar on mobile after creating new chat
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  // Group conversations by date
  const groupConversations = (conversations: Conversation[]): ConversationGroup[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000; // 24 hours in milliseconds
    const lastWeek = today - 86400000 * 7; // 7 days in milliseconds

    return [
      {
        label: 'Today',
        conversations: conversations.filter(c => {
          const date = new Date(c.updatedAt).getTime();
          return date >= today;
        }),
      },
      {
        label: 'Yesterday',
        conversations: conversations.filter(c => {
          const date = new Date(c.updatedAt).getTime();
          return date >= yesterday && date < today;
        }),
      },
      {
        label: 'Last 7 days',
        conversations: conversations.filter(c => {
          const date = new Date(c.updatedAt).getTime();
          return date >= lastWeek && date < yesterday;
        }),
      },
      {
        label: 'Older',
        conversations: conversations.filter(c => {
          const date = new Date(c.updatedAt).getTime();
          return date < lastWeek;
        }),
      },
    ].filter(group => group.conversations.length > 0);
  };

  const groupedConversations = groupConversations(filteredConversations);

  return (
    <motion.div
      initial="open"
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      className="relative h-screen bg-background border-r overflow-hidden"
    >
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden absolute right-2 top-2 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex flex-col h-full">
        {/* Header */}
        <motion.div
          variants={contentVariants}
          className="p-4 flex justify-between items-center"
        >
          <Logo className=""/>
          
          <div className="flex items-center gap-2">
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Search */}
        <AnimatePresence>
          {isOpen && (
            <motion.div variants={contentVariants} className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search conversations..." 
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversations List */}
        <ScrollArea className="flex-1 px-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-20">
              <motion.div 
                className="h-4 w-4 rounded-full bg-primary"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
          ) : (
            <motion.div variants={contentVariants} className="space-y-4 p-2">
              {groupedConversations.length > 0 ? (
                groupedConversations.map((group, groupIndex) => (
                  <div key={group.label} className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground px-2">
                      {group.label}
                    </h3>
                    <div className="space-y-1">
                      {group.conversations.map((conversation, i) => (
                        <motion.div
                          key={conversation._id}
                          custom={i}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          className="relative group"
                        >
                          {editingId === conversation._id ? (
                            <div className="flex items-center w-full px-2 py-1 rounded-md bg-muted">
                              <Input
                                ref={editInputRef}
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="flex-1 mr-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditSave();
                                  if (e.key === 'Escape') handleEditCancel();
                                }}
                              />
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={handleEditSave}
                                className="h-8 w-8"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={handleEditCancel}
                                className="h-8 w-8"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className={`relative flex items-center w-full rounded-md ${
                                selectedId === conversation._id ? 'bg-muted' : 'hover:bg-muted/50'
                              }`}
                            >
                              <div
                                className="cursor-pointer py-2 px-3 flex-1 flex items-center"
                                onClick={() => handleConversationSelect(conversation._id)}
                              >
                                <span className="flex items-center gap-2 truncate w-full">
                                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate font-medium">{conversation.title}</span>
                                </span>
                                {isOpen && (
                                  <span className="text-xs text-muted-foreground ml-2 hidden md:inline flex-shrink-0">
                                    {new Date(conversation.updatedAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                )}
                              </div>
                              
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mr-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8"
                                      onClick={(e) => e.stopPropagation()} // Prevent triggering conversation selection
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => handleEditStart(e, conversation)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit title
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={(e) => handleDelete(e, conversation._id)}
                                    >
                                      <Trash className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                </div>
              )}
            </motion.div>
          )}
        </ScrollArea>

        {/* New Chat Button */}
        <motion.div variants={contentVariants} className="p-4 border-t">
          <Button 
            className="w-full gap-2" 
            onClick={handleNewChatClick}
            variant="default"
          >
            <Plus className="h-4 w-4" />
            {isOpen && "New Chat"}
          </Button>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This conversation will be permanently deleted from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingId && deleteConversation(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

export default Sidebar;