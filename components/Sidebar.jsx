"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Plus,
  FolderClosed,
  MoreVertical,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Logo } from "./Logo";

const folders = [
  { name: "Work chats", chats: [] },
  { name: "Life chats", chats: [] },
  { name: "Projects chats", chats: [] },
  { name: "Clients chats", chats: [] },
];

const chats = [
  {
    id: "1",
    name: "Plan a 3-day trip",
    preview: "A 3-day trip to see the northern lights in Norway",
  },
  {
    id: "2",
    name: "Ideas for a customer loyalty program",
    preview: "Here are some ideas for a customer loyal...",
  },
  {
    id: "3",
    name: "Help me pick",
    preview: "Here are some gift ideas for your fishing loving...",
  },
];

export function Sidebar({ onNewChat }) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedFolder, setExpandedFolder] = useState(null);

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
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
      },
    }),
  };

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
        <motion.div
          variants={contentVariants}
          className="p-4 flex justify-between items-center"
        >
          <Logo />
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </motion.div>

        <AnimatePresence>
          {isOpen && (
            <motion.div variants={contentVariants} className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search" className="pl-8" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ScrollArea className="flex-1 px-2">
          <motion.div variants={contentVariants} className="space-y-4 p-2">
            <div className="space-y-2">
              <motion.h4
                variants={itemVariants}
                className="text-sm font-medium leading-none text-muted-foreground flex items-center justify-between"
              >
                Folders
                <Button variant="ghost" size="icon" className="h-4 w-4">
                  <Plus className="h-3 w-3" />
                </Button>
              </motion.h4>
              {folders.map((folder, i) => (
                <motion.div
                  key={folder.name}
                  custom={i}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 group"
                    onClick={() =>
                      setExpandedFolder(
                        expandedFolder === folder.name ? null : folder.name
                      )
                    }
                  >
                    <FolderClosed className="h-4 w-4" />
                    {isOpen && (
                      <>
                        {folder.name}
                        <motion.div
                          className="ml-auto"
                          animate={{
                            rotate: expandedFolder === folder.name ? 90 : 0,
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </motion.div>
                      </>
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>

            <div className="space-y-2">
              <motion.h4
                variants={itemVariants}
                className="text-sm font-medium leading-none text-muted-foreground"
              >
                Chats
              </motion.h4>
              {chats.map((chat, i) => (
                <motion.div
                  key={chat.id}
                  custom={i + folders.length}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left flex flex-col items-start gap-1 h-auto"
                  >
                    <span>{chat.name}</span>
                    {isOpen && chat.preview && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {chat.preview}
                      </span>
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </ScrollArea>

        <motion.div variants={contentVariants} className="p-4 border-t">
          <Button className="w-full gap-2" onClick={onNewChat}>
            <Plus className="h-4 w-4" />
            {isOpen && "New Chat"}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Sidebar;
