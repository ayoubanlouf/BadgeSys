import { useState } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import AuthPage from "./pages/AuthPage";
import BadgePage from "./pages/BadgePage";
import ValidatePage from "./pages/ValidatePage";
import Layout from "./Layout";

type Page = "badge" | "validate";

function AppInner() {
  const { token } = useAuth();
  const [page, setPage] = useState<Page>("badge");

  if (!token) return <AuthPage />;

  return (
    <Layout page={page} onNavigate={setPage}>
      {page === "badge" ? <BadgePage /> : <ValidatePage />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
