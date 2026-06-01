import { useState } from 'react';

import { AccountApproved } from '@/components/account-approved';
import { ApplicationSubmitted } from '@/components/application-submitted';
import { EnablePermissions } from '@/components/enable-permissions';
import { ForgotPassword } from '@/components/forgot-password';
import { Login } from '@/components/login';
import { PayoutDetails } from '@/components/payout-details';
import { SignUp } from '@/components/sign-up';
import { UploadDocuments } from '@/components/upload-documents';
import { VehicleDetails } from '@/components/vehicle-details';
import { callBackend } from '@/hooks/backend-client';
import { setStoredRiderId } from '@/hooks/rider-session';

type SignUpFlowProps = {
  onComplete: () => void;
};

export function SignUpFlow({ onComplete }: SignUpFlowProps) {
  const [step, setStep] = useState(0);
  const [showLogin, setShowLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);

  // Track Rider Database Details
  const [riderId, setRiderId] = useState('');
  const [loginNote, setLoginNote] = useState<string | null>(null);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));
  const showLoginScreen = () => {
    setStep(0);
    setShowForgot(false);
    setShowLogin(true);
  };

  const handleSignUpSubmit = async (values: { name: string; email: string; phone: string; password: string }) => {
    try {
      // Create the rider via the Node backend. The password is bcrypt-hashed
      // server-side (>=8 chars enforced); the anon key never touches the riders
      // table.
      const { data, error } = await callBackend('rider-auth', {
        action: 'signup',
        full_name: values.name,
        email: values.email.trim().toLowerCase(),
        phone: values.phone,
        password: values.password,
      });

      const reason = (data?.error as string | undefined) ?? error?.message;
      if (error || !data?.ok || !data?.rider_id) {
        if (reason?.includes('email_taken')) {
          alert('An account with this email already exists. Please login instead.');
        } else if (reason?.includes('weak_password')) {
          alert('Password must be at least 8 characters.');
        } else {
          alert('Could not create your account. Please try again.');
        }
        return;
      }

      const newId = data.rider_id as string;
      setRiderId(newId);
      setStoredRiderId(newId);
      // The new backend has no email-OTP step, so go straight to documents.
      next();
    } catch (err: any) {
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleEnablePermissionsComplete = () => {
    setLoginNote('Please login with your credentials');
    showLoginScreen();
  };

  if (showForgot) {
    return <ForgotPassword onBack={() => setShowForgot(false)} onDone={() => setShowForgot(false)} />;
  }

  if (showLogin) {
    return (
      <Login
        note={loginNote}
        onLogin={onComplete}
        onSignUp={() => {
          setLoginNote(null);
          setShowLogin(false);
        }}
        onForgotPassword={() => setShowForgot(true)}
      />
    );
  }

  if (step === 0) {
    return <SignUp onContinue={handleSignUpSubmit} onBack={showLoginScreen} onLogIn={showLoginScreen} />;
  }

  if (step === 1) {
    return <UploadDocuments riderId={riderId} onContinue={next} onBack={back} />;
  }

  if (step === 2) {
    return <VehicleDetails riderId={riderId} onContinue={next} onBack={back} />;
  }

  if (step === 3) {
    return <PayoutDetails riderId={riderId} onContinue={next} onBack={back} />;
  }

  if (step === 4) {
    return <ApplicationSubmitted onContinue={next} onBack={back} />;
  }

  if (step === 5) {
    return <AccountApproved onStart={next} onClose={next} />;
  }

  return (
    <EnablePermissions
      onContinue={handleEnablePermissionsComplete}
      onSkip={handleEnablePermissionsComplete}
      onBack={back}
    />
  );
}
