import React from 'react';

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

export const metadata = {
  title: 'Leads | NextProp AI',
  description: 'Manage your leads and opportunities',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}; 