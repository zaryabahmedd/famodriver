import { useState } from 'react';

import { BankAccount } from '@/components/bank-account';
import { DeleteAccount } from '@/components/delete-account';
import { Documents } from '@/components/documents';
import { EditProfile } from '@/components/edit-profile';
import { JobHistory } from '@/components/job-history';
import { Notifications } from '@/components/notifications';
import { Reviews } from '@/components/reviews';
import { RiderProfile } from '@/components/rider-profile';
import { Settings } from '@/components/settings';
import { Sidebar } from '@/components/sidebar';
import { VehicleInfo } from '@/components/vehicle-info';
import { Wallet } from '@/components/wallet';
import { useAuth } from '@/hooks/use-auth';

type Screen =
  | 'vehicle'
  | 'documents'
  | 'bank'
  | 'settings'
  | 'editProfile'
  | 'notifications'
  | 'reviews'
  | 'wallet'
  | 'history'
  | 'deleteAccount';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<Screen | null>(null);

  const close = () => setActive(null);

  const handleMenuSelect = (label: string) => {
    if (label === 'Vehicle') setActive('vehicle');
    else if (label === 'Documents') setActive('documents');
    else if (label === 'Bank account') setActive('bank');
    else if (label === 'Notifications') setActive('settings');
    else if (label === 'Language') setActive('settings');
    else if (label === 'Help & support') setActive('settings');
  };

  const handleSidebarNavigate = (label: string) => {
    if (label === 'Reviews') setActive('reviews');
    else if (label === 'Wallet') setActive('wallet');
    else if (label === 'Job History') setActive('history');
    else if (label === 'Vehicle Details') setActive('vehicle');
  };

  return (
    <>
      <RiderProfile
        onMenu={() => setMenuOpen(true)}
        onSelect={handleMenuSelect}
        onEditProfile={() => setActive('editProfile')}
        onNotifications={() => setActive('notifications')}
        onLogout={() => setActive('settings')}
        onDeleteAccount={() => setActive('deleteAccount')}
      />

      {active === 'vehicle' && <VehicleInfo onBack={close} />}
      {active === 'documents' && <Documents onBack={close} />}
      {active === 'bank' && <BankAccount onBack={close} />}
      {active === 'settings' && <Settings onBack={close} onLogout={logout} />}
      {active === 'editProfile' && <EditProfile onBack={close} onSave={close} />}
      {active === 'notifications' && <Notifications onBack={close} />}
      {active === 'reviews' && <Reviews onBack={close} />}
      {active === 'wallet' && <Wallet onBack={close} />}
      {active === 'history' && <JobHistory onBack={close} />}
      {active === 'deleteAccount' && <DeleteAccount onBack={close} onDeleted={logout} />}

      {menuOpen && (
        <Sidebar onClose={() => setMenuOpen(false)} onNavigate={handleSidebarNavigate} />
      )}
    </>
  );
}
