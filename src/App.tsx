import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// ✅ IMPORT SIDEBAR TRIGGER
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Menu } from "lucide-react"; // Icon for mobile menu

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
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* --- PUBLIC HOME PAGE --- */}
              <Route path="/" element={
                <div className="min-h-screen flex flex-col bg-white text-slate-900">
                  {/* Simple Header */}
                  <header className="p-4 flex justify-between items-center bg-white border-b border-slate-100 sticky top-0 z-50">
                    <h1 className="font-bold text-xl text-blue-700">Clarity Scan Aid</h1>
                    <div className="flex gap-4 items-center">
                      <SignedOut>
                        <SignInButton mode="modal">
                          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                            Sign In
                          </button>
                        </SignInButton>
                      </SignedOut>
                      <SignedIn>
                        <a href="/dashboard" className="text-sm font-medium hover:underline text-slate-600">Dashboard</a>
                        <UserButton />
                      </SignedIn>
                    </div>
                  </header>

                  <main className="flex-grow">
                    <Home />
                  </main>
                </div>
              } />
              
              {/* --- PROTECTED APP ROUTES --- */}
              <Route path="/*" element={
                <>
                  <SignedOut>
                    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center p-4 text-slate-900">
                      <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
                      <p className="mb-6 text-gray-600">Please sign in to access diagnostic tools.</p>
                      <SignInButton mode="modal">
                        <button className="bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800">
                          Sign In / Register
                        </button>
                      </SignInButton>
                    </div>
                  </SignedOut>

                  <SignedIn>
                    <SidebarProvider>
                      <div className="flex min-h-screen w-full bg-gray-50 dark:bg-slate-950">
                        <AppSidebar />
                        
                        <main className="flex-1 flex flex-col h-screen overflow-hidden">
                           {/* ✅ MOBILE HEADER (Sticky Top) */}
                           <header className="flex h-16 items-center gap-4 border-b bg-white dark:bg-slate-900 px-4 shadow-sm shrink-0 z-40">
                             {/* Hamburger Button */}
                             <SidebarTrigger className="p-2 hover:bg-slate-100 rounded-md">
                                <Menu className="h-6 w-6 text-slate-700 dark:text-slate-200" />
                             </SidebarTrigger>
                             
                             <div className="flex-1 font-semibold text-slate-700 dark:text-slate-200">
                               EyeAnalyzer Dashboard
                             </div>
                             
                             <UserButton afterSignOutUrl="/" />
                           </header>
                           
                           {/* Scrollable Content Area */}
                           <div className="flex-1 overflow-auto p-4 md:p-6">
                              <div className="max-w-6xl mx-auto pb-20">
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
                              </div>
                           </div>
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
