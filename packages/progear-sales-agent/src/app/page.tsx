'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Key, GitBranch, ShieldCheck, KeyRound, Users, Activity, FileLock2, LogOut, Home as HomeIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type ApprovalStatus } from '@/components/ApprovalStatusCard';
import { API_BASE_URL, OKTA_DOMAIN } from '@/lib/config';
import Footer from '@/components/Footer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  agentFlow?: any[];
  tokenExchanges?: any[];
  fgaChecks?: any[];
}

const exampleQuestions = [
  { text: "How does token exchange work between Okta and Auth0?", icon: KeyRound },
  { text: "Show me recent Okta authentication activity", icon: ShieldCheck },
  { text: "Look up State University's account permissions", icon: Users },
  { text: "What scopes does the sales agent request?", icon: FileLock2 },
  { text: "Show me recent bulk equipment orders", icon: Activity },
  { text: "Which customers have Platinum tier access?", icon: Users },
];

const CHAT_STORAGE_KEY = 'progear-chat-messages';
const AGENT_FLOW_STORAGE_KEY = 'progear-agent-flow';
const TOKEN_EXCHANGE_STORAGE_KEY = 'progear-token-exchanges';
const FGA_CHECKS_STORAGE_KEY = 'progear-fga-checks';
const PENDING_APPROVAL_STORAGE_KEY = 'progear-pending-approval';
const APPROVAL_ANNOUNCED_STORAGE_KEY = 'progear-approval-announced';

// Pull the router's classified intent (agents + scopes) out of an agent_flow
// array so it can be shown inline under the assistant's reply, even when the
// request later fails for infrastructure reasons. Answers "what did the AI
// understand this prompt to mean" directly, instead of leaving that only
// inferable from whether the answer happened to come back right.
function getRouterSummary(agentFlow?: any[]): string | null {
  if (!agentFlow) return null;
  const routerStep = agentFlow.find((s) => s.step === 'router' && s.agents && s.scopes);
  if (!routerStep) return null;
  const parts = (routerStep.agents as string[]).map((agent) => {
    const scopes = (routerStep.scopes[agent] || []) as string[];
    return `${agent}: ${scopes.join(', ')}`;
  });
  return parts.length ? `Interpreted as → ${parts.join(' · ')}` : null;
}

// Claude's responses come back as markdown (**bold**, numbered lists, etc.)
// which previously rendered as literal asterisks in a plain <p> tag. Map the
// handful of elements actually used in responses to Tailwind-styled tags
// rather than pulling in the @tailwindcss/typography plugin for this alone.
const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }: { children?: ReactNode }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  ul: ({ children }: { children?: ReactNode }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
  code: ({ children }: { children?: ReactNode }) => (
    <code className="bg-gray-100 text-accent px-1 py-0.5 rounded text-sm font-mono">{children}</code>
  ),
  // Tables need remark-gfm to even parse (plain react-markdown only speaks
  // CommonMark, not GFM tables) - without it, "| Product | Stock |..." shows
  // up as a literal pipe-delimited line of text instead of a real table.
  table: ({ children }: { children?: ReactNode }) => (
    <div className="overflow-x-auto mb-2">
      <table className="min-w-full border border-neutral-border rounded-lg text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => <thead className="bg-gray-50">{children}</thead>,
  tr: ({ children }: { children?: ReactNode }) => <tr className="border-b border-neutral-border last:border-0">{children}</tr>,
  th: ({ children }: { children?: ReactNode }) => (
    <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-neutral-border last:border-0">{children}</th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="px-3 py-2 border-r border-neutral-border last:border-0">{children}</td>
  ),
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgentFlow, setCurrentAgentFlow] = useState<any[]>([]);
  const [currentTokenExchanges, setCurrentTokenExchanges] = useState<any[]>([]);
  const [currentFGAChecks, setCurrentFGAChecks] = useState<any[]>([]);
  const [pendingApproval, setPendingApproval] = useState<ApprovalStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoadingAuth = status === 'loading';

  // Load chat history from sessionStorage on mount
  useEffect(() => {
    try {
      const savedMessages = sessionStorage.getItem(CHAT_STORAGE_KEY);
      const savedAgentFlow = sessionStorage.getItem(AGENT_FLOW_STORAGE_KEY);
      const savedTokenExchanges = sessionStorage.getItem(TOKEN_EXCHANGE_STORAGE_KEY);
      const savedFGAChecks = sessionStorage.getItem(FGA_CHECKS_STORAGE_KEY);

      if (savedMessages) {
        setChatMessages(JSON.parse(savedMessages));
      }
      if (savedAgentFlow) {
        setCurrentAgentFlow(JSON.parse(savedAgentFlow));
      }
      if (savedTokenExchanges) {
        setCurrentTokenExchanges(JSON.parse(savedTokenExchanges));
      }
      if (savedFGAChecks) {
        setCurrentFGAChecks(JSON.parse(savedFGAChecks));
      }
      const savedPendingApproval = sessionStorage.getItem(PENDING_APPROVAL_STORAGE_KEY);
      if (savedPendingApproval) {
        try {
          setPendingApproval(JSON.parse(savedPendingApproval) as ApprovalStatus);
        } catch {
          /* ignore malformed saved state */
        }
      }
    } catch (e) {
      console.error('Error loading chat history:', e);
    }
  }, []);

  // Save chat history to sessionStorage whenever it changes
  useEffect(() => {
    if (chatMessages.length > 0) {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  // Save agent flow, token exchanges, and FGA checks to sessionStorage
  useEffect(() => {
    if (currentAgentFlow.length > 0) {
      sessionStorage.setItem(AGENT_FLOW_STORAGE_KEY, JSON.stringify(currentAgentFlow));
    }
    if (currentTokenExchanges.length > 0) {
      sessionStorage.setItem(TOKEN_EXCHANGE_STORAGE_KEY, JSON.stringify(currentTokenExchanges));
    }
    if (currentFGAChecks.length > 0) {
      sessionStorage.setItem(FGA_CHECKS_STORAGE_KEY, JSON.stringify(currentFGAChecks));
    }
    if (pendingApproval) {
      sessionStorage.setItem(PENDING_APPROVAL_STORAGE_KEY, JSON.stringify(pendingApproval));
    } else {
      sessionStorage.removeItem(PENDING_APPROVAL_STORAGE_KEY);
    }
  }, [currentAgentFlow, currentTokenExchanges, currentFGAChecks, pendingApproval]);

  // Debug hook: ?mockApprovalId= populates the ApprovalStatusCard for manual UI testing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NEXT_PUBLIC_ENABLE_DEBUG_HOOKS !== 'true') return;
    const params = new URLSearchParams(window.location.search);
    const mockId = params.get('mockApprovalId');
    if (!mockId) return;
    setPendingApproval({
      request_id: mockId,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      approver_group: 'InventoryApprovers',
      intent: {
        product_name: 'sales-item',
        quantity_delta: 500,
        scope: 'inventory:write',
        original_task: 'debug: add 500 units',
      },
    });
  }, []);

  // Redirect to sign-in page if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleGoHome = () => {
    // Clear chat messages and reset to landing page with prompts
    setChatMessages([]);
    setCurrentAgentFlow([]);
    setCurrentTokenExchanges([]);
    setCurrentFGAChecks([]);
    setPendingApproval(null);
    setMessage('');
    // Clear session storage
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
    sessionStorage.removeItem(AGENT_FLOW_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_EXCHANGE_STORAGE_KEY);
    sessionStorage.removeItem(FGA_CHECKS_STORAGE_KEY);
    sessionStorage.removeItem(PENDING_APPROVAL_STORAGE_KEY);
    sessionStorage.removeItem(APPROVAL_ANNOUNCED_STORAGE_KEY);
  };

  const handleApprovalStatusChange = (latest: ApprovalStatus) => {
    setPendingApproval(latest);
    if (latest.status !== 'executed') return;

    let announced: string[] = [];
    try {
      announced = JSON.parse(sessionStorage.getItem(APPROVAL_ANNOUNCED_STORAGE_KEY) || '[]');
    } catch {
      announced = [];
    }
    if (announced.includes(latest.request_id)) return;
    announced.push(latest.request_id);
    sessionStorage.setItem(APPROVAL_ANNOUNCED_STORAGE_KEY, JSON.stringify(announced));

    const intent = latest.intent ?? {};
    const er = latest.execution_result;
    const approverSuffix = latest.approver?.display_name
      ? ` by ${latest.approver.display_name}`
      : latest.approver?.email
        ? ` by ${latest.approver.email}`
        : '';
    const product = intent.product_name ?? 'item';
    const qty =
      typeof intent.quantity_delta === 'number'
        ? `+${intent.quantity_delta.toLocaleString()}`
        : '';
    const inventoryLine =
      er && er.previous_quantity >= 0 && er.new_quantity >= 0
        ? `Inventory for ${product}: ${er.previous_quantity.toLocaleString()} → ${er.new_quantity.toLocaleString()}${qty ? ` (${qty})` : ''}.`
        : '';
    const txnLine = er?.txn_id ? `Transaction: ${er.txn_id}` : '';

    const body = [
      `Your previous request ${latest.request_id} was approved${approverSuffix} and has been executed.`,
      inventoryLine,
      txnLine,
    ]
      .filter(Boolean)
      .join('\n');

    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: body,
        timestamp: Date.now(),
      },
    ]);
  };

  // Now that the Token/Approval detail card lives on /tokens, the chat page
  // owns its own lightweight poll so a pending manager-approval request still
  // gets announced in the conversation even if the user never opens /tokens.
  useEffect(() => {
    if (!pendingApproval) return;
    if (pendingApproval.status === 'executed' || pendingApproval.status === 'denied') return;

    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/approvals/${pendingApproval.request_id}`);
        if (!res.ok || cancelled) return;
        const data: ApprovalStatus = await res.json();
        if (!cancelled) handleApprovalStatusChange(data);
      } catch {
        /* next tick retries */
      }
    };

    tick();
    const handle = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingApproval?.request_id, pendingApproval?.status]);

  const handleSignOut = async () => {
    // Get the idToken BEFORE signing out (session will be cleared after signOut)
    const idToken = session?.idToken;

    // Clear the NextAuth session
    await signOut({ redirect: false });

    // Clear chat history on sign out
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
    sessionStorage.removeItem(AGENT_FLOW_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_EXCHANGE_STORAGE_KEY);
    sessionStorage.removeItem(FGA_CHECKS_STORAGE_KEY);
    sessionStorage.removeItem(PENDING_APPROVAL_STORAGE_KEY);

    // End Okta session using OIDC logout endpoint
    // Reference: https://developer.okta.com/docs/guides/sign-users-out/react/main/
    const oktaDomain = OKTA_DOMAIN;
    const postLogoutRedirect = encodeURIComponent(`${window.location.origin}/auth/signin`);

    if (oktaDomain && idToken) {
      // OIDC logout endpoint with id_token_hint
      window.location.href = `${oktaDomain}/oauth2/v1/logout?id_token_hint=${idToken}&post_logout_redirect_uri=${postLogoutRedirect}`;
    } else if (oktaDomain) {
      // Fallback without id_token
      window.location.href = `${oktaDomain}/oauth2/v1/logout?post_logout_redirect_uri=${postLogoutRedirect}`;
    } else {
      window.location.href = '/auth/signin';
    }
  };

  const handleSendMessage = async (text?: string) => {
    const userMessage = text || message.trim();
    if (!userMessage) return;

    setMessage('');
    const newUserMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);
    setCurrentAgentFlow([{ step: 'router', action: 'Processing request...', status: 'processing' }]);
    setCurrentTokenExchanges([]);
    setCurrentFGAChecks([]);

    try {
      const idToken = session?.idToken;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      // Update agent flow, token exchanges, and FGA checks
      setCurrentAgentFlow(data.agent_flow || []);
      setCurrentTokenExchanges(data.token_exchanges || []);
      setCurrentFGAChecks(data.fga_checks || []);
      if (data.pending_approval) {
        setPendingApproval(data.pending_approval);
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
        agentFlow: data.agent_flow,
        tokenExchanges: data.token_exchanges,
        fgaChecks: data.fga_checks,
      };
      setChatMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: Date.now(),
        },
      ]);
      setCurrentAgentFlow([{ step: 'error', action: 'Request failed', status: 'error' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking auth status
  if (isLoadingAuth || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-bg">
        <div className="flex flex-col items-center space-y-4">
          <Image src="/tec360-header-logo.png" alt="TEC360" width={100} height={68} className="h-14 w-auto animate-pulse" />
          <div className="text-primary text-xl font-display font-medium">Loading AI PRO SALES...</div>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen bg-neutral-bg flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md relative z-10">
        <div className="px-6 py-4 flex justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            {/* Home Button */}
            <button
              onClick={handleGoHome}
              className="p-2.5 bg-neutral-bg hover:bg-baby-blue/40 text-primary rounded-xl transition flex items-center justify-center"
              title="Go to Home"
            >
              <HomeIcon className="w-5 h-5" />
            </button>

            <Image src="/tec360-header-logo.png" alt="TEC360" width={110} height={75} className="h-11 w-auto" priority />
            <div>
              <h1 className="text-primary text-2xl font-display font-bold">AI PRO SALES</h1>
              <p className="text-gray-500 text-sm">AI Powered Sales Equipment</p>
            </div>
          </div>

          {/* Token Flow + Architecture */}
          <div className="flex items-center space-x-2">
            <Link
              href="/tokens"
              className="px-4 py-2.5 bg-neutral-bg hover:bg-baby-blue/40 text-primary rounded-xl transition flex items-center gap-2 text-sm font-medium"
              title="Token exchanges, FGA checks, and demo controls"
            >
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">Token Flow</span>
            </Link>
            <Link
              href="/architecture"
              className="px-4 py-2.5 bg-neutral-bg hover:bg-baby-blue/40 text-primary rounded-xl transition flex items-center gap-2 text-sm font-medium"
              title="How the system is wired together"
            >
              <GitBranch className="w-4 h-4" />
              <span className="hidden sm:inline">How it works?</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-sm hidden md:inline">{session?.user?.email}</span>
            <button
              onClick={handleSignOut}
              className="px-5 py-2.5 bg-primary hover:bg-accent text-white rounded-xl transition flex items-center space-x-2 shadow-md"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat - full width; token/FGA/approval detail lives on /tokens now */}
      <div className="flex-1 flex overflow-hidden">
        <div
          className="w-full flex flex-col bg-cover bg-center"
          style={{ backgroundImage: "url('/tec360-bg-gris.png')" }}
        >
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-3xl mx-auto w-full">
            {chatMessages.length === 0 && (
              <div className="text-center py-8 max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center mb-4 bg-white rounded-2xl shadow-lg p-5">
                  <Image src="/tec360-header-logo.png" alt="TEC360" width={90} height={62} className="h-14 w-auto" />
                </div>
                <h2 className="text-2xl font-display font-semibold text-primary mb-2">Welcome, {session?.user?.name || 'Team Member'}!</h2>
                <p className="text-white mb-6">
                  Your AI-powered sales equipment assistant is ready. Ask about orders, inventory, pricing, or customers.
                </p>

                {/* Example Questions */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  {exampleQuestions.map((question, idx) => {
                    const Icon = question.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(question.text)}
                        className="group p-4 bg-white hover:shadow-xl shadow-md rounded-2xl transition-all text-left flex items-start space-x-3"
                      >
                        <div className="w-8 h-8 bg-baby-blue/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-accent transition-all">
                          <Icon className="w-4 h-4 text-accent group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-sm text-gray-700 group-hover:text-primary font-medium leading-relaxed">
                          {question.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-2xl ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-accent'
                      : 'bg-primary'
                  }`}>
                    {msg.role === 'user' ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-white" />
                    )}
                  </div>

                  <div className={`rounded-2xl p-4 shadow-md ${
                    msg.role === 'user'
                      ? 'bg-accent text-white'
                      : 'bg-white'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="text-gray-700 text-sm [&_p:last-child]:mb-0">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {msg.role === 'assistant' && getRouterSummary(msg.agentFlow) && (
                      <div className="text-[11px] font-mono text-okta-blue/80 mt-2 pt-2 border-t border-neutral-border/60">
                        {getRouterSummary(msg.agentFlow)}
                      </div>
                    )}
                    <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-md">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        <div className="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-baby-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">Processing with AI agents...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white/90 backdrop-blur-sm px-6 py-4 shadow-2xl">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex space-x-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about orders, inventory, pricing, or customers..."
                  className="w-full px-5 py-3 bg-gray-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/30 transition text-gray-700 placeholder-gray-400 shadow-inner"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="px-6 py-3 bg-accent hover:bg-primary text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
