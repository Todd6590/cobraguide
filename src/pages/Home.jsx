import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, BarChart2, Mail, DollarSign, Users, Building2, ArrowRight, Star, Clock, FileText, AlertCircle } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Automated COBRA Notices',
    description: 'Never miss a qualifying event notice again. Automatically generate and track all required notices with built-in delivery confirmation.',
  },
  {
    icon: Clock,
    title: 'Deadline Tracking & Alerts',
    description: 'Every election window, premium due date, and coverage end date monitored automatically across your entire book of business.',
  },
  {
    icon: Building2,
    title: 'Client Management',
    description: 'Organize all your employer clients in one place with full contact details, plan information, and status tracking.',
  },
  {
    icon: Users,
    title: 'Beneficiary Tracking',
    description: 'Track COBRA-eligible individuals, their coverage, election status, and premium payments effortlessly.',
  },
  {
    icon: BarChart2,
    title: 'Compliance Reporting',
    description: 'Generate audit-ready DOL-compliant reports, premium summaries, and participant histories in seconds.',
  },
  {
    icon: DollarSign,
    title: 'Payment Tracking',
    description: 'Monitor premium payments, grace periods, and collection status across all your clients in real time.',
  },
];

const trustBadges = [
  '500+ Brokers Trust Us',
  'ACA / ERISA Compliant',
  'DOL Notice Templates',
  '99.9% Uptime SLA',
];

const testimonials = [
  { quote: "COBRA Shield Pro cut our administration time in half. The notice tracking alone is worth every penny.", name: "Sarah M.", role: "Benefits Broker, Phoenix AZ" },
  { quote: "Finally a tool built for brokers. Clean, fast, and my clients love the branded reports.", name: "James T.", role: "Independent Benefits Advisor" },
  { quote: "The deadline alerts keep us compliant without constant manual oversight. Highly recommend.", name: "Lisa R.", role: "HR Consulting Firm" },
];

const plans = [
  {
    name: 'Starter',
    price: '$19',
    desc: 'Perfect for independent brokers managing a small book of business.',
    features: ['Up to 5 employer groups', 'Automated COBRA notices', 'Deadline tracking & alerts', 'Basic reporting', 'Email support'],
    highlight: false,
  },
  {
    name: 'Professional',
    price: '$49',
    desc: 'The complete toolkit for growing broker agencies.',
    features: ['Up to 25 employer groups', 'Everything in Starter', 'Advanced analytics & exports', 'Compliance audit trail', 'Priority support'],
    highlight: true,
  },
  {
    name: 'Agency',
    price: '$69',
    desc: 'Enterprise-grade for large agencies and TPAs.',
    features: ['Unlimited employer groups', 'Everything in Professional', 'White-label portal', 'Dedicated account manager', 'SLA guarantee'],
    highlight: false,
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
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
      <div className="fixed inset-0 flex items-center justify-center bg-[#0b1a3b]">
        <div className="w-8 h-8 border-4 border-[#0ea5e9]/30 border-t-[#0ea5e9] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1a3b] text-white flex flex-col font-inter">

      {/* Nav */}
      <header className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/10 sticky top-0 bg-[#0b1a3b]/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/69d54be4c2cc9594e999e9ca/f03013bba_COBRAShieldProLogo-TransparentBackground.png"
            alt="COBRA Shield Pro"
            className="h-10 w-10 object-contain"
          />
          <span className="text-lg font-bold tracking-tight">
            <span className="text-white">COBRA</span>{' '}
            <span className="text-[#0ea5e9]">Shield Pro</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSignIn} className="text-sm text-white/70 hover:text-white transition-colors hidden sm:block px-3 py-1.5">
            Log In
          </button>
          <button
            onClick={handleRegister}
            className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col lg:flex-row items-center gap-12 px-6 md:px-12 lg:px-16 pt-20 pb-16 max-w-7xl mx-auto w-full">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 text-[#0ea5e9] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Shield className="w-3 h-3" /> ACA · ERISA · DOL Compliant
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            COBRA Compliance.<br />
            <span className="text-[#0ea5e9]">Simplified</span> for Brokers.
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
            Stop managing COBRA manually. COBRA Shield Pro automates notices, tracks every deadline, and keeps your employer clients compliant — so you can focus on growing your book.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={handleRegister}
              className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold px-8 py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base shadow-lg shadow-[#0ea5e9]/20"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleSignIn}
              className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
            >
              Sign In to My Account
            </button>
          </div>
          <p className="mt-4 text-sm text-white/40">No credit card required · 3-day free trial</p>
        </div>

        {/* App screenshot mockup */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none">
          <div className="bg-[#0f2252] rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/40">
            <div className="bg-[#0b1a3b] border-b border-white/10 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-2 text-xs text-white/40">app.cobrashieldpro.com</span>
            </div>
            <img
              src="https://cobrashieldpro.com/airo-assets/images/pages/home/dashboard-screen"
              alt="COBRA Shield Pro Dashboard"
              className="w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="border-y border-white/10 bg-white/5 py-4 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-10 gap-y-2">
          {trustBadges.map(badge => (
            <div key={badge} className="flex items-center gap-2 text-sm text-white/60">
              <CheckCircle className="w-4 h-4 text-[#0ea5e9]" />
              {badge}
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="px-6 md:px-12 py-24 max-w-6xl mx-auto w-full">
        <div className="text-center mb-14">
          <p className="text-[#0ea5e9] text-xs font-bold uppercase tracking-widest mb-3">Platform Capabilities</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Everything you need to run COBRA —<br className="hidden md:block" /> nothing you don't.</h2>
          <p className="text-white/60 max-w-xl mx-auto">Purpose-built for insurance brokers. Every feature maps directly to a real compliance workflow.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-[#0f2252] border border-white/10 rounded-2xl p-6 hover:border-[#0ea5e9]/30 transition-colors group">
              <div className="w-10 h-10 bg-[#0ea5e9]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#0ea5e9]/20 transition-colors">
                <Icon className="w-5 h-5 text-[#0ea5e9]" />
              </div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose us */}
      <section className="bg-[#0f2252] border-y border-white/10 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <p className="text-[#0ea5e9] text-xs font-bold uppercase tracking-widest mb-3">Why Choose Us</p>
          <h2 className="text-3xl md:text-4xl font-extrabold">The broker's choice for COBRA administration.</h2>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { title: 'Compliance Guarantee', desc: 'Built to meet DOL, ACA, and ERISA requirements. Every notice template and deadline calculation designed to keep your clients compliant.', tag: 'DOL · ACA · ERISA' },
            { title: '10x Faster Administration', desc: 'What used to take hours now takes minutes. Automate repetitive work and focus on growing your book of business.', tag: 'Save Hours Every Week' },
            { title: 'Built for Brokers', desc: 'Not a generic HR tool. Every workflow is designed around how insurance brokers actually manage COBRA for employer clients.', tag: 'Broker-First Design' },
            { title: 'Dedicated Support', desc: 'Real humans who understand COBRA. Our compliance specialists are available by phone, chat, or email — not just a generic help desk.', tag: 'Real Human Support' },
          ].map(item => (
            <div key={item.title} className="bg-[#0b1a3b] border border-white/10 rounded-2xl p-6">
              <span className="text-xs text-[#0ea5e9] font-semibold bg-[#0ea5e9]/10 px-3 py-1 rounded-full">{item.tag}</span>
              <h3 className="font-bold text-white text-lg mt-4 mb-2">{item.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 md:px-12 py-24 max-w-6xl mx-auto w-full">
        <div className="text-center mb-14">
          <p className="text-[#0ea5e9] text-xs font-bold uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Simple, transparent pricing for brokers.</h2>
          <p className="text-white/60">No per-employee fees. No surprise charges. Plans start at $19/mo.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 border flex flex-col ${
                plan.highlight
                  ? 'bg-[#0ea5e9] border-[#0ea5e9] text-white shadow-xl shadow-[#0ea5e9]/20 scale-105'
                  : 'bg-[#0f2252] border-white/10 text-white'
              }`}
            >
              {plan.highlight && (
                <span className="text-xs font-bold uppercase tracking-widest bg-white/20 text-white px-3 py-1 rounded-full self-start mb-4">Most Popular</span>
              )}
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${plan.highlight ? 'text-white/80' : 'text-[#0ea5e9]'}`}>{plan.name}</p>
              <p className="text-4xl font-extrabold mb-1">{plan.price}<span className={`text-base font-normal ${plan.highlight ? 'text-white/70' : 'text-white/50'}`}>/mo</span></p>
              <p className={`text-sm mb-6 ${plan.highlight ? 'text-white/80' : 'text-white/60'}`}>{plan.desc}</p>
              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-white' : 'text-[#0ea5e9]'}`} />
                    <span className={plan.highlight ? 'text-white/90' : 'text-white/70'}>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleRegister}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                  plan.highlight
                    ? 'bg-white text-[#0ea5e9] hover:bg-white/90'
                    : 'bg-[#0ea5e9] hover:bg-[#0284c7] text-white'
                }`}
              >
                Start Free Trial
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#0f2252] border-y border-white/10 px-6 md:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-12">What brokers are saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ quote, name, role }) => (
              <div key={name} className="bg-[#0b1a3b] rounded-2xl p-6 border border-white/10">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[#0ea5e9] text-[#0ea5e9]" />)}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-4">"{quote}"</p>
                <div>
                  <p className="font-bold text-white text-sm">{name}</p>
                  <p className="text-white/40 text-xs">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to simplify COBRA for your entire book of business?</h2>
          <p className="text-white/60 mb-8">Join 500+ insurance brokers who've replaced manual COBRA tracking with COBRA Shield Pro. Start your free trial — no credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRegister}
              className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold px-10 py-4 rounded-xl text-base flex items-center justify-center gap-2 shadow-lg shadow-[#0ea5e9]/20"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleSignIn}
              className="border border-white/20 hover:border-white/40 text-white font-semibold px-10 py-4 rounded-xl text-base transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-white/30 text-sm border-t border-white/10">
        © {new Date().getFullYear()} COBRA Shield Pro. All rights reserved.
      </footer>
    </div>
  );
}