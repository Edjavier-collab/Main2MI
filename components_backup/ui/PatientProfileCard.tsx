import React from 'react';
import { PatientProfile, StageOfChange, UserTier } from '../../types';
import { SoftCard } from './SoftCard';
import './PatientProfileCard.css';

interface PatientProfileCardProps {
    patient: PatientProfile;
    userTier?: UserTier;
}

interface InfoSectionProps {
    icon: string;
    title: string;
    children: React.ReactNode;
    colorClassName: string;
}

const InfoSection: React.FC<InfoSectionProps> = ({ icon, title, children, colorClassName }) => (
    <div className="patient-profile-card__section">
        <h3 className={`patient-profile-card__section-title ${colorClassName}`}>
            <i className={`fa-solid ${icon} patient-profile-card__section-icon`}></i>
            {title}
        </h3>
        <div className="patient-profile-card__section-content">
            {children}
        </div>
    </div>
);

const stageColors: Record<StageOfChange, string> = {
    [StageOfChange.Precontemplation]: 'patient-profile-card__badge--precontemplation',
    [StageOfChange.Contemplation]: 'patient-profile-card__badge--contemplation',
    [StageOfChange.Preparation]: 'patient-profile-card__badge--preparation',
    [StageOfChange.Action]: 'patient-profile-card__badge--action',
    [StageOfChange.Maintenance]: 'patient-profile-card__badge--maintenance',
};

const PatientProfileCard: React.FC<PatientProfileCardProps> = ({ patient, userTier }) => {
    const isFreeTier = userTier === UserTier.Free;

    const abbreviate = (text: string): string => {
        const sentences = text.split('.');
        if (sentences.length > 1 && sentences[0]) {
            return sentences[0] + '.';
        }
        return text;
    };

    return (
        <SoftCard variant="elevated" className="patient-profile-card">
            <header className="patient-profile-card__header">
                <div className="patient-profile-card__header-info">
                    <h2 className="patient-profile-card__name">{patient.name}</h2>
                    <p className="patient-profile-card__demographics">{patient.age}, {patient.sex}</p>
                </div>
                <div className={`patient-profile-card__badge ${stageColors[patient.stageOfChange]}`}>
                    {patient.stageOfChange}
                </div>
            </header>

            <main className="patient-profile-card__main">
                {!isFreeTier && (
                    <InfoSection icon="fa-user" title="Background" colorClassName="patient-profile-card__title--primary">
                        <p>{patient.background}</p>
                    </InfoSection>
                )}

                {!isFreeTier && (
                    <InfoSection icon="fa-clipboard-question" title="Presenting Problem" colorClassName="patient-profile-card__title--accent">
                        <p>{patient.presentingProblem}</p>
                    </InfoSection>
                )}

                <InfoSection icon="fa-file-waveform" title="Relevant History" colorClassName="patient-profile-card__title--secondary">
                    <p>{isFreeTier ? abbreviate(patient.history) : patient.history}</p>
                </InfoSection>

                <div className="patient-profile-card__section">
                    <h3 className="patient-profile-card__section-title patient-profile-card__title--quote">
                        <i className="fa-solid fa-quote-left patient-profile-card__section-icon"></i>
                        Chief Complaint
                    </h3>
                    <blockquote className="patient-profile-card__quote">
                        <p className="patient-profile-card__quote-text">"{patient.chiefComplaint}"</p>
                    </blockquote>
                </div>
            </main>

            {isFreeTier && (
                <footer className="patient-profile-card__footer">
                    <i className="fa-solid fa-lock patient-profile-card__lock-icon"></i>
                    <p className="patient-profile-card__footer-text">
                        Upgrade to Premium to view the patient's complete profile.
                    </p>
                </footer>
            )}
        </SoftCard>
    );
};

export default PatientProfileCard;
