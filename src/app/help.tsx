import { Help } from '@/components/help';
import { OfflineGuard } from '@/components/offline-guard';

export default function HelpScreen() {
  return (
    <OfflineGuard>
      <Help />
    </OfflineGuard>
  );
}
