import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COVERAGE_MONTHS = {
  termination: 18,
  reduction_in_hours: 18,
  death_of_employee: 36,
  divorce: 36,
  medicare_entitlement: 36,
  loss_of_dependent_status: 36,
  employer_bankruptcy: 18,
};

const EVENT_TYPE_LABELS = {
  termination: 'Termination of Employment',
  reduction_in_hours: 'Reduction in Hours',
  death_of_employee: 'Death of Employee',
  divorce: 'Divorce / Legal Separation',
  medicare_entitlement: 'Medicare Entitlement',
  loss_of_dependent_status: 'Loss of Dependent Status',
  employer_bankruptcy: 'Employer Bankruptcy',
};

const NOTICE_TYPE_LABELS = {
  general_rights: 'General Rights Notice',
  election: 'Election Notice',
  unavailability: 'Unavailability Notice',
  early_termination: 'Early Termination Notice',
  insufficient_payment: 'Insufficient Payment Notice',
  conversion: 'Conversion Notice',
};

function fmt(d) {
  if (!d) return 'N/A';
  try { return format(new Date(d), 'MMMM d, yyyy'); } catch { return d; }
}

function buildNoticeText(notice, beneficiary, qualifyingEvent, client) {
  const today = fmt(new Date().toISOString().split('T')[0]);
  const name = `${beneficiary.first_name} ${beneficiary.last_name}`;
  const eventLabel = EVENT_TYPE_LABELS[qualifyingEvent?.event_type] || 'Qualifying Event';
  const eventDate = fmt(qualifyingEvent?.event_date);
  const cobraStart = fmt(beneficiary.cobra_start_date);
  const cobraEnd = fmt(beneficiary.cobra_end_date);
  const coverageLoss = fmt(qualifyingEvent?.coverage_loss_date || qualifyingEvent?.event_date);
  const electionDeadline = fmt(notice.election_deadline);
  const premium = beneficiary.monthly_premium
    ? `$${Number(beneficiary.monthly_premium).toFixed(2)}/month`
    : 'as determined by the plan';
  const coverageMonths = COVERAGE_MONTHS[qualifyingEvent?.event_type] || 18;
  const planName = client?.company_name || 'the Group Health Plan';
  const adminContact = [
    client?.contact_name,
    client?.contact_email,
    client?.contact_phone,
  ].filter(Boolean).join(' | ');

  const addr = [
    beneficiary.address,
    [beneficiary.city, beneficiary.state, beneficiary.zip].filter(Boolean).join(', '),
  ].filter(Boolean).join('\n');

  const fromAddr = [
    client?.company_name,
    client?.address,
    [client?.city, client?.state, client?.zip].filter(Boolean).join(', '),
  ].filter(Boolean).join('\n');

  const header = `IMPORTANT NOTICE — COBRA CONTINUATION COVERAGE\nDate: ${today}\n\nTo: ${name}\n${addr}\n\nFrom: ${fromAddr}\nPlan Administrator: ${adminContact}`;

  if (notice.notice_type === 'election') {
    return `${header}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTICE OF COBRA CONTINUATION COVERAGE RIGHTS
(Required by ERISA § 606 and 29 CFR § 2590.606-4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTRODUCTION

This notice contains important information about your right to continue your health care coverage in ${planName} (the "Plan"), as well as other health coverage alternatives that may be available to you. Please read the information contained in this notice very carefully before you make your decision.

WHY ARE YOU RECEIVING THIS NOTICE?

You are receiving this notice because a qualifying event has occurred that causes you (or your covered dependents) to lose coverage under the Plan.

Qualifying Event: ${eventLabel}
Date of Event: ${eventDate}
Date Coverage Lost (or Will Be Lost): ${coverageLoss}

As a result of this qualifying event, your coverage under the Plan will end unless you elect to continue it under COBRA.

WHO IS ENTITLED TO ELECT COBRA CONTINUATION COVERAGE?

Each individual who is a "qualified beneficiary" with respect to this qualifying event has an independent right to elect COBRA continuation coverage. ${name} is a qualified beneficiary entitled to elect COBRA coverage. If applicable, each covered spouse and dependent child also has an independent right to elect.

WHAT IS COBRA CONTINUATION COVERAGE?

COBRA continuation coverage is the same coverage that the Plan gives to other participants or beneficiaries who are not receiving COBRA continuation coverage. Each qualified beneficiary who elects COBRA continuation coverage will have the same rights under the Plan as other participants or beneficiaries covered under the Plan, including special enrollment rights.

HOW LONG WILL CONTINUATION COVERAGE LAST?

In the case of a loss of coverage due to ${eventLabel}, a qualified beneficiary may elect continuation coverage for up to ${coverageMonths} months.

Continuation Coverage Period: ${cobraStart} through ${cobraEnd}

COBRA continuation coverage may be terminated before the end of the maximum period if:
  • Any required premium is not paid in full on time;
  • A qualified beneficiary becomes covered, after electing COBRA, under another group health plan;
  • A qualified beneficiary becomes entitled to Medicare benefits (under Part A, Part B, or both) after electing COBRA;
  • The employer ceases to provide any group health plan to any employee; or
  • The Plan terminates.

HOW DO YOU ELECT COBRA CONTINUATION COVERAGE?

You must complete the enclosed COBRA Election Form and return it to the Plan Administrator no later than:

ELECTION DEADLINE: ${electionDeadline !== 'N/A' ? electionDeadline : '60 days from the date of this notice or the date coverage is lost, whichever is later'}

Send the completed election form to:
${client?.contact_name || 'Plan Administrator'}
${client?.address || ''}
${[client?.city, client?.state, client?.zip].filter(Boolean).join(', ')}

If you do not submit a completed election form by the deadline, you will lose your right to elect COBRA continuation coverage.

WHAT IS THE COST OF COBRA CONTINUATION COVERAGE?

The amount you will be required to pay for COBRA continuation coverage is ${premium}. This is 102% of the cost to the Plan. You may be required to pay the first premium payment within 45 days after the date of your COBRA election.

COBRA ELECTION FORM
─────────────────────────────────────────────────────────
I elect COBRA continuation coverage under the Plan.

Name: ${name}
Address: ${addr || '_______________________________'}

Signature: _________________________ Date: _____________
─────────────────────────────────────────────────────────

IF YOU HAVE QUESTIONS

Questions concerning your Plan or your COBRA continuation coverage rights should be addressed to:

${adminContact || 'Plan Administrator (contact information on file)'}

For more information about your rights under ERISA, including COBRA, the Health Insurance Portability and Accountability Act (HIPAA), and other laws affecting group health plans, contact the nearest Regional or District Office of the U.S. Department of Labor's Employee Benefits Security Administration (EBSA) in your area or visit the EBSA website at www.dol.gov/ebsa. (Addresses and phone numbers of Regional and District EBSA Offices are available through EBSA's website.) For more information about the Marketplace, visit www.HealthCare.gov.

KEEP THIS NOTICE FOR YOUR RECORDS.`;
  }

  if (notice.notice_type === 'general_rights') {
    return `${header}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERAL NOTICE OF COBRA CONTINUATION COVERAGE
(Required by ERISA § 606 and 29 CFR § 2590.606-2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are receiving this General Notice of COBRA Continuation Coverage Rights because you recently became covered under ${planName} (the "Plan"). This notice contains important information about your right to COBRA continuation coverage.

WHAT IS COBRA CONTINUATION COVERAGE?

Federal law requires that most group health plans (including this Plan) give employees and their families the opportunity to continue their health care coverage when there is a "qualifying event" that would result in a loss of coverage under an employer's plan. Depending on the type of qualifying event, "qualified beneficiaries" can include the employee covered under the group health plan, the covered employee's spouse, and the dependent children of the covered employee.

QUALIFYING EVENTS

Qualifying events that trigger COBRA rights include:
  • Termination of the covered employee's employment (for reasons other than gross misconduct);
  • Reduction in the covered employee's hours of employment;
  • Death of the covered employee;
  • Divorce or legal separation of the covered employee from the employee's spouse;
  • The covered employee becoming entitled to Medicare;
  • A dependent child ceasing to be a dependent under the plan.

DURATION OF COBRA COVERAGE

  • 18 months: Termination or reduction in hours
  • 36 months: All other qualifying events (death, divorce, Medicare entitlement, loss of dependent status)

COST OF COBRA COVERAGE

Qualified beneficiaries who elect COBRA coverage may be required to pay up to 102% of the applicable premium.

KEEP YOUR PLAN INFORMED OF ADDRESS CHANGES

In order to protect your family's rights, you should keep the Plan Administrator informed of any changes in the addresses of family members. You should also keep a copy, for your records, of any notices you send to the Plan Administrator.

Plan Administrator Contact:
${adminContact || 'See Plan Documents'}

For information about the Marketplace, visit www.HealthCare.gov or call 1-800-318-2596.

KEEP THIS NOTICE FOR YOUR RECORDS.`;
  }

  if (notice.notice_type === 'early_termination') {
    return `${header}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTICE OF EARLY TERMINATION OF COBRA CONTINUATION COVERAGE
(Required by ERISA § 606 and 29 CFR § 2590.606-4(g))
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear ${name},

This notice is to inform you that your COBRA continuation coverage under ${planName} will be terminated before the maximum continuation coverage period would otherwise end.

Your COBRA continuation coverage will terminate on: ${cobraEnd}

REASON FOR EARLY TERMINATION

Your COBRA continuation coverage is being terminated for the following reason(s) [to be completed by plan administrator]:

  □ Failure to pay required premiums on time
  □ You have become covered under another group health plan
  □ You have become entitled to Medicare
  □ Other: ___________________________________________

YOUR RIGHTS FOLLOWING TERMINATION

You may have the right to convert to an individual health insurance policy. You should contact the Plan Administrator immediately to inquire about any available conversion rights:

${adminContact}

You may also be eligible to enroll in a Marketplace plan. Losing COBRA coverage qualifies you for a Special Enrollment Period. Visit www.HealthCare.gov for more information.

KEEP THIS NOTICE FOR YOUR RECORDS.`;
  }

  if (notice.notice_type === 'conversion') {
    return `${header}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTICE OF CONVERSION RIGHTS — COBRA COVERAGE ENDING
(Required by 29 CFR § 2590.606-4(g))
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear ${name},

Your COBRA continuation coverage under ${planName} will reach its maximum duration and end on:

COBRA Coverage End Date: ${cobraEnd}

YOUR CONVERSION RIGHTS

You may have the right to convert your group health coverage to an individual health insurance policy without evidence of insurability, subject to the terms of the Plan. To exercise your conversion right, you must apply and pay the first premium within the period specified under the Plan — typically within 31 days of the date COBRA coverage ends.

Please contact the Plan Administrator immediately to obtain information about available conversion options:
${adminContact}

MARKETPLACE ALTERNATIVE

Losing COBRA coverage qualifies you for a Special Enrollment Period in the Health Insurance Marketplace. You have 60 days from the loss of coverage to enroll. Visit www.HealthCare.gov or call 1-800-318-2596.

KEEP THIS NOTICE FOR YOUR RECORDS.`;
  }

  if (notice.notice_type === 'unavailability') {
    return `${header}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTICE OF UNAVAILABILITY OF COBRA CONTINUATION COVERAGE
(Required by 29 CFR § 2590.606-4(b)(4))
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear ${name},

This notice is in response to your request for COBRA continuation coverage under ${planName}.

We are unable to provide COBRA continuation coverage to you for the following reason(s):

  □ You are not a qualified beneficiary with respect to the qualifying event.
  □ The qualifying event you identified does not entitle you to COBRA coverage under the Plan.
  □ The election period for the qualifying event you identified has expired.
  □ Other: ___________________________________________

If you have questions about this determination, please contact the Plan Administrator:
${adminContact}

You also have the right to contact the U.S. Department of Labor, Employee Benefits Security Administration (EBSA) at 1-866-444-3272 or www.dol.gov/ebsa if you believe this determination is in error.

KEEP THIS NOTICE FOR YOUR RECORDS.`;
  }

  if (notice.notice_type === 'insufficient_payment') {
    return `${header}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTICE OF INSUFFICIENT PAYMENT — COBRA CONTINUATION COVERAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear ${name},

This notice is to inform you that your most recent COBRA premium payment was insufficient. Your current monthly COBRA premium is ${premium}.

To keep your COBRA continuation coverage in effect, you must remit the remaining balance owed within 30 days of the date of this notice.

If full payment is not received by the deadline, your COBRA continuation coverage will be terminated retroactively to the date the inadequate payment was received.

Please remit payment to:
${client?.contact_name || 'Plan Administrator'}
${client?.address || ''}

If you have questions, please contact the Plan Administrator at: ${adminContact}

KEEP THIS NOTICE FOR YOUR RECORDS.`;
  }

  // Generic fallback
  return `${header}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${NOTICE_TYPE_LABELS[notice.notice_type] || 'COBRA NOTICE'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear ${name},

This notice is sent on behalf of ${planName} regarding your COBRA continuation coverage.

Please contact the Plan Administrator for details:
${adminContact}

KEEP THIS NOTICE FOR YOUR RECORDS.`;
}

export default function NoticeViewer({ notice, beneficiary, qualifyingEvent, client }) {
  if (!notice || !beneficiary) return null;

  const noticeText = buildNoticeText(notice, beneficiary, qualifyingEvent, client);
  const noticeLabel = NOTICE_TYPE_LABELS[notice.notice_type] || notice.notice_type;

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${noticeLabel} — ${beneficiary.first_name} ${beneficiary.last_name}</title>
  <style>
    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; margin: 1in; line-height: 1.6; }
    pre { white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
    @media print { body { margin: 0.75in; } }
  </style>
</head>
<body>
  <pre>${noticeText}</pre>
</body>
</html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Print Notice
        </Button>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-800">
          {noticeText}
        </pre>
      </div>
    </div>
  );
}