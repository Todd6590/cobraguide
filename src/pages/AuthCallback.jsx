import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function AuthCallback() {
  const [status, setStatus] = useState('Processing login...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      setError('Login was cancelled or failed: ' + errorParam);
      return;
    }

    if (!code) {
      setError('No authorization code received.');
      return;
    }

    handleCallback(code, state);
  }, []);

  const handleCallback = async (code, state) => {
    try {
      setStatus('Verifying your subscription...');
      const response = await base44.functions.invoke('oidcCallback', { code, state });
      const data = response.data;

      if (data?.error === 'no_valid_plan') {
        setError('Your brokertoolbox.net account does not have an active COBRA Shield Pro subscription. Please subscribe at brokertoolbox.net and try again.');
        return;
      }

      if (!data?.token) {
        setError('Login failed. Please try again.');
        return;
      }

      setStatus('Login successful! Redirecting...');

      // Store the token and redirect
      localStorage.setItem('base44_token', data.token);
      window.location.href = '/';

    } catch (err) {
      console.error('Auth callback error:', err);
      const detail = err.response?.data?.error || err.message;
      setError('Login failed: ' + detail);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        {error ? (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">✕</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Login Failed</h2>
            <p className="text-muted-foreground text-sm mb-6">{error}</p>
            <a
              href="https://brokertoolbox.net"
              className="text-primary underline text-sm"
            >
              Go to brokertoolbox.net
            </a>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{status}</p>
          </>
        )}
      </div>
    </div>
  );
}