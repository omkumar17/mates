import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ClientLayout from "@/components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Mates - Find Your Match",
  description: "Find your match at Mates",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
