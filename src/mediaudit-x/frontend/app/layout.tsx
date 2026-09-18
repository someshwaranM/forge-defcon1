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
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
