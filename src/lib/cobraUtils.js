import { addMonths, addDays, format } from 'date-fns';

// COBRA coverage duration by event type (per DOL/ERISA)
export const COVERAGE_MONTHS = {
  termination: 18,
  reduction_in_hours: 18,
  death_of_employee: 36,
  divorce: 36,
  medicare_entitlement: 36,
  loss_of_dependent_status: 36,
  employer_bankruptcy: 18,
};

export const EVENT_TYPE_LABELS = {
  termination: 'Termination of Employment',
  reduction_in_hours: 'Reduction in Hours',
  death_of_employee: 'Death of Employee',
  divorce: 'Divorce / Legal Separation',
  medicare_entitlement: 'Medicare Entitlement',
  loss_of_dependent_status: 'Loss of Dependent Status',
  employer_bankruptcy: 'Employer Bankruptcy',
};

export const NOTICE_TYPE_LABELS = {
  general_rights: 'General Rights Notice',
  election: 'Election Notice',
  unavailability: 'Unavailability Notice',
  early_termination: 'Early Termination Notice',
  insufficient_payment: 'Insufficient Payment Notice',
  conversion: 'Conversion Notice',
};

/**
 * Calculate COBRA end date from start date and event type
 */
export function calcCobraEndDate(cobraStartDate, eventType) {
  if (!cobraStartDate || !eventType) return '';
  const months = COVERAGE_MONTHS[eventType] || 18;
  const end = addMonths(new Date(cobraStartDate), months);
  return format(end, 'yyyy-MM-dd');
}

/**
 * Generate all required COBRA notices with their legal deadlines
 * based on a qualifying event.
 *
 * Legal rules (DOL / ERISA):
 *  - Election notice: must be provided within 14 days after the plan administrator
 *    receives notice of the qualifying event (or 44 days if the employer is also the admin).
 *    We use 14 days from notification_date.
 *  - Election deadline for beneficiary: 60 days from the later of coverage loss date
 *    or the date the election notice is provided.
 *  - Early termination notice: if COBRA is terminated early, must be sent as soon as
 *    practicable. We schedule 30 days before cobra_end_date as a reminder.
 *  - Insufficient payment: within a reasonable time (we set 30 days).
 *  - Conversion notice: within 180 days before COBRA expiration (we schedule 5 days
 *    before 180-day mark = cobra_end_date minus 175 days).
 */
export function generateRequiredNotices(beneficiary, qualifyingEvent, client) {
  const notices = [];
  const notificationDate = qualifyingEvent.notification_date
    ? new Date(qualifyingEvent.notification_date)
    : new Date(qualifyingEvent.event_date);

  const coverageLossDate = qualifyingEvent.coverage_loss_date
    ? new Date(qualifyingEvent.coverage_loss_date)
    : new Date(qualifyingEvent.event_date);

  // 1. Election Notice — due 14 days after admin receives notification
  //    We send 5 days before the due date as per your requirement
  const electionNoticeDue = addDays(notificationDate, 14);
  const electionNoticeSendBy = addDays(electionNoticeDue, -5);
  const electionDeadline = addDays(
    electionNoticeDue > coverageLossDate ? electionNoticeDue : coverageLossDate,
    60
  );

  notices.push({
    beneficiary_id: beneficiary.id,
    beneficiary_name: `${beneficiary.first_name} ${beneficiary.last_name}`,
    client_id: beneficiary.client_id,
    client_name: beneficiary.client_name,
    qualifying_event_id: qualifyingEvent.id,
    notice_type: 'election',
    due_date: format(electionNoticeDue, 'yyyy-MM-dd'),
    send_by_date: format(electionNoticeSendBy, 'yyyy-MM-dd'),
    delivery_method: 'first_class_mail',
    status: 'pending',
    election_deadline: format(electionDeadline, 'yyyy-MM-dd'),
  });

  // 2. Early Termination Notice — 30 days before COBRA end, send 5 days early
  if (beneficiary.cobra_end_date) {
    const earlyTermDue = addDays(new Date(beneficiary.cobra_end_date), -30);
    const earlyTermSendBy = addDays(earlyTermDue, -5);
    notices.push({
      beneficiary_id: beneficiary.id,
      beneficiary_name: `${beneficiary.first_name} ${beneficiary.last_name}`,
      client_id: beneficiary.client_id,
      client_name: beneficiary.client_name,
      qualifying_event_id: qualifyingEvent.id,
      notice_type: 'early_termination',
      due_date: format(earlyTermDue, 'yyyy-MM-dd'),
      send_by_date: format(earlyTermSendBy, 'yyyy-MM-dd'),
      delivery_method: 'first_class_mail',
      status: 'pending',
    });
  }

  // 3. Conversion Notice — 180 days before COBRA expiration (send 5 days early)
  if (beneficiary.cobra_end_date) {
    const conversionDue = addDays(new Date(beneficiary.cobra_end_date), -180);
    const conversionSendBy = addDays(conversionDue, -5);
    if (conversionDue > new Date()) {
      notices.push({
        beneficiary_id: beneficiary.id,
        beneficiary_name: `${beneficiary.first_name} ${beneficiary.last_name}`,
        client_id: beneficiary.client_id,
        client_name: beneficiary.client_name,
        qualifying_event_id: qualifyingEvent.id,
        notice_type: 'conversion',
        due_date: format(conversionDue, 'yyyy-MM-dd'),
        send_by_date: format(conversionSendBy, 'yyyy-MM-dd'),
        delivery_method: 'first_class_mail',
        status: 'pending',
      });
    }
  }

  return notices;
}

/**
 * Generate the full text content of a COBRA notice (DOL-compliant language)
 */
export function buildNoticeContent(noticeType, beneficiary, qualifyingEvent, client) {
  const today = format(new Date(), 'MMMM d, yyyy');
  const beneficiaryName = `${beneficiary.first_name} ${beneficiary.last_name}`;
  const eventLabel = EVENT_TYPE_LABELS[qualifyingEvent?.event_type] || 'Qualifying Event';
  const eventDate = qualifyingEvent?.event_date
    ? format(new Date(qualifyingEvent.event_date), 'MMMM d, yyyy')
    : '';
  const cobraEndDate = beneficiary.cobra_end_date
    ? format(new Date(beneficiary.cobra_end_date), 'MMMM d, yyyy')
    : 'N/A';
  const cobraStartDate = beneficiary.cobra_start_date
    ? format(new Date(beneficiary.cobra_start_date), 'MMMM d, yyyy')
    : 'N/A';
  const premium = beneficiary.monthly_premium
    ? `$${beneficiary.monthly_premium.toFixed(2)}`
    : 'as determined by the plan';
  const coverageMonths = COVERAGE_MONTHS[qualifyingEvent?.event_type] || 18;

  const header = `
IMPORTANT NOTICE — COBRA CONTINUATION COVERAGE
Date: ${today}

To: ${beneficiaryName}
${beneficiary.address ? beneficiary.address + '\n' : ''}${beneficiary.city ? beneficiary.city + ', ' : ''}${beneficiary.state || ''} ${beneficiary.zip || ''}

From: ${client?.company_name || 'Plan Administrator'}
${client?.address || ''}
${client?.city ? client.city + ', ' : ''}${client?.state || ''} ${client?.zip || ''}
Plan Administrator Contact: ${client?.contact_name || ''}, ${client?.contact_email || ''}, ${client?.contact_phone || ''}
  `.trim();

  if (noticeType === 'election') {
    return `${header}

RE: NOTICE OF COBRA CONTINUATION COVERAGE RIGHTS

INTRODUCTION

This notice contains important information about your right to continue your health care coverage in the ${client?.company_name || 'group health plan'} (the "Plan"), as well as other health coverage alternatives that may be available to you through the Health Insurance Marketplace. Please read this information carefully.

WHY ARE YOU RECEIVING THIS NOTICE?

You are receiving this notice because a qualifying event has occurred. Specifically: ${eventLabel} on ${eventDate}. As a result of this qualifying event, your coverage under the Plan will end (or has ended). Federal law gives certain individuals the right to elect continuation coverage (COBRA coverage) under the Plan when group health coverage would otherwise end.

WHO IS ENTITLED TO ELECT COBRA CONTINUATION COVERAGE?

${beneficiaryName} (and any eligible dependents covered under the Plan) may be entitled to elect COBRA continuation coverage.

WHAT IS COBRA CONTINUATION COVERAGE?

COBRA continuation coverage is the same coverage that the Plan gives to other participants or beneficiaries who are not receiving COBRA coverage. Each qualified beneficiary who elects COBRA coverage will have the same rights under the Plan as active employees and their families, including open enrollment and special enrollment rights.

HOW LONG WILL CONTINUATION COVERAGE LAST?

In the case of a qualifying event that is ${eventLabel}, continuation coverage may be available for up to ${coverageMonths} months, beginning ${cobraStartDate} and ending no later than ${cobraEndDate}, unless COBRA coverage is extended due to a disability or terminated early.

COBRA coverage may be terminated early if:
• Premiums are not paid on time
• The employer ceases to maintain any group health plan
• Coverage under another group health plan or Medicare occurs after the COBRA election
• The beneficiary is found not to have been entitled to COBRA coverage

COST OF CONTINUATION COVERAGE

The monthly cost for COBRA continuation coverage under the Plan is ${premium} per month. This amount may not exceed 102% of the applicable premium (or 150% in the case of the disability extension). You are responsible for making timely premium payments.

HOW DO YOU ELECT COBRA CONTINUATION COVERAGE?

To elect COBRA continuation coverage, you must complete the enclosed election form and return it to the Plan Administrator. Each qualified beneficiary has an independent right to elect. You must elect by the election deadline.

ELECTION DEADLINE

${qualifyingEvent?.notification_date ? `Your election deadline is 60 days from the later of: (1) the date coverage ends, or (2) the date of this notice. Please contact the Plan Administrator for your specific deadline.` : 'Contact the Plan Administrator for your specific election deadline.'}

IF YOU HAVE QUESTIONS

For questions about the information in this notice, or about rights under ERISA, contact the Plan Administrator at the address above or the nearest Regional or District Office of the U.S. Department of Labor's Employee Benefits Security Administration (EBSA) at 1-866-444-3272 or www.dol.gov/ebsa.

KEEP THIS NOTICE FOR YOUR RECORDS.
`;
  }

  if (noticeType === 'early_termination') {
    return `${header}

RE: NOTICE OF EARLY TERMINATION OF COBRA CONTINUATION COVERAGE

Dear ${beneficiaryName},

We are writing to inform you that your COBRA continuation coverage under the ${client?.company_name || ''} group health plan will be terminated before the maximum continuation coverage period would otherwise end.

Your COBRA coverage will terminate on ${cobraEndDate}.

REASON FOR EARLY TERMINATION

Your COBRA continuation coverage is being terminated because: [Reason to be provided by plan administrator — e.g., failure to pay premium on time, obtaining other group health coverage, or enrollment in Medicare.]

YOUR RIGHTS

You may have the right to convert to an individual policy under the terms of the group health plan. Please contact the Plan Administrator or your insurance carrier for information about conversion rights.

If you have questions about this notice or your rights, contact:
${client?.contact_name || 'Plan Administrator'}
${client?.contact_email || ''}
${client?.contact_phone || ''}
Or the U.S. Department of Labor, Employee Benefits Security Administration at 1-866-444-3272.

KEEP THIS NOTICE FOR YOUR RECORDS.
`;
  }

  if (noticeType === 'conversion') {
    return `${header}

RE: NOTICE OF CONVERSION RIGHTS — YOUR COBRA COVERAGE IS ENDING

Dear ${beneficiaryName},

Your COBRA continuation coverage under the ${client?.company_name || ''} group health plan will reach its maximum duration and end on ${cobraEndDate}.

YOUR CONVERSION RIGHTS

You may have the right to convert your COBRA continuation coverage to an individual health insurance policy without evidence of insurability. To exercise your conversion right, you must apply and pay the first premium within the period allowed under the Plan.

Please contact the Plan Administrator as soon as possible to obtain information about conversion options available to you:

${client?.contact_name || 'Plan Administrator'}
${client?.contact_email || ''}
${client?.contact_phone || ''}

MARKETPLACE COVERAGE ALTERNATIVE

As an alternative to conversion, you may be eligible to enroll in a Marketplace plan. Losing COBRA coverage is a qualifying life event that allows you to enroll in a Marketplace plan outside of the Open Enrollment period. Visit www.healthcare.gov for more information.

For questions about your rights under ERISA, contact the U.S. Department of Labor, EBSA, at 1-866-444-3272 or www.dol.gov/ebsa.

KEEP THIS NOTICE FOR YOUR RECORDS.
`;
  }

  // Generic fallback
  return `${header}

RE: ${NOTICE_TYPE_LABELS[noticeType] || 'COBRA Notice'}

Dear ${beneficiaryName},

This notice is sent on behalf of ${client?.company_name || 'the Plan Administrator'} regarding your COBRA continuation coverage.

Please contact the Plan Administrator for details:
${client?.contact_name || ''}
${client?.contact_email || ''}
${client?.contact_phone || ''}
`;
}