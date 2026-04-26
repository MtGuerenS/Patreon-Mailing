import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MembersPage } from "@/pages/MembersPage";
import { EnvelopesPage } from "@/pages/EnvelopesPage";
import { EnvelopesPreviewPage } from "@/pages/EnvelopesPreviewPage";
import { usePatreonAuth } from "@/hooks/usePatreonAuth";
import { usePatreonMembers } from "@/hooks/usePatreonMembers";
import { currentYear } from "@/lib/patreon";

export default function App() {
  const membersData = usePatreonMembers();
  const auth = usePatreonAuth(membersData.loadMembers);

  const error = auth.error ?? membersData.error;

  const handleLogin = () => auth.login(membersData.loadMembers);
  const handleLogout = () => { auth.logout(); membersData.reset(); };
  const handleRefresh = () =>
    auth.accessToken && membersData.refreshMembers(auth.accessToken);

  // MembersPage persistent state
  const [membersSelectedMonth, setMembersSelectedMonth] = useState(String(new Date().getMonth()));
  const [membersSelectedYear, setMembersSelectedYear] = useState(String(currentYear));

  // EnvelopesPage persistent state
  const [envelopeTemplate, setEnvelopeTemplate] = useState<string | null>(null);
  const [envelopeBgColor, setEnvelopeBgColor] = useState("#ffffff");
  const [envelopeWidthPct, setEnvelopeWidthPct] = useState(39);
  const [envelopeHeightPct, setEnvelopeHeightPct] = useState(23);
  const [envelopeSelectedMonth, setEnvelopeSelectedMonth] = useState(String(new Date().getMonth()));
  const [envelopeSelectedYear, setEnvelopeSelectedYear] = useState(String(currentYear));
  const [envelopeSelectedTier, setEnvelopeSelectedTier] = useState("all");

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route
              path="/"
              element={
                <MembersPage
                  accessToken={auth.accessToken}
                  members={membersData.members}
                  included={membersData.included}
                  dbMembers={membersData.dbMembers}
                  loading={membersData.loading}
                  error={error}
                  onLogin={handleLogin}
                  onLogout={handleLogout}
                  onRefresh={handleRefresh}
                  onDbRefresh={membersData.setDbMembers}
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
                  dbMembers={membersData.dbMembers}
                  members={membersData.members}
                  included={membersData.included}
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
                <EnvelopesPreviewPage
                  dbMembers={membersData.dbMembers}
                  onDbRefresh={membersData.setDbMembers}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
}