"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Image, Smile, Info, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useLanguage } from "@/context/LanguageContext";

interface Message {
  id: string;
  sender: "user" | "contact";
  text: string;
  timestamp: Date;
}

interface Contact {
  id: string;
  displayName: string;
  username: string;
  avatar: string;
  response: string;
  initialMessages: Message[];
}

const initialContacts: Contact[] = [
  {
    id: "elon",
    displayName: "Elon Musk",
    username: "elonmusk",
    avatar: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400",
    response: "Interesting point. Next level! Tesla and SpaceX are working on this. 🚀 Live life multiplanetary!",
    initialMessages: [
      { id: "e1", sender: "contact", text: "Welcome to X DMs! What's on your mind?", timestamp: new Date(Date.now() - 3600000 * 2) },
    ]
  },
  {
    id: "modi",
    displayName: "Narendra Modi",
    username: "narendramodi",
    avatar: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400",
    response: "Thank you for writing. Your ideas contribute to building a stronger nation. Jai Hind! 🇮🇳",
    initialMessages: [
      { id: "m1", sender: "contact", text: "Greetings! Happy to connect here.", timestamp: new Date(Date.now() - 3600000 * 5) }
    ]
  },
  {
    id: "science",
    displayName: "Science Bot",
    username: "science_bot",
    avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
    response: "A query about the cosmos? Quantum mechanics explains that particles can exist in multiple states. 🧪🔭 Keep exploring!",
    initialMessages: [
      { id: "s1", sender: "contact", text: "Science Bot active. Ask me any scientific hypothesis.", timestamp: new Date(Date.now() - 3600000 * 10) }
    ]
  }
];

export default function MessagesPage() {
  const { t } = useLanguage();
  const [selectedContact, setSelectedContact] = useState<Contact>(initialContacts[0]);
  const [chatHistories, setChatHistories] = useState<Record<string, Message[]>>(() => {
    const histories: Record<string, Message[]> = {};
    initialContacts.forEach(c => {
      histories[c.id] = c.initialMessages;
    });
    return histories;
  });
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMessages = chatHistories[selectedContact.id] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages, isTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: "user",
      text: inputValue.trim(),
      timestamp: new Date()
    };

    // Update state with user message
    setChatHistories(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), userMessage]
    }));
    setInputValue("");

    // Simulate typing
    setIsTyping(true);
    setTimeout(() => {
      const contactReply: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: "contact",
        text: selectedContact.response,
        timestamp: new Date()
      };

      setChatHistories(prev => ({
        ...prev,
        [selectedContact.id]: [...(prev[selectedContact.id] || []), contactReply]
      }));
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-black text-white flex h-screen overflow-hidden">
      {/* Left Pane - Contacts List */}
      <div className="w-80 border-r border-gray-800 flex flex-col h-full bg-black">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{t("messages.title")}</h1>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-900">
          {initialContacts.map(contact => {
            const history = chatHistories[contact.id] || [];
            const lastMsg = history[history.length - 1];

            return (
              <div
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact);
                  setIsTyping(false);
                }}
                className={`flex items-center space-x-3 p-4 hover:bg-gray-900/40 transition-colors cursor-pointer ${
                  selectedContact.id === contact.id ? "bg-gray-900/30 border-r-2 border-blue-500" : ""
                }`}
              >
                <Avatar className="h-11 w-11">
                  <AvatarImage src={contact.avatar} alt={contact.displayName} />
                  <AvatarFallback>{contact.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm truncate">{contact.displayName}</span>
                    <span className="text-xs text-gray-500">
                      {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 truncate">@{contact.username}</div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {lastMsg ? (lastMsg.sender === "user" ? "You: " : "") + lastMsg.text : "No messages yet"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Pane - Chat Window */}
      <div className="flex-1 flex flex-col h-full bg-black">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black/90 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={selectedContact.avatar} alt={selectedContact.displayName} />
              <AvatarFallback>{selectedContact.displayName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold text-sm text-white leading-tight">{selectedContact.displayName}</div>
              <div className="text-xs text-gray-400">@{selectedContact.username}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="p-2 rounded-full hover:bg-gray-900 text-gray-400 hover:text-white">
            <Info className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
          {activeMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md p-3.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-900 text-white rounded-bl-none border border-gray-800"
                }`}
              >
                {msg.text}
                <span className="block text-[10px] text-gray-400 mt-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing indicator bubble */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-900 text-white rounded-2xl rounded-bl-none border border-gray-800 p-3.5 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-800 bg-black flex items-center space-x-3">
          <Button type="button" variant="ghost" size="sm" className="p-2 text-blue-400 hover:bg-blue-950/20 rounded-full">
            <Image className="h-5 w-5" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="p-2 text-blue-400 hover:bg-blue-950/20 rounded-full">
            <Smile className="h-5 w-5" />
          </Button>

          <Input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={t("messages.typeMessage")}
            className="flex-1 bg-gray-900 border-none rounded-full text-white placeholder-gray-500 px-4 py-2 h-10 text-sm focus-visible:ring-1 focus-visible:ring-blue-500"
            disabled={isTyping}
          />

          <Button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-full p-2 h-10 w-10 flex items-center justify-center transition-colors"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
