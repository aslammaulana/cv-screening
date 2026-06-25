import * as React from 'react';

interface RejectionEmailProps {
    candidateName: string;
    jobTitle: string;
}

export const RejectionEmail: React.FC<RejectionEmailProps> = ({
    candidateName,
    jobTitle,
}) => (
    <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333' }}>
        <h2 style={{ color: '#dc2626' }}>Application Update: {jobTitle} at MyCompany</h2>
        <p>Dear {candidateName},</p>
        <p>
            Thank you for taking the time to apply for the <strong>{jobTitle}</strong> position at MyCompany. We sincerely appreciate your interest in joining our team.
        </p>
        <p>
            While your background and experience are impressive, we regret to inform you that we will not be moving forward with your application at this time. We received a large volume of strong applications, and we have decided to proceed with candidates whose qualifications more closely align with the specific needs of this role.
        </p>
        <p>
            We will keep your resume in our database and may reach out to you if a future opening matches your skill set.
        </p>
        <p>
            Thank you again for your time and interest. We wish you the absolute best in your job search and future professional endeavors.
        </p>
        <br />
        <p>Sincerely,</p>
        <p>
            <strong>HR Team</strong><br />
            MyCompany
        </p>
    </div>
);
