import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Programs from "./pages/Programs";
import Events from "./pages/Events";
import Organizations from "./pages/Organizations";
import About from "./pages/About";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./hooks/use-auth";
import EventRecord from "./pages/EventRecord";
import Profile from "./pages/Profile";
import TransparencyReports from "./pages/TransparencyReports";
import FinancialDisclosure from "./pages/FinancialDisclosure";
import BarangayMap from "./pages/BarangayMap";
import TransparencyBoard from "./pages/TransparencyBoard";
import CitizenDesk from "./pages/CitizenDesk";
import ServiceAdvisories from "./pages/ServiceAdvisories";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/events" element={<Events />} />
            <Route path="/organizations" element={<Organizations />} />
            <Route path="/about" element={<About />} />
            <Route path="/advocacy" element={<About />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/events/:eventId" element={<EventRecord />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/transparency/reports" element={<TransparencyReports />} />
            <Route path="/transparency/board" element={<TransparencyBoard />} />
            <Route path="/transparency/financial-disclosure" element={<FinancialDisclosure />} />
            <Route path="/transparency/barangay-map" element={<BarangayMap />} />
            <Route path="/transparency/citizen-desk" element={<CitizenDesk />} />
            <Route path="/transparency/service-advisories" element={<ServiceAdvisories />} />
            <Route path="/feedback" element={<CitizenDesk />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
