import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, BarChart2, Mail, DollarSign, Users, Building2, ArrowRight, Star } from 'lucide-react';

const features = [
  { icon: Building2, title: 'Client Management', description: 'Organize all your employer clients in one place with full contact and plan details.' },
  { icon: Users, title: 'Beneficiary Tracking', description: 'Track COBRA-eligible individuals, their coverage, and election status effortlessly.' },
  { icon: Mail, title: 'Notice Management', description: 'Generate and track legally required COBRA notices with deadline alerts.' },
  { icon: DollarSign, title: 'Payment Tracking', description: 'Monitor premium payments, grace periods, and collection status in real time.' },
  { icon: BarChart2, title: 'Employer Reports', description: 'Produce professional reports for your clients with your own branding.' },
  { icon: CheckCircle, title: 'Compliance Alerts', description: 'Stay on top of deadlines and regulatory requirements automatically.' },
];

const testimonials = [
  { quote: "COBRA Shield Pro cut our administration time in half. The notice tracking alone is worth every penny.", name: "Sarah M.", role: "Benefits Broker, Phoenix AZ" },
  { quote: "Finally a tool built for brokers. Clean, fast, and my clients love the branded reports.", name: "James T.", role: "Independent Benefits Advisor" },
  { quote: "The deadline alerts keep us compliant without constant manual oversight. Highly recommend.", name: "Lisa R.", role: "HR Consulting Firm" },
];

export default function Home() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // If already signed in, redirect straight to dashboard
    base44.auth.isAuthenticated().then((authed) => {
      if (authed) {
        navigate('/');
      } else {
        setCheckingAuth(false);
      }
    });
  }, [navigate]);

  const handleSignIn = () => {
    base44.auth.redirectToLogin(window.location.origin + '/');
  };

  const handleRegister = () => {
    base44.auth.redirectToLogin(window.location.origin + '/');
  };


  if (checkingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/69d54be4c2cc9594e999e9ca/f03013bba_COBRAShieldProLogo-TransparentBackground.png"
            alt="COBRA Shield Pro"
            className="h-10 w-10 object-contain"
          />
          <span className="text-lg font-bold text-slate-800 tracking-tight">COBRA Shield Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleSignIn} className="text-slate-600 hidden sm:flex">
            Sign In
          </Button>
          <Button onClick={handleRegister} className="bg-blue-700 hover:bg-blue-800 text-white">
            Get Started Free
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-20 pb-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          <Star className="w-3 h-3" /> Trusted by benefits brokers nationwide
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 max-w-3xl leading-tight">
          COBRA Administration,{' '}
          <span className="text-blue-700">Simplified</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl">
          The all-in-one platform for health insurance and benefits brokers to manage COBRA compliance, notices, payments, and reporting — without the headache.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Button
            size="lg"
            onClick={handleRegister}
            className="bg-blue-700 hover:bg-blue-800 text-white text-base px-8 py-6 rounded-xl shadow-lg"
          >
            Start Your Free Trial <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleSignIn}
            className="text-slate-700 border-slate-300 text-base px-8 py-6 rounded-xl"
          >
            Sign In to My Account
          </Button>
        </div>
        <p className="mt-4 text-sm text-slate-400">No credit card required for trial · Email verification included</p>
      </section>

      {/* Features */}
      <section className="px-6 md:px-12 py-20 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-slate-800 text-center mb-3">Everything you need to stay compliant</h2>
        <p className="text-slate-500 text-center mb-12">Built specifically for benefits brokers managing COBRA on behalf of employer clients.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4 p-6 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="bg-blue-700 text-white px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-3">Simple, transparent pricing</h2>
        <p className="text-blue-100 mb-8 max-w-xl mx-auto">Plans starting at $19/mo. Try free for 3 days — no credit card required.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="bg-white/10 rounded-xl px-8 py-5 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Starter</p>
            <p className="text-3xl font-extrabold">$19<span className="text-base font-normal text-blue-200">/mo</span></p>
            <p className="text-sm text-blue-100 mt-1">Up to 5 clients</p>
          </div>
          <div className="bg-white/20 border border-white/30 rounded-xl px-8 py-5 text-left ring-2 ring-white/50">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Professional</p>
            <p className="text-3xl font-extrabold">$49<span className="text-base font-normal text-blue-200">/mo</span></p>
            <p className="text-sm text-blue-100 mt-1">Up to 25 clients</p>
          </div>
          <div className="bg-white/10 rounded-xl px-8 py-5 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Agency</p>
            <p className="text-3xl font-extrabold">$69<span className="text-base font-normal text-blue-200">/mo</span></p>
            <p className="text-sm text-blue-100 mt-1">Unlimited clients</p>
          </div>
        </div>
        <Button
          size="lg"
          onClick={handleRegister}
          className="mt-10 bg-white text-blue-700 hover:bg-blue-50 font-bold px-10 py-6 rounded-xl text-base"
        >
          Start Free Trial <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </section>

      {/* Testimonials */}
      <section className="px-6 md:px-12 py-20 max-w-5xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-slate-800 text-center mb-12">What brokers are saying</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ quote, name, role }) => (
            <div key={name} className="bg-slate-50 rounded-xl p-6 border border-slate-100">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-4">"{quote}"</p>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{name}</p>
                <p className="text-slate-500 text-xs">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white text-center px-6 py-16">
        <h2 className="text-3xl font-bold mb-3">Ready to simplify your COBRA administration?</h2>
        <p className="text-slate-400 mb-8">Join brokers who trust COBRA Shield Pro to keep their clients compliant.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={handleRegister} className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 rounded-xl text-base font-bold">
            Create Free Account <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button size="lg" variant="outline" onClick={handleSignIn} className="border-slate-600 text-slate-300 hover:bg-slate-800 px-10 py-6 rounded-xl text-base">
            Sign In
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-400 text-sm border-t border-slate-100">
        © {new Date().getFullYear()} COBRA Shield Pro. All rights reserved.
      </footer>
    </div>
  );
}