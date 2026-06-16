import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { DeleteAccount } from '@/components/delete-account';
import { Documents } from '@/components/documents';
import { EditProfile } from '@/components/edit-profile';
import { Notifications } from '@/components/notifications';
import { Reviews } from '@/components/reviews';
import { RiderProfile } from '@/components/rider-profile';
import { Settings } from '@/components/settings';
import { Sidebar } from '@/components/sidebar';
import { VehicleInfo } from '@/components/vehicle-info';
import { useAuth } from '@/hooks/use-auth';
import { useBackHandler } from '@/hooks/use-back-handler';

type Screen =
  | 'vehicle'
  | 'documents'
  | 'settings'
  | 'editProfile'
  | 'notifications'
  | 'reviews'
  | 'deleteAccount';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<Screen | null>(null);
  const [profileVersion, setProfileVersion] = useState(0);

  const close = () => setActive(null);

  // Reset to the root profile screen whenever this tab loses focus, so
  // switching tabs and coming back never lands on a stale sub-screen
  // (Bike, Documents, Settings, etc.).
  useFocusEffect(
    useCallback(() => {
      return () => {
        setActive(null);
        setMenuOpen(false);
      };
    }, []),
  );

  // Android back: close the open sub-screen, then the menu, then fall back to Home.
  useBackHandler(() => {
    if (active) {
      setActive(null);
      return true;
    }
    if (menuOpen) {
      setMenuOpen(false);
      return true;
    }
    router.navigate('/');
    return true;
  });

  const handleMenuSelect = (label: string) => {
    if (label === 'Bike') setActive('vehicle');
    else if (label === 'Documents') setActive('documents');
    else if (label === 'Language') setActive('settings');
    else if (label === 'Help & support') router.push('/help');
  };

  const handleSidebarNavigate = (label: string) => {
    if (label === 'Reviews') setActive('reviews');
    else if (label === 'Job History') router.push('/explore');
    else if (label === 'Bike Details') setActive('vehicle');
  };

  return (
    <>
      <RiderProfile
        key={profileVersion}
        onMenu={() => setMenuOpen(true)}
        onSelect={handleMenuSelect}
        onEditProfile={() => setActive('editProfile')}
        onNotifications={() => setActive('notifications')}
        onLogout={() => setActive('settings')}
        onDeleteAccount={() => setActive('deleteAccount')}
      />

      {active === 'vehicle' && <VehicleInfo onBack={close} />}
      {active === 'documents' && <Documents onBack={close} />}
      {active === 'settings' && <Settings onBack={close} onLogout={logout} />}
      {active === 'editProfile' && (
        <EditProfile
          onBack={close}
          onSave={() => {
            setProfileVersion((v) => v + 1);
            close();
          }}
        />
      )}
      {active === 'notifications' && <Notifications onBack={close} />}
      {active === 'reviews' && <Reviews onBack={close} />}
      {active === 'deleteAccount' && <DeleteAccount onBack={close} onDeleted={logout} />}

      {menuOpen && (
        <Sidebar onClose={() => setMenuOpen(false)} onNavigate={handleSidebarNavigate} />
      )}
    </>
  );
}
