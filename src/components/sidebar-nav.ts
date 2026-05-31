import type { Router } from 'expo-router';

/**
 * Maps a sidebar nav label to an app route. Items that live under the Profile
 * tab (Job History, Wallet, Vehicle Details, Reviews) route to /profile.
 */
export function sidebarNavigate(router: Router, label: string) {
  switch (label) {
    case 'Home':
      router.push('/');
      break;
    case 'Help & Support':
      router.push('/help');
      break;
    case 'Job History':
    case 'Wallet':
    case 'Vehicle Details':
    case 'Reviews':
    case 'Logout':
      router.push('/profile');
      break;
    default:
      break;
  }
}
