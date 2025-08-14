"use client";

import { Loader2, FileText, File, FolderPlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCallDisplayProps {
  toolName: string;
  state: "call" | "result" | string;
  args?: Record<string, any>;
  result?: any;
  className?: string;
}

export function ToolCallDisplay({ 
  toolName, 
  state, 
  args = {}, 
  result,
  className 
}: ToolCallDisplayProps) {
  const getToolInfo = () => {
    switch (toolName) {
      case "str_replace_editor": {
        const command = args.command;
        const path = args.path;
        
        switch (command) {
          case "create":
            return {
              icon: <FileText className="w-3 h-3" />,
              message: `Creating file: ${path}`,
              color: "emerald"
            };
          case "str_replace":
            return {
              icon: <FileText className="w-3 h-3" />,
              message: `Editing file: ${path}`,
              color: "blue"
            };
          case "view":
            return {
              icon: <File className="w-3 h-3" />,
              message: `Viewing file: ${path}`,
              color: "neutral"
            };
          case "insert":
            return {
              icon: <FileText className="w-3 h-3" />,
              message: `Inserting into file: ${path}`,
              color: "blue"
            };
          default:
            return {
              icon: <FileText className="w-3 h-3" />,
              message: `File operation: ${path}`,
              color: "neutral"
            };
        }
      }
      
      case "file_manager": {
        const command = args.command;
        const path = args.path;
        const newPath = args.new_path;
        
        switch (command) {
          case "rename":
            return {
              icon: <FolderPlus className="w-3 h-3" />,
              message: `Renaming: ${path} → ${newPath}`,
              color: "orange"
            };
          case "delete":
            return {
              icon: <Trash2 className="w-3 h-3" />,
              message: `Deleting: ${path}`,
              color: "red"
            };
          default:
            return {
              icon: <File className="w-3 h-3" />,
              message: `File management: ${path}`,
              color: "neutral"
            };
        }
      }
      
      default:
        return {
          icon: <File className="w-3 h-3" />,
          message: toolName.replace(/_/g, " "),
          color: "neutral"
        };
    }
  };

  const { icon, message, color } = getToolInfo();
  
  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200", 
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-neutral-50 text-neutral-700 border-neutral-200"
  };

  const statusDot = state === "result" && result ? (
    <div className={cn(
      "w-2 h-2 rounded-full",
      color === "emerald" ? "bg-emerald-500" :
      color === "blue" ? "bg-blue-500" :
      color === "orange" ? "bg-orange-500" :
      color === "red" ? "bg-red-500" :
      "bg-neutral-500"
    )} />
  ) : (
    <Loader2 className={cn(
      "w-3 h-3 animate-spin",
      color === "emerald" ? "text-emerald-600" :
      color === "blue" ? "text-blue-600" :
      color === "orange" ? "text-orange-600" :
      color === "red" ? "text-red-600" :
      "text-neutral-600"
    )} />
  );

  return (
    <div className={cn(
      "inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg text-xs border",
      colorClasses[color as keyof typeof colorClasses],
      className
    )}>
      {statusDot}
      {icon}
      <span className="font-medium">{message}</span>
    </div>
  );
}
