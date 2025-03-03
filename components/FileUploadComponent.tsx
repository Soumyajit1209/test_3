"use client";

import React, { useState } from "react";
import { Upload, Link, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadComponentProps {
  userId: string;
  onUploadSuccess?: () => void;
}

export default function FileUploadComponent({ userId, onUploadSuccess }: FileUploadComponentProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [url, setUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF file",
      });
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);

      const response = await fetch("/api/upload/pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: (error as Error).message || "Failed to upload file",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUrlSubmit = async () => {
    if (!url || !url.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid URL",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const response = await fetch("/api/upload/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`URL processing failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: "URL processed successfully",
      });
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("URL processing error:", error);
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: (error as Error).message || "Failed to process URL",
      });
    } finally {
      setIsUploading(false);
      setUrl("");
      setShowUrlInput(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        className="hidden"
        accept="application/pdf"
        onChange={handleFileChange}
        ref={fileInputRef}
      />
      
      {showUrlInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
            placeholder="Enter web URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleUrlSubmit();
            }}
          />
          <button
            className="px-3 py-2 bg-white text-black rounded-lg hover:bg-gray-400 transition-colors"
            onClick={handleUrlSubmit}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Link className="h-5 w-5" />
            )}
          </button>
          <button
            className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            onClick={() => setShowUrlInput(false)}
            disabled={isUploading}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Upload PDF"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
          </button>
          <button
            className="p-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            onClick={() => setShowUrlInput(true)}
            disabled={isUploading}
            title="Add URL"
          >
            <Link className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}