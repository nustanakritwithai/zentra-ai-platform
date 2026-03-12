import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import StoreSettingsPage from "@/pages/store-settings";
import ProductsPage from "@/pages/products";
import OrdersPage from "@/pages/orders";
import CustomersPage from "@/pages/customers";
import AiAgentsPage from "@/pages/ai-agents";
import AiChatPage from "@/pages/ai-chat";
import KnowledgeBasePage from "@/pages/knowledge-base";
import PricingPage from "@/pages/pricing";
import StorefrontPage from "@/pages/storefront";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/store" component={StoreSettingsPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/customers" component={CustomersPage} />
      <Route path="/ai-agents" component={AiAgentsPage} />
      <Route path="/ai-chat" component={AiChatPage} />
      <Route path="/knowledge-base" component={KnowledgeBasePage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/shop/:slug" component={StorefrontPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
