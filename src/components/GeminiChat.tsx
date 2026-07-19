import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  List,
  ListItem,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip
} from "@mui/material";
import {
  Sparkles,
  Send,
  Trash2,
  Bot,
  User,
  Calendar,
  DollarSign,
  Briefcase,
  Layers,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../services/firebase";
import { offlineService } from "../services/offlineService";
import { Booking } from "../types";

interface Message {
  role: "user" | "model";
  parts: { text: string }[];
}

export const GeminiChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Bookings state for optional context loading
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage and pull bookings for context selection
  useEffect(() => {
    const savedChat = localStorage.getItem("asmaul_production_ai_chat");
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {
        console.error("Failed to parse saved chat", e);
      }
    } else {
      // Set initial greeting
      setMessages([
        {
          role: "model",
          parts: [
            {
              text: "Welcome to your **Cinematic AI Copilot**! I'm here to help you manage Asmaul Production. You can ask me to draft client emails, analyze wedding bookings, prepare custom Telegram templates, or track payment summaries. Select a booking below to inject real-time context directly into our session!"
            }
          ]
        }
      ]);
    }

    // Load actual bookings to provide live context
    const loadBookings = async () => {
      try {
        const list = await offlineService.getBookings();
        setBookings(list);
      } catch (err) {
        console.error("Failed to load bookings context", err);
      }
    };
    loadBookings();
  }, []);

  // Save chat to localStorage on updates
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("asmaul_production_ai_chat", JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleBookingChange = (id: string) => {
    setSelectedBookingId(id);
    const bookingObj = bookings.find(b => b.id === id) || null;
    setSelectedBooking(bookingObj);
    
    if (bookingObj) {
      // Append info chip about context injected
      const infoMsg: Message = {
        role: "user",
        parts: [
          {
            text: `[System Action] Selected booking context: ${bookingObj.clientName} (${bookingObj.bookingFor || bookingObj.type} - ${bookingObj.packageName})`
          }
        ]
      };
      setMessages(prev => [...prev, infoMsg]);
    }
  };

  const clearChat = () => {
    localStorage.removeItem("asmaul_production_ai_chat");
    setMessages([
      {
        role: "model",
        parts: [
          {
            text: "Chat cleared. I'm ready for your next instruction. How can I assist you with Asmaul Production today?"
          }
        ]
      }
    ]);
    setSelectedBookingId("");
    setSelectedBooking(null);
    setError(null);
  };

  const handleSend = async (textToSend?: string) => {
    const activeInput = textToSend || input;
    if (!activeInput.trim() || loading) return;

    setError(null);
    if (!textToSend) setInput("");

    // Build the user message
    const userMessage: Message = {
      role: "user",
      parts: [{ text: activeInput }]
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("You must be logged in to access Cinematic AI.");
      }

      const idToken = await user.getIdToken();

      // Inject selected booking details into context if present
      let finalContents = [...nextMessages];
      if (selectedBooking) {
        const pendingBal = (selectedBooking.totalAmount || 0) - (selectedBooking.paidAmount || 0);
        const contextStr = `\n[INJECTED BOOKING CONTEXT]\nClient Name: ${selectedBooking.clientName}\nType: ${selectedBooking.bookingFor || selectedBooking.type}\nPackage: ${selectedBooking.packageName}\nNet Amount: ₹${selectedBooking.totalAmount}\nTotal Paid: ₹${selectedBooking.paidAmount}\nPending: ₹${pendingBal}\nLocation/Venue: ${selectedBooking.venue || "N/A"}\nDates: ${JSON.stringify(selectedBooking.events || [])}\n[END CONTEXT]`;
        
        // Add context to the last message part for the model to see
        const lastMsg = finalContents[finalContents.length - 1];
        finalContents[finalContents.length - 1] = {
          ...lastMsg,
          parts: [{ text: lastMsg.parts[0].text + contextStr }]
        };
      }

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          contents: finalContents,
          systemInstruction: "You are the Cinematic AI Copilot for Asmaul Production, an elite, premium photography and videography studio management ledger. You possess profound wisdom in wedding timelines, creative photography direction, financial auditing, and client correspondence. Format your output elegantly in Markdown with clear headings and bullet points. Match the high-end luxury tone of the studio."
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch response from Gemini.");
      }

      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          parts: [{ text: data.text }]
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    let text = suggestion;
    if (selectedBooking) {
      const pendingBal = (selectedBooking.totalAmount || 0) - (selectedBooking.paidAmount || 0);
      if (suggestion.includes("Draft Client Email")) {
        text = `Draft a luxurious, polite email to ${selectedBooking.clientName} thanking them for booking Asmaul Production. Include their package details: ${selectedBooking.packageName} and kindly remind them of their pending balance of ₹${pendingBal}.`;
      } else if (suggestion.includes("Telegram Notification")) {
        text = `Format a highly structured Telegram Notification layout for ${selectedBooking.clientName}'s booking: ${selectedBooking.bookingFor || selectedBooking.type}, specifying the package ${selectedBooking.packageName}, and detailing dates from the schedule.`;
      } else if (suggestion.includes("Timeline")) {
        text = `Suggest an optimized wedding day photography schedule and timeline for ${selectedBooking.clientName}'s event.`;
      }
    }
    handleSend(text);
  };

  return (
    <Box className="flex flex-col h-full bg-[#0D0D0C] text-[#F5F5F0]">
      {/* Premium Header */}
      <Box className="p-5 border-b border-[#D4AF37]/20 flex flex-wrap items-center justify-between gap-4 bg-[#141413]">
        <Box className="flex items-center gap-3">
          <Box className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] rounded-lg">
            <Sparkles className="w-6 h-6 text-black" />
          </Box>
          <Box>
            <Typography variant="h5" className="text-gold-gradient font-serif font-bold tracking-wide uppercase">
              Cinematic AI Copilot
            </Typography>
            <Typography variant="caption" className="text-gray-400 font-mono tracking-wider">
              Gemini-Powered Intelligence
            </Typography>
          </Box>
        </Box>

        <Box className="flex items-center gap-2">
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={clearChat}
            startIcon={<Trash2 className="w-4 h-4" />}
            className="border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#D4AF37] font-mono text-xs"
          >
            Clear History
          </Button>
        </Box>
      </Box>

      {/* Booking Context Selection Panel */}
      <Box className="p-4 bg-[#141413] border-b border-[#D4AF37]/10 flex flex-wrap items-center gap-4">
        <Typography variant="body2" className="text-[#D4AF37] font-serif font-medium flex items-center gap-2">
          <Layers className="w-4 h-4" /> Inject Active Booking Context:
        </Typography>
        <FormControl size="small" className="min-w-[280px]">
          <InputLabel id="booking-context-label" className="text-gray-400">Select Booking...</InputLabel>
          <Select
            labelId="booking-context-label"
            id="booking-context-select"
            value={selectedBookingId}
            label="Select Booking..."
            onChange={(e) => handleBookingChange(e.target.value as string)}
            className="bg-black/40 border border-[#D4AF37]/20 text-[#F5F5F0]"
            sx={{
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D4AF37' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#D4AF37' },
              color: '#F5F5F0',
            }}
          >
            <MenuItem value="">
              <em>None (General Chat)</em>
            </MenuItem>
            {bookings.map((b) => (
              <MenuItem key={b.id} value={b.id} className="text-sm">
                {b.clientName} - {b.bookingFor || b.type} ({b.packageName})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedBooking && (
          <Chip
            icon={<CheckCircle className="w-3.5 h-3.5 text-black" />}
            label="Live Context Active"
            size="small"
            className="bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black font-semibold font-mono"
          />
        )}
      </Box>

      {/* Messages Scroll Area */}
      <Box className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-[#0D0D0C] to-[#121211]">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            // Strip out [System Action] headers for clean UI
            const isSystemAction = msg.parts[0].text.startsWith("[System Action]");
            
            if (isSystemAction) {
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center my-2"
                >
                  <Paper className="bg-[#1a1505]/40 border border-[#D4AF37]/10 px-4 py-2 rounded-full">
                    <Typography variant="caption" className="text-[#D4AF37]/80 font-mono flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      {msg.parts[0].text}
                    </Typography>
                  </Paper>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <Avatar
                  className={`${
                    isUser
                      ? "bg-[#333330] text-white"
                      : "bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black"
                  } w-8 h-8`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </Avatar>

                <Box className="space-y-1">
                  <Box className="flex items-center gap-2">
                    <Typography variant="caption" className="text-gray-400 font-semibold font-mono">
                      {isUser ? "YOU" : "CINEMATIC CO-PILOT"}
                    </Typography>
                  </Box>
                  
                  <Paper
                    className={`p-4 rounded-xl shadow-md border ${
                      isUser
                        ? "bg-[#1C1C1A] border-[#D4AF37]/10 text-[#F5F5F0]"
                        : "bg-[#141413] border-[#D4AF37]/30 text-[#F5F5F0]"
                    }`}
                  >
                    <Typography
                      component="div"
                      variant="body2"
                      className="whitespace-pre-wrap leading-relaxed markdown-body text-sm font-light text-gray-100"
                      sx={{
                        '& strong': { color: '#D4AF37', fontWeight: 600 },
                        '& em': { color: '#E5D595' },
                        '& li': { listStyleType: 'disc', margin: '4px 0 4px 16px' },
                        '& p': { marginBottom: '8px' }
                      }}
                    >
                      {/* Simple custom renderer for markdown strong, points */}
                      {msg.parts[0].text.split("\n").map((line, lIdx) => {
                        let content: React.ReactNode = line;
                        
                        // Bold parsing
                        if (line.includes("**")) {
                          const parts = line.split("**");
                          content = parts.map((part, pIdx) => 
                            pIdx % 2 === 1 ? <strong key={pIdx}>{part}</strong> : part
                          );
                        }
                        
                        // List items
                        if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
                          return (
                            <li key={lIdx} className="ml-4 list-disc text-sm text-gray-300 py-0.5">
                              {content}
                            </li>
                          );
                        }

                        return (
                          <p key={lIdx} className="mb-1">
                            {content}
                          </p>
                        );
                      })}
                    </Typography>
                  </Paper>
                </Box>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading && (
          <Box className="flex gap-3 max-w-[85%] mr-auto">
            <Avatar className="bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black w-8 h-8">
              <Bot className="w-4 h-4" />
            </Avatar>
            <Box className="space-y-1">
              <Typography variant="caption" className="text-gray-400 font-semibold font-mono">
                CINEMATIC CO-PILOT
              </Typography>
              <Paper className="p-4 rounded-xl bg-[#141413] border border-[#D4AF37]/20 flex items-center gap-3">
                <CircularProgress size={16} className="text-[#D4AF37]" />
                <Typography variant="body2" className="text-gray-400 font-mono text-xs italic animate-pulse">
                  Analyzing studio metrics, formatting premium response...
                </Typography>
              </Paper>
            </Box>
          </Box>
        )}

        {error && (
          <Box className="flex justify-center">
            <Paper className="bg-red-950/40 border border-red-500/20 p-3 rounded-lg max-w-[90%]">
              <Typography variant="body2" className="text-red-400 font-mono text-xs">
                ⚠️ Connection Error: {error}
              </Typography>
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Suggested Actions Selector */}
      <Box className="px-5 py-3 bg-[#141413]/50 border-t border-[#D4AF37]/10">
        <Typography variant="caption" className="text-[#D4AF37] uppercase font-mono tracking-widest block mb-2">
          ⚡ Quick Intelligence Commands:
        </Typography>
        <Box className="flex flex-wrap gap-2">
          {selectedBooking ? (
            <>
              <Chip
                label="✉️ Draft Client Email"
                onClick={() => handleSuggestionClick("Draft Client Email")}
                className="bg-black/60 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs cursor-pointer"
              />
              <Chip
                label="📸 Telegram Notification Layout"
                onClick={() => handleSuggestionClick("Telegram Notification Layout")}
                className="bg-black/60 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs cursor-pointer"
              />
              <Chip
                label="📅 Plan Custom Event Timeline"
                onClick={() => handleSuggestionClick("Plan Custom Event Timeline")}
                className="bg-black/60 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs cursor-pointer"
              />
            </>
          ) : (
            <>
              <Chip
                label="📊 Generate Weekly Income Summary"
                onClick={() => handleSend("Can you summarize our recent booking patterns and recommend strategic price packages?")}
                className="bg-black/60 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs cursor-pointer"
              />
              <Chip
                label="💍 Best Wedding Photoshoot Poses"
                onClick={() => handleSend("Give me a cheat sheet of the best wedding photoshoot poses and angles for cinematic captures.")}
                className="bg-black/60 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs cursor-pointer"
              />
              <Chip
                label="📝 Draft Customer Payment Reminders"
                onClick={() => handleSend("Draft a polite follow-up message template for clients who have outstanding retainer balances.")}
                className="bg-black/60 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs cursor-pointer"
              />
            </>
          )}
        </Box>
      </Box>

      {/* Input Form Panel */}
      <Box className="p-4 bg-[#141413] border-t border-[#D4AF37]/20">
        <Box className="flex gap-2">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              selectedBooking
                ? `Ask Cinematic AI about ${selectedBooking.clientName}'s booking...`
                : "Ask Cinematic AI to draft, analyze, plan, or organize..."
            }
            className="bg-black/40 text-[#F5F5F0]"
            slotProps={{
              input: {
                sx: {
                  color: "#F5F5F0",
                  fontSize: "0.875rem",
                }
              }
            }}
          />
          <IconButton
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className={`w-12 h-12 flex items-center justify-center rounded-lg ${
              input.trim() && !loading
                ? "bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] text-black hover:opacity-90"
                : "bg-gray-800 text-gray-500"
            }`}
          >
            <Send className="w-5 h-5" />
          </IconButton>
        </Box>
        <Typography variant="caption" className="text-[10px] text-gray-500 font-mono tracking-wider text-center block mt-2">
          Secured with SSL proxy • Server-side Gemini intelligence active
        </Typography>
      </Box>
    </Box>
  );
};
