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

type SignUpFlowProps = {
  onComplete: () => void;
};

export function SignUpFlow({ onComplete }: SignUpFlowProps) {
  const [step, setStep] = useState(0);
  const [showLogin, setShowLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  if (showForgot) {
    return <ForgotPassword onBack={() => setShowForgot(false)} onDone={() => setShowForgot(false)} />;
  }

  if (showLogin) {
    return (
      <Login
        onLogin={onComplete}
        onSignUp={() => setShowLogin(false)}
        onForgotPassword={() => setShowForgot(true)}
      />
    );
  }

  if (step === 0) {
    return <SignUp onContinue={next} onLogIn={() => setShowLogin(true)} />;
  }

  if (step === 1) {
    return <UploadDocuments onContinue={next} onBack={back} />;
  }

  if (step === 2) {
    return <VehicleDetails onContinue={next} onBack={back} />;
  }

  if (step === 3) {
    return <PayoutDetails onContinue={next} onBack={back} />;
  }

  if (step === 4) {
    return <ApplicationSubmitted onContinue={next} onBack={back} />;
  }

  if (step === 5) {
    return <AccountApproved onStart={next} onClose={next} />;
  }

  return <EnablePermissions onContinue={onComplete} onSkip={onComplete} onBack={back} />;
}
