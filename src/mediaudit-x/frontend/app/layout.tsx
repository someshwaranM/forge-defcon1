import "./globals.css";
import AppShell from "./components/AppShell";

export const metadata = {
  title: "MediAudit-X",
  description: "Clinical Claim Auditor & Temporal Drug-Interaction Engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. Grammarly) add
    // attributes to <html>/<body> before React loads, which otherwise
    // triggers a hydration error.
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
