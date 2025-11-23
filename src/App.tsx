import React from "react";
import { Toaster } from "react-hot-toast"; // Use this for easier toasts
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

// Pages
import Dashboard from "@/components/Dashboard";
import Home from "./pages/Home";
import UploadPage from "./pages/UploadPage";
import ResultsPage from "./pages/ResultsPage";
import DoctorsPage from "./pages/DoctorsPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster position="top-right" />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Home Page */}
              <Route path="/" element={
                <>
                  {/* Simple Header for Home */}
                  <header className="p-4 flex justify-between items-center bg-white shadow-sm">
                    <h1 className="font-bold text-xl text-blue-700">Clarity Scan Aid</h1>
                    <div className="flex gap-4">
                      <SignedOut>
                        <SignInButton mode="modal">
                          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                            Sign In
                          </button>
                        </SignInButton>
                      </SignedOut>
                      <SignedIn>
                        <UserButton />
                        <a href="/dashboard" className="bg-gray-100 px-4 py-2 rounded text-gray-700 hover:bg-gray-200">
                          Go to Dashboard
                        </a>
                      </SignedIn>
                    </div>
                  </header>
                  <Home />
                </>
              } />
              
              {/* Protected App Pages (Require Login) */}
              <Route path="/*" element={
                <>
                  <SignedOut>
                    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
                      <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
                      <p className="mb-6 text-gray-600">Please sign in to access the medical dashboard.</p>
                      <SignInButton mode="modal">
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700">
                          Sign In to Continue
                        </button>
                      </SignInButton>
                    </div>
                  </SignedOut>

                  <SignedIn>
                    <SidebarProvider>
                      <div className="flex min-h-screen w-full">
                        <AppSidebar />
                        <main className="flex-1 overflow-auto p-4 bg-gray-50">
                          {/* Top bar for logged in user */}
                          <div className="flex justify-end mb-4">
                            <UserButton />
                          </div>
                          <Routes>
                            <Route path="upload" element={<UploadPage />} />
                            <Route path="results" element={<ResultsPage />} />
                            <Route path="doctors" element={<DoctorsPage />} />
                            <Route path="history" element={<HistoryPage />} />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            
                            <Route path="index" element={<Navigate to="/dashboard" replace />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                      </div>
                    </SidebarProvider>
                  </SignedIn>
                </>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;