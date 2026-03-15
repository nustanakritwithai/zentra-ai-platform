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
import CategoriesPage from "@/pages/categories";
import DiscountsPage from "@/pages/discounts";
import MallPage from "@/pages/mall";
import AffiliatePage from "@/pages/affiliate";
import MarketplacePage from "@/pages/marketplace";
import PosPage from "@/pages/pos";
import BlogPage from "@/pages/blog";
import EmployeesPage from "@/pages/employees";
import InventoryPage from "@/pages/inventory";
import IntegrationsPage from "@/pages/integrations";
import BuyerProfilePage from "@/pages/buyer-profile";
import StoreEditorPage from "@/pages/store-editor";
import AiGeneratePage from "@/pages/ai-generate";
import StoresPage from "@/pages/stores";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/stores" component={StoresPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/store" component={StoreSettingsPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/customers" component={CustomersPage} />
      <Route path="/categories" component={CategoriesPage} />
      <Route path="/discounts" component={DiscountsPage} />
      <Route path="/ai-agents" component={AiAgentsPage} />
      <Route path="/ai-chat" component={AiChatPage} />
      <Route path="/knowledge-base" component={KnowledgeBasePage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/mall" component={MallPage} />
      <Route path="/affiliate" component={AffiliatePage} />
      <Route path="/marketplace" component={MarketplacePage} />
      <Route path="/pos" component={PosPage} />
      <Route path="/blog" component={BlogPage} />
      <Route path="/employees" component={EmployeesPage} />
      <Route path="/inventory" component={InventoryPage} />
      <Route path="/integrations" component={IntegrationsPage} />
      <Route path="/buyer-profile" component={BuyerProfilePage} />
      <Route path="/store-editor" component={StoreEditorPage} />
      <Route path="/ai-generate" component={AiGeneratePage} />
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
