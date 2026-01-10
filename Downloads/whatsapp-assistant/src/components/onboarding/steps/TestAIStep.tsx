"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface TestAIStepProps {
  tenantId: Id<"tenants">;
  instanceId: string;
  onComplete: () => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SAMPLE_MESSAGES = [
  "Hello! What can you help me with?",
  "What are your business hours?",
  "Do you have any special offers?",
  "Can I schedule an appointment?",
];

export function TestAIStep({ tenantId, instanceId, onComplete }: TestAIStepProps) {
  const markAITested = useMutation(api.tenants.markAITested);
  const createDemoContact = useMutation(api.contacts.createDemoContact);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AI assistant. Try sending me a message to see how I respond to your customers. 🤖",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasTestedAI, setHasTestedAI] = useState(false);

  const simulateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
      return "Hello! Welcome to our business. How can I assist you today? I can help with product information, scheduling, pricing, and more!";
    }
    if (lowerMessage.includes("hours") || lowerMessage.includes("open")) {
      return "We're open Monday through Friday, 9 AM to 6 PM, and Saturday 10 AM to 4 PM. We're closed on Sundays. Is there anything specific you'd like to know about?";
    }
    if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("offer")) {
      return "We have various pricing options depending on your needs! Our starter package begins at $99/month. Would you like me to send you detailed pricing information?";
    }
    if (lowerMessage.includes("appointment") || lowerMessage.includes("schedule") || lowerMessage.includes("book")) {
      return "I'd be happy to help you schedule an appointment! What day works best for you? We have availability throughout the week.";
    }
    if (lowerMessage.includes("thank")) {
      return "You're welcome! Is there anything else I can help you with today? 😊";
    }
    
    return "Thank you for your message! I understand you're asking about \"" + userMessage.slice(0, 50) + "\". Let me help you with that. Our team is available to provide detailed information. Would you like me to connect you with a specialist?";
  };

  const handleSendMessage = async (content: string = inputValue) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: simulateAIResponse(content),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiResponse]);
    setIsLoading(false);

    if (!hasTestedAI) {
      setHasTestedAI(true);
      await markAITested({ tenantId });
      if (instanceId) {
        await createDemoContact({ tenantId, instanceId });
      }
    }
  };

  const handleComplete = async () => {
    toast.success("🎉 Setup complete! Your AI assistant is ready.");
    onComplete();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium mb-3">
          <Sparkles className="w-3 h-3" />
          Live Demo
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Test Your AI Assistant</h2>
        <p className="text-gray-400 text-sm">
          See how the AI responds to customer messages
        </p>
      </div>

      {/* Chat Interface */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-0">
          {/* Messages */}
          <ScrollArea className="h-[240px] p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      message.role === "assistant"
                        ? "bg-gradient-to-br from-emerald-500 to-green-600"
                        : "bg-gray-700"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <Bot className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      message.role === "assistant"
                        ? "bg-gray-700 text-white rounded-tl-sm"
                        : "bg-emerald-600 text-white rounded-tr-sm"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Replies */}
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-2">Try these messages:</p>
            <div className="flex gap-2 flex-wrap">
              {SAMPLE_MESSAGES.slice(0, 3).map((msg) => (
                <Badge
                  key={msg}
                  variant="outline"
                  className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white cursor-pointer text-xs py-1"
                  onClick={() => handleSendMessage(msg)}
                >
                  {msg}
                </Badge>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                placeholder="Type a message..."
                className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputValue.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Button */}
      <Button
        onClick={handleComplete}
        className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-semibold rounded-xl"
      >
        <CheckCircle2 className="w-5 h-5 mr-2" />
        {hasTestedAI ? "Complete Setup" : "Skip & Complete Setup"}
      </Button>

      {hasTestedAI && (
        <p className="text-center text-xs text-emerald-400">
          ✓ AI test completed! You&apos;re ready to go.
        </p>
      )}
    </div>
  );
}


