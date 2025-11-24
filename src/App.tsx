import React from "react";
import { Toaster } from "react-hot-toast";
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

// --- NEW: Import Footer ---
import Footer from "@/components/Footer";

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
              {/* --- PUBLIC HOME PAGE --- */}
              <Route path="/" element={
                <div className="min-h-screen flex flex-col">
                  {/* Header */}
                  <header className="p-4 flex justify-between items-center bg-white shadow-sm sticky top-0 z-50">
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

                  {/* Main Content */}
                  <main className="flex-grow">
                    <Home />
                  </main>

                  {/* Footer */}
                  <Footer />
                </div>
              } />
              
              {/* --- PROTECTED APP ROUTES --- */}
              <Route path="/*" element={
                <>
                  <SignedOut>
                    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center p-4">
                      <h2 className="text-2xl font-bold mb-2">Medical Dashboard Locked</h2>
                      <p className="mb-6 text-gray-600">Please sign in to access diagnostic tools.</p>
                      <SignInButton mode="modal">
                        <button className="bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800">
                          Sign In / Register
                        </button>
                      </SignInButton>
                      <div className="mt-auto pb-8">
                        <Footer />
                      </div>
                    </div>
                  </SignedOut>

                  <SignedIn>
                    <SidebarProvider>
                      <div className="flex min-h-screen w-full">
                        <AppSidebar />
                        {/* Main Dashboard Area */}
                        <main className="flex-1 flex flex-col h-screen overflow-hidden">
                           {/* Header Bar inside Dashboard */}
                           <div className="p-4 flex justify-end bg-white border-b border-slate-100">
                             <UserButton />
                           </div>
                           
                           {/* Scrollable Content */}
                           <div className="flex-1 overflow-auto p-4 bg-gray-50 flex flex-col">
                              <div className="flex-grow">
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
                              
                              {/* Footer at the bottom of dashboard content */}
                              <div className="mt-8">
                                <Footer />
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
