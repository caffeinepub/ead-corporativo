import { Toaster } from "@/components/ui/sonner";
import H2EPage from "./pages/H2EPage";

// Keep navigate export for backward compatibility with unused old pages
export function navigate(path: string) {
  window.location.hash = path;
}

export default function App() {
  return (
    <>
      <H2EPage />
      <Toaster richColors position="top-right" />
    </>
  );
}
