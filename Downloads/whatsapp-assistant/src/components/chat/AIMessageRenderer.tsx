"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Bot, User, Clock, CheckCheck, AlertCircle, Sparkles } from "lucide-react";

interface AIMessageRendererProps {
  content: string;
  isAI?: boolean;
  timestamp?: number;
  status?: "sending" | "sent" | "delivered" | "failed";
  showAvatar?: boolean;
  className?: string;
}

/**
 * Renders AI or user messages with proper styling and markdown support.
 * Transforms raw text into beautiful, readable format.
 */
export function AIMessageRenderer({
  content,
  isAI = true,
  timestamp,
  status = "delivered",
  showAvatar = true,
  className,
}: AIMessageRendererProps) {
  // Parse and render markdown-like content
  const renderContent = (text: string) => {
    // Split into lines for processing
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listType: "ul" | "ol" | null = null;
    let inCodeBlock = false;
    let codeContent: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        const ListComponent = listType === "ol" ? "ol" : "ul";
        elements.push(
          <ListComponent
            key={`list-${elements.length}`}
            className={cn(
              "my-2 space-y-1",
              listType === "ol" ? "list-decimal list-inside" : "list-disc list-inside"
            )}
          >
            {listItems.map((item, i) => (
              <li key={i} className="text-sm leading-relaxed">
                {renderInlineStyles(item)}
              </li>
            ))}
          </ListComponent>
        );
        listItems = [];
        listType = null;
      }
    };

    const flushCodeBlock = () => {
      if (codeContent.length > 0) {
        elements.push(
          <pre
            key={`code-${elements.length}`}
            className="my-2 rounded-lg bg-slate-900 p-3 overflow-x-auto"
          >
            <code className="text-xs text-green-400 font-mono">
              {codeContent.join("\n")}
            </code>
          </pre>
        );
        codeContent = [];
      }
    };

    lines.forEach((line, index) => {
      // Code block handling
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          flushList();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith("### ")) {
        flushList();
        elements.push(
          <h4 key={index} className="font-semibold text-base mt-3 mb-1 text-slate-800 dark:text-slate-200">
            {renderInlineStyles(line.slice(4))}
          </h4>
        );
        return;
      }
      if (line.startsWith("## ")) {
        flushList();
        elements.push(
          <h3 key={index} className="font-bold text-lg mt-4 mb-2 text-slate-900 dark:text-slate-100">
            {renderInlineStyles(line.slice(3))}
          </h3>
        );
        return;
      }
      if (line.startsWith("# ")) {
        flushList();
        elements.push(
          <h2 key={index} className="font-bold text-xl mt-4 mb-2 text-slate-900 dark:text-slate-100">
            {renderInlineStyles(line.slice(2))}
          </h2>
        );
        return;
      }

      // Unordered lists (-, *, •)
      const ulMatch = line.match(/^[\s]*[-*•]\s+(.+)/);
      if (ulMatch) {
        if (listType !== "ul") {
          flushList();
          listType = "ul";
        }
        listItems.push(ulMatch[1]);
        return;
      }

      // Ordered lists (1., 2., etc.)
      const olMatch = line.match(/^[\s]*\d+[.)]\s+(.+)/);
      if (olMatch) {
        if (listType !== "ol") {
          flushList();
          listType = "ol";
        }
        listItems.push(olMatch[1]);
        return;
      }

      // Horizontal rule
      if (line.match(/^[-*_]{3,}$/)) {
        flushList();
        elements.push(<hr key={index} className="my-3 border-slate-200 dark:border-slate-700" />);
        return;
      }

      // Blockquote
      if (line.startsWith("> ")) {
        flushList();
        elements.push(
          <blockquote
            key={index}
            className="my-2 pl-4 border-l-4 border-blue-500 italic text-slate-600 dark:text-slate-400"
          >
            {renderInlineStyles(line.slice(2))}
          </blockquote>
        );
        return;
      }

      // Empty line
      if (line.trim() === "") {
        flushList();
        elements.push(<div key={index} className="h-2" />);
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={index} className="text-sm leading-relaxed my-1">
          {renderInlineStyles(line)}
        </p>
      );
    });

    flushList();
    flushCodeBlock();

    return elements;
  };

  // Render inline styles (bold, italic, links, etc.)
  const renderInlineStyles = (text: string): React.ReactNode => {
    // Process inline styles
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Match patterns in order: bold, italic, code, links, emoji-style highlights
    const patterns = [
      // Bold **text** or __text__
      { regex: /\*\*(.+?)\*\*|__(.+?)__/, render: (m: string) => <strong key={key++} className="font-semibold">{m}</strong> },
      // Italic *text* or _text_
      { regex: /\*(.+?)\*|_([^_]+)_/, render: (m: string) => <em key={key++} className="italic">{m}</em> },
      // Inline code `code`
      { regex: /`([^`]+)`/, render: (m: string) => <code key={key++} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono text-pink-600 dark:text-pink-400">{m}</code> },
      // Links [text](url)
      { regex: /\[([^\]]+)\]\(([^)]+)\)/, render: (_m: string, text: string, url: string) => <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800">{text}</a> },
      // Price/currency highlighting (R1,234 or $1,234)
      { regex: /(R|USD?\s*\$|€|£)[\s]?([\d,]+(?:\.\d{2})?)/, render: (m: string) => <span key={key++} className="font-semibold text-green-600 dark:text-green-400">{m}</span> },
    ];

    // Simple inline processing (for performance, we do a basic version)
    // Bold
    remaining = remaining.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    // Italic
    remaining = remaining.replace(/\*([^*]+)\*/g, '<i>$1</i>');
    // Inline code
    remaining = remaining.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Links
    remaining = remaining.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Convert to React nodes
    const htmlParts = remaining.split(/(<[^>]+>[^<]*<\/[^>]+>|<[^>]+\/>)/);

    return htmlParts.map((part, i) => {
      if (part.startsWith('<b>')) {
        return <strong key={i} className="font-semibold">{part.replace(/<\/?b>/g, '')}</strong>;
      }
      if (part.startsWith('<i>')) {
        return <em key={i} className="italic">{part.replace(/<\/?i>/g, '')}</em>;
      }
      if (part.startsWith('<code>')) {
        return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono text-pink-600 dark:text-pink-400">{part.replace(/<\/?code>/g, '')}</code>;
      }
      if (part.startsWith('<a')) {
        const hrefMatch = part.match(/href="([^"]+)"/);
        const textMatch = part.match(/>([^<]+)</);
        if (hrefMatch && textMatch) {
          return (
            <a
              key={i}
              href={hrefMatch[1]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
            >
              {textMatch[1]}
            </a>
          );
        }
      }
      return part;
    });
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const StatusIcon = () => {
    switch (status) {
      case "sending":
        return <Clock className="h-3 w-3 text-slate-400 animate-pulse" />;
      case "sent":
        return <CheckCheck className="h-3 w-3 text-slate-400" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "failed":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%]",
        isAI ? "self-start" : "self-end flex-row-reverse",
        className
      )}
    >
      {/* Avatar */}
      {showAvatar && (
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            isAI
              ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
              : "bg-gradient-to-br from-slate-600 to-slate-700 text-white"
          )}
        >
          {isAI ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 shadow-sm",
          isAI
            ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm"
            : "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-sm"
        )}
      >
        {/* Content */}
        <div className={cn("text-slate-800 dark:text-slate-200", !isAI && "text-white")}>
          {renderContent(content)}
        </div>

        {/* Footer */}
        <div
          className={cn(
            "flex items-center gap-2 mt-2 text-xs",
            isAI ? "text-slate-400" : "text-blue-100"
          )}
        >
          {timestamp && <span>{formatTime(timestamp)}</span>}
          {!isAI && <StatusIcon />}
          {isAI && (
            <span className="flex items-center gap-1">
              <Bot className="h-3 w-3" />
              AI
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Styled container for a full chat conversation
 */
export function ChatContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-4 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 min-h-[400px] rounded-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Typing indicator for AI responses
 */
export function AITypingIndicator() {
  return (
    <div className="flex gap-3 self-start max-w-[85%]">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
