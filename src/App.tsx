import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MembersPage } from "@/pages/MembersPage";
import { EnvelopesPage } from "@/pages/EnvelopesPage";
import { EnvelopesPreviewPage } from "@/pages/EnvelopesPreviewPage";
import { usePatreonAuth } from "@/hooks/usePatreonAuth";
import { usePatreonMembers } from "@/hooks/usePatreonMembers";
import { currentYear } from "@/lib/patreon";
import { LoginPage } from "./pages/LoginPage";
import { MembersContext } from "./context/MembersContext";

export default function App() {
  const membersData = usePatreonMembers();
  const auth = usePatreonAuth(membersData.loadMembers);

  // ALL useState calls must be before any early return
  const [membersSelectedMonth, setMembersSelectedMonth] = useState(String(new Date().getMonth()));
  const [membersSelectedYear, setMembersSelectedYear] = useState(String(currentYear));
  const [envelopeTemplate, setEnvelopeTemplate] = useState<string | null>(null);
  const [envelopeBgColor, setEnvelopeBgColor] = useState("#ffffff");
  const [envelopeWidthPct, setEnvelopeWidthPct] = useState(39);
  const [envelopeHeightPct, setEnvelopeHeightPct] = useState(23);
  const [envelopeSelectedMonth, setEnvelopeSelectedMonth] = useState(String(new Date().getMonth()));
  const [envelopeSelectedYear, setEnvelopeSelectedYear] = useState(String(currentYear));
  const [envelopeSelectedTier, setEnvelopeSelectedTier] = useState("all");

  useEffect(() => {
    if (auth.accessToken) {
      window.patreonAPI.windowSetMain()
    }
  }, [auth.accessToken])

  if (auth.loading) return null

  if (!auth.accessToken) {
    return <LoginPage onLogin={() => auth.login(membersData.loadMembers)} error={auth.error} />
  }

  const error = auth.error ?? membersData.error;
  const handleLogin = () => auth.login(membersData.loadMembers);
  const handleLogout = () => { auth.logout(); membersData.reset(); };
  const handleRefresh = () => auth.accessToken && membersData.refreshMembers(auth.accessToken);

  return (
    <MembersContext.Provider value={membersData}>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar
            accessToken={auth.accessToken}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route
                path="/"
                element={
                  <MembersPage
                    accessToken={auth.accessToken}
                    loading={membersData.loading}
                    loadStatus={membersData.loadStatus}
                    error={error}
                    onRefresh={handleRefresh}
                    selectedMonth={membersSelectedMonth}
                    selectedYear={membersSelectedYear}
                    onMonthChange={setMembersSelectedMonth}
                    onYearChange={setMembersSelectedYear}
                  />
                }
              />
              <Route
                path="/envelopes"
                element={
                  <EnvelopesPage
                    template={envelopeTemplate}
                    onTemplateChange={setEnvelopeTemplate}
                    bgColor={envelopeBgColor}
                    onBgColorChange={setEnvelopeBgColor}
                    widthPct={envelopeWidthPct}
                    onWidthPctChange={setEnvelopeWidthPct}
                    heightPct={envelopeHeightPct}
                    onHeightPctChange={setEnvelopeHeightPct}
                    selectedMonth={envelopeSelectedMonth}
                    onMonthChange={setEnvelopeSelectedMonth}
                    selectedYear={envelopeSelectedYear}
                    onYearChange={setEnvelopeSelectedYear}
                    selectedTier={envelopeSelectedTier}
                    onTierChange={setEnvelopeSelectedTier}
                  />
                }
              />
              <Route
                path="/envelopes/preview"
                element={
                  <EnvelopesPreviewPage />
                }
              />
            </Routes>
          </main>
        </div>
      </SidebarProvider>

    </MembersContext.Provider>
  );
}