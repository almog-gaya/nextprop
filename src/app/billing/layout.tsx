import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing & Usage | NextProp',
  description: 'Manage your NextProp subscription and usage',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 