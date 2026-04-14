import { useState } from 'react';
import { Shield, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';

// States with Mini-COBRA / state continuation laws distinct from Federal
const STATE_MINI_COBRA = [
  {
    state: 'Arizona',
    abbr: 'AZ',
    employerSize: 'Employers with 2–19 employees',
    duration: '18 months; 36 months if a second qualifying event occurs',
    maxPremium: '105% of premium; 150% during disability extension',
    qualifyingBeneficiaries: 'Employees and dependents covered for at least 3 months prior to qualifying event',
    qualifyingEvents: 'Termination (except gross misconduct), divorce or legal separation, loss of dependent status, employee enrolls in Medicare, employee dies',
    notes: '',
  },
  {
    state: 'Arkansas',
    abbr: 'AR',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '120 days',
    maxPremium: 'Not specified by state statute',
    qualifyingBeneficiaries: 'Employees and dependents continuously insured for at least 3 months prior to qualifying event',
    qualifyingEvents: 'Termination, change in marital status, termination of membership in a class eligible for coverage',
    notes: '',
  },
  {
    state: 'California',
    abbr: 'CA',
    employerSize: 'Employers with 2–19 employees. For employers with 20+ employees, Cal-COBRA may extend coverage up to 36 months.',
    duration: '36 months (either 36 months of Cal-COBRA alone, or 18 months of federal COBRA followed by 18 months of Cal-COBRA)',
    maxPremium: '110% of the applicable rate; 150% of group rate after first 18 months for disabled beneficiaries',
    qualifyingBeneficiaries: 'Any individual enrolled in a group health plan on the day before a qualifying event',
    qualifyingEvents: 'Termination (except gross misconduct), reduction in hours, divorce or legal separation, loss of dependent status, employee enrolls in Medicare, employee dies',
    notes: 'Cal-COBRA does not apply to dental and vision plans for 20+ employee employers.',
  },
  {
    state: 'Colorado',
    abbr: 'CO',
    employerSize: 'Any size employer where federal COBRA does not apply',
    duration: '18 months',
    maxPremium: 'Not specifically addressed by state statute',
    qualifyingBeneficiaries: 'Employee and dependents continuously covered for at least 6 months',
    qualifyingEvents: 'Termination, employee\'s death, change in marital or civil union status, reduction in hours',
    notes: '',
  },
  {
    state: 'Connecticut',
    abbr: 'CT',
    employerSize: 'All employers (no minimum size)',
    duration: '30 months for layoff, reduction in hours, leave of absence, or termination; 38 months for death, divorce, Medicare eligibility, or loss of dependent status',
    maxPremium: '102% of the premium',
    qualifyingBeneficiaries: 'Employee, employee\'s spouse, unmarried children under 26, stepchildren',
    qualifyingEvents: 'Layoff, reduction in hours, leave of absence, termination (except gross misconduct), employee\'s death, divorce or legal separation, loss of dependent status, Medicare eligibility',
    notes: 'Connecticut applies to all employers regardless of size.',
  },
  {
    state: 'Delaware',
    abbr: 'DE',
    employerSize: 'Employers with 1–19 employees',
    duration: '9 months',
    maxPremium: '102% of the group rate',
    qualifyingBeneficiaries: 'Covered employee or eligible dependent continuously insured for the entire 3-month period prior to qualifying event',
    qualifyingEvents: 'Employee\'s death, termination (other than gross misconduct) or reduction of hours, divorce or legal separation, employee becoming entitled to Medicare, loss of dependent child status, certain employer bankruptcies',
    notes: '',
  },
  {
    state: 'District of Columbia',
    abbr: 'DC',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '3 months',
    maxPremium: '102% of the group rate',
    qualifyingBeneficiaries: 'Employees and covered dependents',
    qualifyingEvents: 'Any event that results in loss of coverage (except termination for gross misconduct, eligibility for federal COBRA, or failure to elect/pay timely)',
    notes: '',
  },
  {
    state: 'Florida',
    abbr: 'FL',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '18 months; 29 months for disability extension',
    maxPremium: '115% of the applicable premium; 150% during 11-month disability extension',
    qualifyingBeneficiaries: 'Covered employee (except terminated for gross misconduct), employee\'s spouse, employee\'s dependent child',
    qualifyingEvents: 'Employee\'s death, termination or reduction in hours, divorce or legal separation, employee becoming entitled to Medicare, loss of dependent child status, retiree coverage loss within 1 year of employer bankruptcy',
    notes: '',
  },
  {
    state: 'Georgia',
    abbr: 'GA',
    employerSize: 'Employers with fewer than 20 employees (extended continuation for 20+ employers for employees age 60+)',
    duration: '3 months (plus fractional month remaining at termination). Extended continuation available for employees age 60+ at larger employers.',
    maxPremium: 'Same rate as active group members; up to 120% for extended continuation coverage',
    qualifyingBeneficiaries: 'Employees continuously covered for at least 6 months and their eligible dependents',
    qualifyingEvents: 'Any event that results in loss of coverage (except termination for cause), for employees continuously covered at least 6 months',
    notes: 'Extended continuation under §33-24-21.2 generally applies to employees age 60 or older at employers with 20+ employees.',
  },
  {
    state: 'Hawaii',
    abbr: 'HI',
    employerSize: 'All employers (no minimum size)',
    duration: '3 months following the month the employee became hospitalized/disabled, or the period the employer paid regular wages, whichever is longer',
    maxPremium: 'Not specified by state statute',
    qualifyingBeneficiaries: 'Any regular employee employed for at least 4 consecutive weeks',
    qualifyingEvents: 'Employee is hospitalized or otherwise prevented from working due to sickness',
    notes: 'Hawaii\'s law is unique — it covers sickness-related inability to work rather than typical employment separation events.',
  },
  {
    state: 'Illinois',
    abbr: 'IL',
    employerSize: 'All employers (no minimum size)',
    duration: '12 months; 2 years for divorced/widowed spouses under age 55; until Medicare eligibility for spouses age 55+',
    maxPremium: '100% of premium; 120% for spouses age 55+ after first two years',
    qualifyingBeneficiaries: 'Employees and dependents continuously covered for 3 months before qualifying event; divorced or widowed spouses (any age) and dependent children under spousal continuation',
    qualifyingEvents: 'Termination or reduction in hours, divorce, employee\'s death, employee\'s retirement',
    notes: 'Spousal continuation coverage applies to divorced/widowed spouses and may extend until Medicare eligibility.',
  },
  {
    state: 'Iowa',
    abbr: 'IA',
    employerSize: 'All employers (no minimum size)',
    duration: '9 months',
    maxPremium: '100% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously covered for 3 months before qualifying event',
    qualifyingEvents: 'Termination of employment (including permanent or temporary layoff, approved leave of absence), employee\'s death, dissolution or annulment of marriage',
    notes: 'Iowa applies to all employers regardless of size.',
  },
  {
    state: 'Kansas',
    abbr: 'KS',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '18 months',
    maxPremium: '100% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously covered for 3 months before qualifying event',
    qualifyingEvents: 'Any event that results in loss of coverage',
    notes: '',
  },
  {
    state: 'Kentucky',
    abbr: 'KY',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '18 months',
    maxPremium: '100% of premium',
    qualifyingBeneficiaries: 'Employees and dependents',
    qualifyingEvents: 'Termination or reduction in hours; divorce; death of employee; employee becoming entitled to Medicare; loss of dependent status',
    notes: '',
  },
  {
    state: 'Louisiana',
    abbr: 'LA',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '12 months',
    maxPremium: '100% of premium',
    qualifyingBeneficiaries: 'Employees and dependents covered for at least 3 months prior to qualifying event',
    qualifyingEvents: 'Involuntary termination; reduction in hours; employee\'s death; divorce or legal separation; loss of dependent status; employee becomes entitled to Medicare',
    notes: '',
  },
  {
    state: 'Maine',
    abbr: 'ME',
    employerSize: 'All employers (no minimum size)',
    duration: 'Up to the next group anniversary date (but at least 31 days)',
    maxPremium: '102% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously insured for 3 months prior to qualifying event',
    qualifyingEvents: 'Termination, reduction in hours, or any event causing loss of group coverage',
    notes: 'Maine applies to all employers; coverage continues at least to the next group policy anniversary date.',
  },
  {
    state: 'Maryland',
    abbr: 'MD',
    employerSize: 'All employers (no minimum size)',
    duration: '18 months',
    maxPremium: '102% of premium',
    qualifyingBeneficiaries: 'Employees and dependents',
    qualifyingEvents: 'Termination, reduction in hours, death of employee, divorce or legal separation, loss of dependent status, employee becomes entitled to Medicare',
    notes: 'Maryland applies to all employers regardless of size.',
  },
  {
    state: 'Massachusetts',
    abbr: 'MA',
    employerSize: 'Employers with 2–19 employees',
    duration: '18 months',
    maxPremium: '102% of premium',
    qualifyingBeneficiaries: 'Employees and dependents who were enrolled for at least 3 months before qualifying event',
    qualifyingEvents: 'Termination, reduction in hours, divorce or legal separation, death of employee, loss of dependent status, employee becomes entitled to Medicare',
    notes: 'Massachusetts Mini-COBRA mirrors federal qualifying events.',
  },
  {
    state: 'Michigan',
    abbr: 'MI',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '18 months',
    maxPremium: '100% of premium',
    qualifyingBeneficiaries: 'Employees and dependents',
    qualifyingEvents: 'Termination, reduction in hours, divorce, death of employee, employee\'s Medicare entitlement, loss of dependent status',
    notes: '',
  },
  {
    state: 'Minnesota',
    abbr: 'MN',
    employerSize: 'All employers (no minimum size)',
    duration: '18 months',
    maxPremium: '102% of premium',
    qualifyingBeneficiaries: 'Employees and dependents',
    qualifyingEvents: 'Termination, reduction in hours, divorce or legal separation, death of employee, employee\'s Medicare entitlement, loss of dependent status',
    notes: 'Minnesota applies to all employers regardless of size.',
  },
  {
    state: 'Missouri',
    abbr: 'MO',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '18 months',
    maxPremium: '100% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously covered for 3 months before qualifying event',
    qualifyingEvents: 'Termination, reduction in hours, death of employee, divorce or legal separation, loss of dependent status, employee becomes entitled to Medicare',
    notes: '',
  },
  {
    state: 'Montana',
    abbr: 'MT',
    employerSize: 'All employers (no minimum size)',
    duration: '18 months',
    maxPremium: 'Not specified by state statute',
    qualifyingBeneficiaries: 'Employees and dependents',
    qualifyingEvents: 'Any event that results in loss of coverage',
    notes: 'Montana applies to all employers.',
  },
  {
    state: 'Nebraska',
    abbr: 'NE',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '6 months',
    maxPremium: '100% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously insured for at least 3 months prior to qualifying event',
    qualifyingEvents: 'Termination, reduction in hours, death of employee, divorce or legal separation, loss of dependent status',
    notes: '',
  },
  {
    state: 'Nevada',
    abbr: 'NV',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '18 months',
    maxPremium: '100% of premium',
    qualifyingBeneficiaries: 'Employees and dependents',
    qualifyingEvents: 'Termination, reduction in hours, death of employee, divorce or legal separation, loss of dependent status, employee becomes entitled to Medicare',
    notes: '',
  },
  {
    state: 'New Hampshire',
    abbr: 'NH',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '18 months',
    maxPremium: '102% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously covered for at least 3 months',
    qualifyingEvents: 'Termination, reduction in hours, divorce, death of employee, loss of dependent status, employee becomes entitled to Medicare',
    notes: '',
  },
  {
    state: 'New Jersey',
    abbr: 'NJ',
    employerSize: 'Employers with 2–19 employees',
    duration: '18 months',
    maxPremium: '102% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously covered for at least 3 months',
    qualifyingEvents: 'Termination, reduction in hours, divorce or legal separation, death of employee, loss of dependent status, employee becomes entitled to Medicare',
    notes: '',
  },
  {
    state: 'New Mexico',
    abbr: 'NM',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '6 months',
    maxPremium: 'Not specified by state statute',
    qualifyingBeneficiaries: 'Employees and dependents',
    qualifyingEvents: 'Termination, reduction in hours, death of employee, divorce or legal separation, loss of dependent status',
    notes: '',
  },
  {
    state: 'New York',
    abbr: 'NY',
    employerSize: 'All employers (no minimum size)',
    duration: '36 months',
    maxPremium: '102% of premium',
    qualifyingBeneficiaries: 'Employees and dependents',
    qualifyingEvents: 'Termination, reduction in hours, divorce or legal separation, death of employee, loss of dependent status, employee becomes entitled to Medicare',
    notes: 'New York applies to all employers and offers one of the longest continuation periods (36 months).',
  },
  {
    state: 'North Carolina',
    abbr: 'NC',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '18 months',
    maxPremium: '102% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously covered for at least 3 months',
    qualifyingEvents: 'Termination, reduction in hours, divorce or legal separation, death of employee, loss of dependent status, employee becomes entitled to Medicare',
    notes: '',
  },
  {
    state: 'Ohio',
    abbr: 'OH',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '12 months',
    maxPremium: '100% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously covered for at least 3 months',
    qualifyingEvents: 'Termination, reduction in hours, death of employee, divorce or legal separation, loss of dependent status',
    notes: '',
  },
  {
    state: 'Oklahoma',
    abbr: 'OK',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '63 days (converted policy option)',
    maxPremium: 'Not specified; conversion policy rates apply',
    qualifyingBeneficiaries: 'Employees and dependents',
    qualifyingEvents: 'Termination of group coverage',
    notes: 'Oklahoma provides a right to convert to an individual policy rather than traditional continuation coverage.',
  },
  {
    state: 'Oregon',
    abbr: 'OR',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '9 months',
    maxPremium: '100% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously covered for at least 3 months',
    qualifyingEvents: 'Termination, reduction in hours, divorce or legal separation, death of employee, loss of dependent status, employee becomes entitled to Medicare',
    notes: '',
  },
  {
    state: 'Pennsylvania',
    abbr: 'PA',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '9 months',
    maxPremium: '105% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously covered for at least 3 months',
    qualifyingEvents: 'Termination, reduction in hours, divorce or legal separation, death of employee, loss of dependent status, employee becomes entitled to Medicare',
    notes: '',
  },
  {
    state: 'Rhode Island',
    abbr: 'RI',
    employerSize: 'All employers (no minimum size)',
    duration: '18 months',
    maxPremium: '102% of premium',
    qualifyingBeneficiaries: 'Employees and dependents',
    qualifyingEvents: 'Termination, reduction in hours, divorce or legal separation, death of employee, loss of dependent status, employee becomes entitled to Medicare',
    notes: 'Rhode Island applies to all employers regardless of size.',
  },
  {
    state: 'South Carolina',
    abbr: 'SC',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '18 months',
    maxPremium: '102% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously covered for at least 3 months',
    qualifyingEvents: 'Termination, reduction in hours, divorce or legal separation, death of employee, loss of dependent status, employee becomes entitled to Medicare',
    notes: '',
  },
  {
    state: 'South Dakota',
    abbr: 'SD',
    employerSize: 'All employers (no minimum size)',
    duration: '18 months',
    maxPremium: 'Not specified by state statute',
    qualifyingBeneficiaries: 'Employees and dependents',
    qualifyingEvents: 'Any event resulting in loss of coverage',
    notes: 'South Dakota applies to all employers.',
  },
  {
    state: 'Tennessee',
    abbr: 'TN',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '18 months',
    maxPremium: '100% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously covered for at least 3 months',
    qualifyingEvents: 'Termination, reduction in hours, divorce or legal separation, death of employee, loss of dependent status, employee becomes entitled to Medicare',
    notes: '',
  },
  {
    state: 'Texas',
    abbr: 'TX',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '9 months',
    maxPremium: '100% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously covered for at least 3 months',
    qualifyingEvents: 'Termination, reduction in hours, divorce or legal separation, death of employee, loss of dependent status, employee becomes entitled to Medicare',
    notes: '',
  },
  {
    state: 'Utah',
    abbr: 'UT',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '12 months',
    maxPremium: '102% of premium',
    qualifyingBeneficiaries: 'Employees and dependents',
    qualifyingEvents: 'Termination, reduction in hours, death of employee, divorce or legal separation, loss of dependent status, employee becomes entitled to Medicare',
    notes: '',
  },
  {
    state: 'Vermont',
    abbr: 'VT',
    employerSize: 'All employers (no minimum size)',
    duration: '18 months',
    maxPremium: '102% of premium',
    qualifyingBeneficiaries: 'Employees and dependents',
    qualifyingEvents: 'Termination, reduction in hours, divorce or legal separation, death of employee, loss of dependent status, employee becomes entitled to Medicare',
    notes: 'Vermont applies to all employers regardless of size.',
  },
  {
    state: 'Virginia',
    abbr: 'VA',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '12 months',
    maxPremium: '102% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously covered for at least 3 months',
    qualifyingEvents: 'Termination, reduction in hours, divorce or legal separation, death of employee, loss of dependent status, employee becomes entitled to Medicare',
    notes: '',
  },
  {
    state: 'Washington',
    abbr: 'WA',
    employerSize: 'Employers with fewer than 20 employees',
    duration: '8 months',
    maxPremium: '100% of premium',
    qualifyingBeneficiaries: 'Employees and dependents continuously covered for at least 3 months',
    qualifyingEvents: 'Termination, reduction in hours, death of employee, divorce or legal separation, loss of dependent status, employee becomes entitled to Medicare',
    notes: '',
  },
  {
    state: 'West Virginia',
    abbr: 'WV',
    employerSize: 'All employers (no minimum size)',
    duration: '18 months',
    maxPremium: '102% of premium',
    qualifyingBeneficiaries: 'Employees and dependents',
    qualifyingEvents: 'Termination, reduction in hours, divorce or legal separation, death of employee, loss of dependent status, employee becomes entitled to Medicare',
    notes: 'West Virginia applies to all employers regardless of size.',
  },
  {
    state: 'Wisconsin',
    abbr: 'WI',
    employerSize: 'All employers (no minimum size)',
    duration: '18 months',
    maxPremium: '102% of premium',
    qualifyingBeneficiaries: 'Employees, spouses, and dependents',
    qualifyingEvents: 'Termination, reduction in hours, divorce or legal separation, death of employee, loss of dependent status, employee becomes entitled to Medicare',
    notes: 'Wisconsin applies to all employers regardless of size.',
  },
];

// States that follow federal only (no state mini-COBRA)
const FEDERAL_ONLY_STATES = ['Alabama', 'Alaska', 'Idaho', 'Indiana', 'Mississippi', 'North Dakota', 'Wyoming'];

function StateCard({ entry }) {
  const [expanded, setExpanded] = useState(false);

  const allEmployers = entry.employerSize.toLowerCase().includes('all employers');

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
            {entry.abbr}
          </span>
          <div>
            <p className="font-semibold text-sm">{entry.state}</p>
            <p className="text-xs text-muted-foreground">{entry.employerSize}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {allEmployers && (
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 hidden sm:inline-flex">
              All Employers
            </span>
          )}
          <span className="text-xs text-muted-foreground hidden sm:block">{entry.duration}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Qualifying Beneficiaries</p>
            <p>{entry.qualifyingBeneficiaries}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Qualifying Events</p>
            <p>{entry.qualifyingEvents}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Max Duration</p>
            <p>{entry.duration}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Maximum Premium</p>
            <p>{entry.maxPremium}</p>
          </div>
          {entry.notes && (
            <div className="sm:col-span-2 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">{entry.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CobraEligibility() {
  const [search, setSearch] = useState('');

  const filtered = STATE_MINI_COBRA.filter(s =>
    s.state.toLowerCase().includes(search.toLowerCase()) ||
    s.abbr.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <PageHeader
        title="COBRA Eligibility Requirements"
        description="Federal requirements and state-specific Mini-COBRA laws"
      />

      {/* Federal Requirements */}
      <Card className="p-6 border-primary/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-1">Federal COBRA Requirements</h2>
            <p className="text-sm text-muted-foreground mb-5">
              The Consolidated Omnibus Budget Reconciliation Act (COBRA) is a federal law that establishes the minimum continuation coverage requirements for employers across the United States.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Covered Employers</p>
                <p className="text-sm">Employers with <strong>20 or more employees</strong> who sponsor group health plans</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Covered Plans</p>
                <p className="text-sm">Group health plans (medical, dental, vision). Does not apply to life insurance or disability plans.</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qualifying Beneficiaries</p>
                <p className="text-sm">Employees, spouses, and dependent children covered under the group plan</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maximum Premium</p>
                <p className="text-sm">102% of the cost to the plan; up to 150% during the 11-month disability extension period</p>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qualifying Events</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                  {[
                    { label: 'For Employees', events: ['Voluntary or involuntary termination (except gross misconduct)', 'Reduction in hours of employment'] },
                    { label: 'For Spouses', events: ['All employee events above', 'Employee becomes entitled to Medicare', 'Divorce or legal separation', 'Death of the employee'] },
                    { label: 'For Dependent Children', events: ['All spouse events above', 'Loss of dependent child status under the plan'] },
                  ].map(group => (
                    <div key={group.label} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">{group.label}</p>
                      <ul className="space-y-1">
                        {group.events.map(e => (
                          <li key={e} className="text-xs flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coverage Duration</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {[
                    { label: '18 months', desc: 'General rule for employees (termination or reduction in hours)' },
                    { label: '29 months', desc: 'Disability extension — if a qualifying beneficiary is disabled at the time of qualifying event' },
                    { label: '36 months', desc: 'For spouse or dependent: divorce, legal separation, Medicare entitlement, or death of employee' },
                    { label: '36 months', desc: 'For any qualified beneficiary experiencing a second qualifying event' },
                  ].map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 font-bold whitespace-nowrap flex-shrink-0">{d.label}</span>
                      <span className="text-muted-foreground">{d.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                <strong>Important:</strong> Federal COBRA applies only to fully insured and self-funded group health plans. Employers must notify plan administrators within 30 days of a qualifying event, and qualified beneficiaries have 60 days to elect continuation coverage.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* State Mini-COBRA Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">State Mini-COBRA Laws</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Although all employers with 20 or more employees are subject to Federal COBRA requirements, many individual states have implemented more stringent requirements for employers in their state. Below is a list of all of the individual states that mandate something different from Federal COBRA and their specific requirements. These state "Mini-COBRA" laws generally apply to <strong>fully insured plans only</strong> and typically cover smaller employers not subject to federal COBRA.
          </p>
        </div>

        {/* Federal-only states notice */}
        <div className="mb-4 flex items-start gap-2 bg-muted/50 border border-border rounded-lg p-3">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong>States following Federal COBRA only</strong> (no separate state Mini-COBRA law): {FEDERAL_ONLY_STATES.join(', ')}. Employers in these states with fewer than 20 employees are not required by their state to offer continuation coverage.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4 max-w-sm">
          <input
            type="text"
            placeholder="Search by state name or abbreviation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          {filtered.map(entry => (
            <StateCard key={entry.abbr} entry={entry} />
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No states found matching "{search}"</p>
          )}
        </div>

        <div className="mt-6 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            <strong>Disclaimer:</strong> State continuation coverage laws are subject to frequent change. This information is provided as a general reference only and should be verified with your insurance carrier and/or legal counsel before making compliance decisions. Self-funded plans are generally governed by federal ERISA and are typically not subject to state continuation coverage mandates.
          </p>
        </div>
      </div>
    </div>
  );
}