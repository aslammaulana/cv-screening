import * as React from 'react';

interface InvitationEmailProps {
    candidateName: string;
    jobTitle: string;
    bookingUrl: string;
}

export const InvitationEmail: React.FC<InvitationEmailProps> = ({
    candidateName,
    jobTitle,
    bookingUrl,
}) => (
    <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
        <h2 style={{ color: '#2563eb' }}>Interview Invitation: {jobTitle} at MyCompany</h2>
        <p>Dear {candidateName},</p>
        <p>
            Congratulations! We are pleased to inform you that your resume has successfully passed our initial screening for the <strong>{jobTitle}</strong> position at MyCompany.
        </p>
        <p>
            We were highly impressed by your qualifications and would like to invite you to an interview to discuss your experience and the role in more detail.
        </p>
        <p>Please click the link below to select and book your preferred interview schedule:</p>
        <p>
            <a
                href={bookingUrl}
                style={{
                    display: 'inline-block',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    padding: '12px 24px',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold'
                }}
            >
                Book Interview Schedule
            </a>
        </p>
        <p>
            Kindly schedule your interview. If you encounter any issues or have any questions, please do not hesitate to reply to this email.
        </p>
        <p>Thank you for your interest in joining our team. We look forward to speaking with you soon.</p>
        <br />
        <p>Sincerely,</p>
        <p>
            <strong>HR Team</strong><br />
            MyCompany
        </p>
    </div>
);
