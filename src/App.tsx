import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AgentsPage from "./pages/Agents";
import WorkflowsPage from "./pages/Workflows";
import KnowledgePage from "./pages/Knowledge";
import ExecutionsPage from "./pages/Executions";
import { Button } from "@/components/ui/button";
import { Bot, Workflow, Database, Activity, Home } from "lucide-react";

const queryClient = new QueryClient();

const Navigation = () => {
  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <Bot className="h-6 w-6" />
              Agentic Workflow
            </Link>
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/agents">
                  <Bot className="mr-2 h-4 w-4" />
                  Agents
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/workflows">
                  <Workflow className="mr-2 h-4 w-4" />
                  Workflows
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/knowledge">
                  <Database className="mr-2 h-4 w-4" />
                  Knowledge
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/executions">
                  <Activity className="mr-2 h-4 w-4" />
                  Executions
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/agents/:id" element={<AgentsPage />} />
              <Route path="/workflows" element={<WorkflowsPage />} />
              <Route path="/workflows/:id" element={<WorkflowsPage />} />
              <Route path="/knowledge" element={<KnowledgePage />} />
              <Route path="/executions" element={<ExecutionsPage />} />
              <Route path="/executions/:id" element={<ExecutionsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;