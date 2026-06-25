import { Resend } from 'resend';
import { render } from '@react-email/render';
import { InvitationEmail } from '@/components/emails/InvitationEmail';
import { RejectionEmail } from '@/components/emails/RejectionEmail';

if (!process.env.RESEND_API_KEY) {
    console.warn('Warning: RESEND_API_KEY is not set. Resend emails will not be sent.');
}

// Initialize lazily or with a fallback to avoid crash during build
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

export async function sendApplicantEmail(
    status: string,
    candidateName: string,
    candidateEmail: string,
    jobTitle: string
) {
    if (!resend) {
        console.warn('[Resend] Skipping email send: Resend client not initialized (check API key)');
        return;
    }

    try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const bookingUrl = process.env.INTERVIEW_BOOKING_URL || 'https://cv-screening-hr.vercel.app/';

        console.log(`[Resend] Preparing to send ${status} email to ${candidateEmail}...`);

        if (status === 'approved' || status === 'auto_approved') {
            const html = await render(<InvitationEmail candidateName={candidateName} jobTitle={jobTitle} bookingUrl={bookingUrl} />);
            const { data, error } = await resend.emails.send({
                from: `MyCompany HR <${fromEmail}>`,
                to: [candidateEmail],
                subject: `Interview Invitation: ${jobTitle} at MyCompany`,
                html,
            });
            if (error) throw error;
            console.log(`[Resend] Invitation email sent: ${data?.id}`);
        } else if (status === 'rejected' || status === 'auto_rejected') {
            const html = await render(<RejectionEmail candidateName={candidateName} jobTitle={jobTitle} />);
            const { data, error } = await resend.emails.send({
                from: `MyCompany HR <${fromEmail}>`,
                to: [candidateEmail],
                subject: `Application Update: ${jobTitle} at MyCompany`,
                html,
            });
            if (error) throw error;
            console.log(`[Resend] Rejection email sent: ${data?.id}`);
        }
    } catch (error) {
        console.error('[Resend Error] Failed to send email:', error);
    }
}
