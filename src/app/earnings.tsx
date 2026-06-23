import { Earnings } from '@/components/earnings';
import { OfflineGuard } from '@/components/offline-guard';

export default function EarningsScreen() {
  return (
    <OfflineGuard>
      <Earnings />
    </OfflineGuard>
  );
}
