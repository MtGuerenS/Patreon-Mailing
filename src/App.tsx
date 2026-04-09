import { Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MembersPage } from "@/pages/MembersPage";
import { EnvelopesPage } from "@/pages/EnvelopesPage";
import { usePatreonAuth } from "@/hooks/usePatreonAuth";
import { usePatreonMembers } from "@/hooks/usePatreonMembers";

export default function App() {
  const membersData = usePatreonMembers();
  const auth = usePatreonAuth(membersData.loadMembers);

  const error = auth.error ?? membersData.error;

  const handleLogin = () => auth.login(membersData.loadMembers);
  const handleLogout = () => {
    auth.logout();
    membersData.reset();
  };
  const handleRefresh = () =>
    auth.accessToken && membersData.refreshMembers(auth.accessToken);

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
                />
              }
            />
            <Route path="/envelopes" element={<EnvelopesPage />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
}
