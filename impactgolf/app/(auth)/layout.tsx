// Auth pages have their own standalone layout — no shared Navbar/Footer
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
