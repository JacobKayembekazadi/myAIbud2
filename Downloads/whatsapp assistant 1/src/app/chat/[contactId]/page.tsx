"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Id } from "@/../convex/_generated/dataModel";
import { sendWhatsAppMessage } from "../actions";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export default function ChatPage() {
  const params = useParams();
  const contactId = params.contactId as Id<"contacts">;
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const contact = useQuery(api.contacts.getContact, { contactId });
  const messages = useQuery(api.interactions.getMessages, { contactId });

  const handleSend = async () => {
    if (!message.trim() || !contact) return;

    setSending(true);

    const result = await sendWhatsAppMessage(
      contact.instanceId,
      contactId,
      contact.tenantId,
      contact.phone,
      message
    );

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Message sent!");
      setMessage("");
    }
    setSending(false);
  };

  if (!contact) return <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white">{contact.name ?? contact.phone}</h3>
        <p className="text-sm text-gray-400">{contact.phone}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${msg.type === "outbound" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${msg.type === "outbound"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-white"
                }`}
            >
              <p>{msg.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 border-gray-700 text-white"
            onKeyDown={(e) => e.key === "Enter" && !sending && handleSend()}
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            className="bg-green-600 hover:bg-green-700"
            disabled={sending || !message.trim()}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
