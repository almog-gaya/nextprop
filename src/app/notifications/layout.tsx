import Sidebar from '@/components/Sidebar';

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto ml-64">
        {children}
      </main>
    </div>
  );
} 