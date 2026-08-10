

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background text-foreground">
      {children}
    </div>
  );
}

