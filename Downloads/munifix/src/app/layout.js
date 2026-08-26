import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata = {
  title: "MuniFix — Report it. Track it. Get it fixed.",
  description:
    "A citizen-to-municipality reporting platform for infrastructure issues: potholes, water leaks, outages, waste, and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-body antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
