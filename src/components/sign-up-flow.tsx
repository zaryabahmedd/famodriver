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
import { VerifyEmailCode } from '@/components/verify-email-code';
import { callBackend } from '@/hooks/backend-client';
import { setRiderSession, setStoredRiderId } from '@/hooks/rider-session';
import { supabase } from '@/hooks/supabase-client';

type SignUpFlowProps = {
  onComplete: () => void;
};

export function SignUpFlow({ onComplete }: SignUpFlowProps) {
  const [step, setStep] = useState(0);
  const [showLogin, setShowLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);

  // Track Rider Database Details
  const [riderId, setRiderId] = useState('');
  const [email, setEmail] = useState('');
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
      const normalizedEmail = values.email.trim().toLowerCase();
      setRiderId(newId);
      setStoredRiderId(newId);
      setEmail(normalizedEmail);

      // Signup only returns the rider id — it does NOT issue a session token.
      // Log in immediately with the same credentials so we hold a valid token
      // for the authenticated onboarding steps (document upload, vehicle,
      // payout). Without this, those calls fail with `no_session`.
      const { data: loginData, error: loginErr } = await callBackend('rider-auth', {
        action: 'login',
        email: normalizedEmail,
        password: values.password,
      });
      if (loginErr || !loginData?.ok || !loginData?.token) {
        alert('Account created, but we could not start your session. Please log in to continue.');
        showLoginScreen();
        return;
      }
      await setRiderSession({
        token: loginData.token as string,
        riderId: (loginData.rider_id as string) ?? newId,
        expiresAt: loginData.expires_at as string,
      });

      // Email the rider a 6-digit verification code via Supabase Auth before
      // they can continue to document upload.
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: true },
      });
      if (otpErr) {
        alert('Account created, but we could not send the verification code. Please try logging in.');
        return;
      }
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
    return <VerifyEmailCode email={email} onVerified={next} onBack={back} />;
  }

  if (step === 2) {
    return <UploadDocuments riderId={riderId} onContinue={next} onBack={back} />;
  }

  if (step === 3) {
    return <VehicleDetails riderId={riderId} onContinue={next} onBack={back} />;
  }

  if (step === 4) {
    return <PayoutDetails riderId={riderId} onContinue={next} onBack={back} />;
  }

  if (step === 5) {
    return <ApplicationSubmitted onContinue={next} onBack={back} />;
  }

  if (step === 6) {
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
