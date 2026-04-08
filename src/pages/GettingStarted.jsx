import { Link } from 'react-router-dom';
import { Building2, Users, CalendarClock, Mail, DollarSign, Trash2, ArrowRight, BarChart2 } from 'lucide-react';

const steps = [
  {
    icon: Building2,
    title: '1. Add Your Clients',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    description: 'Start by adding your employer clients. Go to the Clients section in the sidebar and click "Add Client." Enter the company name, contact information, plan types (medical, dental, vision), and any broker details. Each client serves as the parent record for their employees.',
  },
  {
    icon: Users,
    title: '2. Add Beneficiaries',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    description: 'Under each client, add their employees and dependents as Beneficiaries. Navigate to the Beneficiaries section and click "Add Beneficiary." Select the associated client, enter personal details, coverage type, insurance carrier, and monthly premium amounts. The system will automatically calculate the total premium.',
  },
  {
    icon: CalendarClock,
    title: '3. Record Qualifying Events',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    description: 'When a beneficiary loses coverage (e.g., termination, reduction in hours, divorce), record it as a Qualifying Event. The system will automatically calculate the COBRA coverage period (18 or 36 months) and generate the required COBRA notices with proper deadlines.',
  },
  {
    icon: Mail,
    title: '4. Manage Notices',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    description: 'The Notices section tracks all required COBRA notices (General Rights, Election, etc.) with their due dates and delivery status. Notices are auto-generated when qualifying events are recorded. You can view, send, and track delivery for each notice.',
  },
  {
    icon: DollarSign,
    title: '5. Track Payments',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    description: 'Record and monitor COBRA premium payments in the Payments section. Track whether payments are received on time, in a grace period, or missed. The system applies the standard 102% COBRA premium rate automatically based on the beneficiary\'s monthly premiums.',
  },
  {
    icon: BarChart2,
    title: '6. Run Reports',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    description: 'Use the Employer Reports section to generate summaries for your clients — including notice activity, premium collection totals, participant history, and upcoming deadlines. Agency plan users can brand reports with their company logo.',
  },
];

export default function GettingStarted() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Getting Started</h1>
        <p className="text-muted-foreground mt-1">A quick guide to managing COBRA administration with COBRA Shield Pro.</p>
      </div>

      <div className="space-y-5">
        {steps.map((step) => (
          <div key={step.title} className={`rounded-xl border ${step.border} ${step.bg} p-5 flex gap-4`}>
            <div className={`w-10 h-10 rounded-lg bg-white border ${step.border} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <step.icon className={`w-5 h-5 ${step.color}`} />
            </div>
            <div>
              <h2 className={`font-semibold text-base ${step.color} mb-1`}>{step.title}</h2>
              <p className="text-sm text-foreground/80 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sample Data Notice */}
      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 flex gap-4">
        <div className="w-10 h-10 rounded-lg bg-white border border-amber-200 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Trash2 className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="font-semibold text-base text-amber-700 mb-1">Removing Sample Data</h2>
          <p className="text-sm text-foreground/80 leading-relaxed">
            The app may include sample clients and beneficiaries to help you explore its features. When you're ready to start fresh, 
            you can delete any sample records directly from the <strong>Clients</strong> and <strong>Beneficiaries</strong> sections 
            by opening a record and using the delete option. Removing a client will not automatically remove their beneficiaries — 
            delete those individually from the Beneficiaries section.
          </p>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        Still have questions?{' '}
        <Link to="/contact" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
          Contact Support <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}