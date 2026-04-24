import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function SignIn() {
  useEffect(() => {
    base44.auth.redirectToLogin(window.location.origin + '/');
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-700 rounded-full animate-spin" />
    </div>
  );
}