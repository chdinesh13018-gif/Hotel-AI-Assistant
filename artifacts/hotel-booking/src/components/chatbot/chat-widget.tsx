import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateGeminiConversation, useListGeminiMessages } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: number | string;
  role: "user" | "assistant" | "model";
  content: string;
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const createConversation = useCreateGeminiConversation();
  const { data: history } = useListGeminiMessages(conversationId as number, { 
    query: { enabled: !!conversationId } 
  });

  // Load history when available
  useEffect(() => {
    if (history) {
      setMessages(history as Message[]);
    }
  }, [history]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleOpen = () => {
    setIsOpen(true);
    if (!conversationId && !createConversation.isPending) {
      createConversation.mutate(
        { data: { title: "Hotel Assistant" } },
        {
          onSuccess: (data) => {
            setConversationId(data.id);
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content: "Welcome to Grand Vista Hotel! I'm your virtual concierge. How may I assist you today? I can help with room rates, amenities, and bookings."
              }
            ]);
          },
          onError: () => {
            toast({
              title: "Connection Error",
              description: "Could not connect to the assistant.",
              variant: "destructive",
            });
          }
        }
      );
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !conversationId || isTyping) return;
    
    const userMsg = inputValue.trim();
    setInputValue("");
    
    // Optimistically add user message
    const tempUserId = Date.now();
    setMessages(prev => [...prev, { id: tempUserId, role: "user", content: userMsg }]);
    setIsTyping(true);
    
    try {
      const response = await fetch(`/api/gemini/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: userMsg }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      const tempAsstId = Date.now() + 1;
      setMessages(prev => [...prev, { id: tempAsstId, role: "assistant", content: "" }]);

      let doneReading = false;
      
      while (!doneReading) {
        const { value, done } = await reader.read();
        doneReading = done;
        
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.done) {
                  setIsTyping(false);
                } else if (data.content) {
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === tempAsstId 
                        ? { ...msg, content: msg.content + data.content }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
      setIsTyping(false);
    }
  };

  return (
    <>
      <Button
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50 transition-transform hover:scale-105"
        size="icon"
        data-testid="button-chat-widget"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] max-h-[calc(100vh-8rem)] shadow-2xl z-50 flex flex-col border-primary/20 animate-in slide-in-from-bottom-5">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg py-3">
            <CardTitle className="flex items-center gap-2 text-lg font-serif">
              <Bot className="h-5 w-5" />
              Grand Vista Concierge
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4" ref={scrollRef}>
              <div className="flex flex-col gap-4">
                {messages.map((msg, idx) => (
                  <div 
                    key={msg.id || idx} 
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role !== 'user' && (
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-secondary-foreground" />
                      </div>
                    )}
                    
                    <div 
                      className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                          : 'bg-muted text-foreground rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-2 justify-start">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Loader2 className="h-4 w-4 animate-spin text-secondary-foreground" />
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-muted text-foreground rounded-tl-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          
          <CardFooter className="p-3 border-t bg-card">
            <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
              <Input
                type="text"
                placeholder="Ask about rooms, rates..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isTyping || createConversation.isPending}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!inputValue.trim() || isTyping || createConversation.isPending}
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
