"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Terminal, SendHorizonal, Loader2, Code2, Zap, FileText, ToggleLeft, ToggleRight, Database } from "lucide-react";

// --- Custom SVGs for Brands ---
const GithubIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.18-.35 6.52-1.57 6.52-7.16-.01-1.49-.59-2.88-1.58-3.92.18-.47.69-2.36-.15-4.57 0 0-1.28-.41-4.22 1.56a14.7 14.7 0 0 0-7.66 0C3.98 2.8 2.7 3.2 2.7 3.2c-.84 2.21-.33 4.1-.15 4.57A7.1 7.1 0 0 0 1 11.85c0 5.58 3.34 6.8 6.5 7.15A4.8 4.8 0 0 0 6.5 22v4" /></svg>
);
const LinkedinIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
);
const LeetCodeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863s.235-1.357.702-1.824l4.319-4.38c.467-.467 1.125-.645 1.837-.645s1.357.195 1.823.662l2.697 2.606c.514.515 1.365.497 1.9-.038.535-.536.553-1.387.039-1.901l-2.609-2.636a5.055 5.055 0 0 0-2.445-1.337l2.467-2.503c.516-.514.498-1.366-.037-1.901-.535-.535-1.387-.552-1.902-.038l-10.1 10.101c-.981.982-1.497 2.337-1.497 3.834s.516 2.852 1.497 3.835l10.101 10.101c.514.515 1.366.497 1.901-.038.536-.536.553-1.387.038-1.902l-2.467-2.502a5.056 5.056 0 0 0 2.446-1.336l2.608-2.636c.514-.515.496-1.367-.039-1.902-.534-.535-1.386-.553-1.9-1.038zM20.811 13.01H10.666c-.702 0-1.27.604-1.27 1.346s.568 1.346 1.27 1.346h10.145c.701 0 1.27-.604 1.27-1.346s-.569-1.346-1.27-1.346z"/></svg>
);
const KaggleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.246l-5.484-6.445-1.804 1.734v4.676c0 .187-.094.281-.281.281H4.555c-.187 0-.281-.094-.281-.281V.141c0-.187.094-.281.281-.281h2.789c.187 0 .281.094.281.281v15.656l6.984-7.523c.164-.164.328-.246.492-.246h3.234c.141 0 .234.035.281.105.047.07.035.152-.035.246l-6.234 6.469 7.195 8.648c.117.117.152.211.105.281z"/></svg>
);

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatUI() {
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/wake`)
      .catch((err) => console.error("Wake ping failed:", err)); 
  }, []);
  const [viewMode, setViewMode] = useState<"terminal" | "pdf">("terminal");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "SYSTEM INITIALIZED.\n\nAccessing profile: **Vivek Raghav** (Data Science).\nReady for queries. Select a quick query below or type a command to begin.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendQuery = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;
    setInput("");
    
    // Grab the conversation history before we add the new message.
    // .slice(1) skips the fake "SYSTEM INITIALIZED" welcome message so the LLM doesn't get confused.
    const chatHistory = messages.slice(1);
    
    setMessages((prev) => [...prev, { role: "user", content: userMessage }, { role: "assistant", content: "" }]);
    setIsLoading(true);

    try {
      // DYNAMIC FALLBACK: Uses process.env if in production, otherwise defaults to the local Wi-Fi IP for testing
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://10.81.90.205:8000";
      
      const response = await fetch(`${API_BASE_URL}/chat`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          questions: userMessage,
          history: chatHistory
        }),
      });
      
      if (!response.ok) throw new Error("Connection failed");

      setIsLoading(false);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      
      // 1. Create a local variable to hold the combined text safely
      let fullResponse = ""; 

      while (!done) {
        const { value, done: readerDone } = await reader!.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          
          // 2. Append the chunk to our local string (React can't double-fire this)
          fullResponse += chunk; 
          
          setMessages((prev) => {
            const newMessages = [...prev];
            // 3. OVERWRITE the content instead of appending (+=)
            newMessages[newMessages.length - 1].content = fullResponse; 
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error("THE REAL ERROR IS:", error); // <-- ADD THIS LINE
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = "ERR: Connection to HelloVR.ai host lost.";
        return newMessages;
      });
      setIsLoading(false);
    }
  };

  const quickQueries = [
    "Show Data Science & Bioinformatics skills",
    "Summarize soft skills and leadership",
    "Detail educational journey"
  ];

  return (
    <div className="relative min-h-screen lg:h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-40"></div>
      
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/60 backdrop-blur-md shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg tracking-tighter">VR</span>
            </div>
            <span className="font-bold text-slate-900 tracking-wide hidden md:block">HelloVR.ai</span>
          </div>

          <div className="flex items-center gap-1 md:gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setViewMode("terminal")}
              className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${viewMode === 'terminal' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Terminal size={14} /> <span>Terminal UI</span>
            </button>
            <button 
              onClick={() => setViewMode("pdf")}
              className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-semibold transition-all flex items-center gap-2 ${viewMode === 'pdf' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <FileText size={14} /> <span>CV</span>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE POLISH: Reduced padding (py-3) and gaps on mobile */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-10 flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-8 z-10 relative lg:overflow-hidden">
        
        <div className="flex lg:col-span-4 flex-col gap-3 lg:gap-6 shrink-0">
          
          <div className="flex flex-col gap-1">
            {/* MOBILE POLISH: Smaller text headers for mobile */}
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Vivek Raghav</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-1 md:px-3 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] md:text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                AI Representative
              </span>
            </div>
            {/* MOBILE POLISH: Hide the bio on small screens to save space */}
            <p className="text-slate-600 text-sm leading-relaxed mt-2 font-medium hidden sm:block">
              Data Science at IIT Roorkee. Query the terminal to extract my background, skills, and project history autonomously.
            </p>
          </div>

          {/* MOBILE POLISH: 4 columns on mobile (icons only), 2 columns on desktop (with text) */}
          <div className="grid grid-cols-4 lg:grid-cols-2 gap-2 mt-1 pb-1">
            <a href="https://github.com/vivekrajraghav" target="_blank" rel="noreferrer" className="p-2 md:p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col items-center lg:items-start gap-1 md:gap-3 group hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
              <GithubIcon size={20} />
              <div className="hidden lg:block">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GitHub</p>
                <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">vivekrajraghav</p>
              </div>
            </a>
            <a href="https://www.linkedin.com/in/vivekrajraghav/" target="_blank" rel="noreferrer" className="p-2 md:p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col items-center lg:items-start gap-1 md:gap-3 group hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="text-blue-600"><LinkedinIcon size={20} /></div>
              <div className="hidden lg:block">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LinkedIn</p>
                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">vivekrajraghav</p>
              </div>
            </a>
            <a href="https://leetcode.com/u/vivekrajraghav/" target="_blank" rel="noreferrer" className="p-2 md:p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col items-center lg:items-start gap-1 md:gap-3 group hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
              <div className="text-orange-500"><LeetCodeIcon size={20} /></div>
              <div className="hidden lg:block">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">LeetCode</p>
                <p className="text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors truncate">vivekrajraghav</p>
              </div>
            </a>
            <a href="https://www.kaggle.com/vivekrajraghav" target="_blank" rel="noreferrer" className="p-2 md:p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col items-center lg:items-start gap-1 md:gap-3 group hover:border-cyan-300 hover:shadow-md transition-all cursor-pointer">
              <div className="text-cyan-500"><KaggleIcon size={20} /></div>
              <div className="hidden lg:block">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kaggle</p>
                <p className="text-sm font-bold text-slate-800 group-hover:text-cyan-600 transition-colors truncate">vivekrajraghav</p>
              </div>
            </a>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-8 flex flex-col h-[65vh] lg:h-full lg:min-h-0 w-full pb-4 md:pb-0">
          
          {viewMode === "pdf" ? (
            <div className="w-full h-full rounded-xl shadow-xl shadow-slate-300/50 border border-slate-300 overflow-hidden bg-white flex flex-col items-center justify-center p-6">
              
              {/* FIXED: Uses lg:hidden to catch all high-res phones and tablets */}
              <div className="flex flex-col items-center text-center lg:hidden gap-4">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-2">
                  <FileText size={32} className="text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Standard Resume</h3>
                <p className="text-sm text-slate-500 max-w-[250px]">Mobile browsers cannot display PDFs directly inside this window.</p>
                <a href="/Vivek_Resume_Updated.pdf" target="_blank" rel="noreferrer" className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-md transition-colors flex items-center gap-2">
                  <FileText size={18} /> Open PDF in New Tab
                </a>
              </div>

              {/* FIXED: Uses lg:block to ensure this iframe is truly hidden on mobile */}
              <iframe 
                src="/Vivek_Resume_Updated.pdf" 
                className="w-full h-full hidden lg:block"
                title="Vivek Raghav Resume"
              />
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col bg-[#0f172a]/95 backdrop-blur-2xl border border-slate-700 rounded-xl shadow-2xl shadow-indigo-900/20 overflow-hidden flex-1 lg:min-h-0">
              
              <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 bg-slate-800/50 border-b border-slate-700 shrink-0">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-400 font-mono tracking-wider">
                  <Terminal size={12} className="text-emerald-400" />
                  <span>sys@hellovr.ai — root</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 md:p-6 flex flex-col gap-4 md:gap-6 font-mono scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {messages.map((msg, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    {msg.role === "user" ? (
                      <div className="flex items-start gap-2 text-xs md:text-base">
                        <span className="text-emerald-400 font-bold shrink-0">visitor@ai</span>
                        <span className="text-slate-500 shrink-0">~/query $</span>
                        <span className="text-slate-200">{msg.content}</span>
                      </div>
                    ) : (
                      <div className="pl-0 md:pl-4 border-l-2 border-slate-700/80 py-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap size={12} className="text-emerald-400" />
                          <span className="text-[10px] md:text-xs text-emerald-400/80 font-bold tracking-widest uppercase">Response Output</span>
                        </div>
                        
                        <div className="text-xs md:text-sm text-slate-300 leading-relaxed">
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-3 text-slate-400" {...props} />,
                              li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                              strong: ({ node, ...props }) => <strong className="text-emerald-400 font-semibold" {...props} />,
                              blockquote: ({ node, ...props }) => (
                                <div className="my-4 p-3 md:p-4 rounded-lg bg-[#1e293b]/80 border border-slate-600 shadow-lg shadow-black/30 border-l-4 border-l-indigo-500 font-sans">
                                  {props.children}
                                </div>
                              )
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="pl-0 md:pl-4 border-l-2 border-slate-700/80 py-1">
                    <div className="flex items-center gap-2 mb-2 animate-pulse">
                      <Loader2 size={12} className="text-emerald-400 animate-spin" />
                      <span className="text-[10px] md:text-xs text-emerald-400/80 font-bold tracking-widest uppercase">Querying Database...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-2 md:p-4 bg-slate-900/50 border-t border-slate-700 shrink-0">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none whitespace-nowrap">
                  {quickQueries.map((q, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => sendQuery(q)}
                      disabled={isLoading}
                      className="text-[10px] md:text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <form onSubmit={(e) => { e.preventDefault(); sendQuery(input); }} className="flex items-center gap-2 w-full bg-[#0b1120] border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-inner">
                  <span className="hidden md:inline-flex text-emerald-400 font-bold font-mono text-xs shrink-0">visitor@ai</span>
                  <span className="hidden md:inline-flex text-slate-500 font-mono text-xs shrink-0">~/query $</span>
                  <span className="md:hidden text-emerald-400 font-bold font-mono text-xs shrink-0">$</span>
                  
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 font-mono text-xs md:text-sm caret-emerald-400"
                    disabled={isLoading}
                  />
                  
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="relative p-1.5 rounded-md text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 transition-all"
                  >
                    {!isLoading && input.trim() && (
                      <span className="absolute inset-0 rounded-md bg-indigo-500 animate-ping opacity-30"></span>
                    )}
                    <SendHorizonal size={16} className="relative z-10" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}