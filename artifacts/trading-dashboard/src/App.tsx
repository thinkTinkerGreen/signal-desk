import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Signals } from "@/pages/Signals";
import { Portfolio } from "@/pages/Portfolio";
import { Positions } from "@/pages/Positions";
import { Watchlist } from "@/pages/Watchlist";
import { Settings } from "@/pages/Settings";
import { IngestionLog } from "@/pages/IngestionLog";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/signals" component={Signals} />
        <Route path="/portfolio" component={Portfolio} />
        <Route path="/positions" component={Positions} />
        <Route path="/watchlist" component={Watchlist} />
        <Route path="/settings" component={Settings} />
        <Route path="/ingestion" component={IngestionLog} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
