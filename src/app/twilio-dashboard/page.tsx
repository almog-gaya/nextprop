import { redirect } from 'next/navigation';

// Redirect from /twilio-dashboard to /messages
export default function TwilioDashboardPage() {
  redirect('/messages');
} 