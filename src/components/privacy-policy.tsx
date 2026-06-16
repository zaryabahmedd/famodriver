import { MaterialIcons } from '@expo/vector-icons';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  surface: '#fbf9f9',
  surfaceLowest: '#ffffff',
  onSurface: '#1b1c1c',
  onSurfaceVariant: '#4d4632',
  outline: '#7f775f',
  outlineVariant: '#d0c6ab',
  primary: '#715d00',
  primaryContainer: '#fbd103',
};

type Props = {
  onBack?: () => void;
};

export function PrivacyPolicy({ onBack }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <Text style={styles.appBarTitle}>Privacy Policy</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>Fast Motion Logistics Ltd</Text>
        <Text style={styles.subtitle}>Privacy Policy</Text>
        <Text style={styles.meta}>
          Fast Motion Rider and User App privacy policy for riders, drivers, dispatch partners, customers, delivery partners, and visitors.
        </Text>
        <Text style={styles.effectiveDate}>Effective Date: January 1st, 2026</Text>

        <Section title="1. Introduction">
          <Para>Fast Motion Rider and User App ("Fast Motion", "we", "our", or "us") is operated by Fast Motion Logistics Ltd and is committed to protecting your privacy and personal data.</Para>
          <Para>This Privacy Policy explains how we collect, use, disclose, store, and safeguard your information when you access or use our mobile applications, website, and related services (collectively, the "Platform").</Para>
          <Para>This Privacy Policy applies to all users of the Platform, including riders, drivers, dispatch riders, customers, delivery partners, and visitors.</Para>
          <Para>This policy is designed to comply with:</Para>
          <BulletList items={[
            'Nigeria Data Protection Regulation (NDPR)',
            'Google Play User Data Policy',
            'Applicable privacy and consumer protection laws',
          ]} />
          <Para>By using Fast Motion Rider App, you agree to the collection and use of information in accordance with this Privacy Policy.</Para>
        </Section>

        <Section title="2. Information We Collect">
          <SubHeading>2.1 Personal Information</SubHeading>
          <Para>We may collect the following personal information:</Para>
          <BulletList items={[
            'Full name',
            'Phone number',
            'Email address',
            'Residential address',
            'Profile photograph',
            'Date of birth',
            'Government-issued identification',
            'Login credentials',
            'Bank account details',
            'Payment information',
            'Emergency contact information (optional)',
          ]} />

          <SubHeading>2.2 Rider, Driver & Delivery Partner Information</SubHeading>
          <Para>If you register as a rider, driver, or delivery partner, we may additionally collect:</Para>
          <BulletList items={[
            "Driver's license details",
            'Vehicle information',
            'Vehicle registration documents',
            'Insurance information',
            'Rider verification documents',
            'Trip history',
            'Ratings and reviews',
            'Real-time GPS location data',
          ]} />

          <SubHeading>2.3 Customer Information</SubHeading>
          <Para>If you use the Platform as a passenger or customer, we may collect:</Para>
          <BulletList items={[
            'Pickup and destination addresses',
            'Ride requests and booking history',
            'Delivery information',
            'Communication records with riders/drivers',
            'Ratings and feedback',
            'Transaction and payment history',
          ]} />

          <SubHeading>2.4 Automatically Collected Information</SubHeading>
          <Para>When you use the Platform, we may automatically collect:</Para>
          <BulletList items={[
            'IP address',
            'Device identifiers',
            'Device type and operating system',
            'Browser type',
            'Mobile network information',
            'App version',
            'Usage statistics and activity logs',
            'Crash reports and diagnostics',
            'Cookies and similar technologies',
          ]} />
        </Section>

        <Section title="3. Location Information">
          <Para>Fast Motion Rider App collects and processes both Approximate Location Data and Precise Location Data from users' devices in accordance with Google Play policies.</Para>

          <SubHeading>3.1 Precise Location Data</SubHeading>
          <Para>We collect precise GPS location data from your device when the app is in use and, where permitted, when the app is running in the background during active rides or deliveries.</Para>
          <Para>Precise location data is used to:</Para>
          <BulletList items={[
            'Match customers with nearby riders or drivers',
            'Enable real-time ride and delivery tracking',
            'Provide navigation and route optimization',
            'Calculate fares and delivery estimates',
            'Improve pickup accuracy',
            'Enhance user safety and fraud prevention',
            'Provide emergency support services',
          ]} />

          <SubHeading>3.2 Approximate Location Data</SubHeading>
          <Para>We may collect approximate location information based on IP address, Wi-Fi, or network signals to:</Para>
          <BulletList items={[
            'Show nearby riders or services',
            'Improve regional app functionality',
            'Detect suspicious account activity',
            'Improve user experience and service availability',
          ]} />

          <SubHeading>3.3 Background Location Access</SubHeading>
          <Para>Fast Motion Rider App may access location data while the app is running in the background during active rides, deliveries, or navigation sessions.</Para>
          <Para>Background location access helps ensure:</Para>
          <BulletList items={[
            'Continuous trip tracking',
            'Accurate navigation',
            'Rider and customer safety',
            'Route monitoring and fraud prevention',
          ]} />
          <Para>Background location access is only used where necessary for core app functionality.</Para>

          <SubHeading>3.4 Sharing of Location Data</SubHeading>
          <Para>We may share location information with:</Para>
          <BulletList items={[
            'Riders, drivers, and customers involved in a ride or delivery',
            'Mapping and navigation providers',
            'Cloud hosting and analytics providers such as Firebase',
            'Payment and fraud prevention partners',
            'Law enforcement or regulatory authorities where legally required',
          ]} />
          <Para>We do not sell users' location data to third parties.</Para>

          <SubHeading>3.5 User Control of Location Permissions</SubHeading>
          <Para>You can enable, disable, or manage location permissions at any time through your device settings.</Para>
          <Para>Please note that disabling location permissions may limit certain features of the Platform, including ride booking, navigation, and real-time tracking.</Para>
        </Section>

        <Section title="4. How We Use Your Information">
          <Para>We use your information to:</Para>
          <BulletList items={[
            'Provide transportation and delivery services',
            'Match riders with customers',
            'Process bookings and payments',
            'Verify user identities',
            'Improve app functionality and performance',
            'Personalize user experience',
            'Detect fraud, abuse, or security threats',
            'Provide customer support',
            'Send service-related notifications',
            'Comply with legal obligations',
          ]} />
          <Para>We only collect information that is necessary for providing and improving our services.</Para>
        </Section>

        <Section title="5. Data Sharing & Disclosure">
          <Para>We may share your information with:</Para>
          <BulletList items={[
            'Riders, drivers, dispatch partners, and customers as necessary to complete services',
            'Payment processors and financial institutions',
            'Identity verification providers',
            'Cloud storage and analytics providers',
            'Customer support service providers',
            'Regulatory agencies and law enforcement authorities when required by law',
          ]} />
          <Para>We do not sell personal information to advertisers or third parties.</Para>
        </Section>

        <Section title="6. Data Retention">
          <Para>We retain personal information only for as long as necessary to:</Para>
          <BulletList items={[
            'Provide our services',
            'Maintain ride and transaction records',
            'Resolve disputes',
            'Prevent fraud and abuse',
            'Comply with legal obligations',
          ]} />
          <Para>Users may request deletion of their accounts and personal information, subject to applicable legal requirements.</Para>
        </Section>

        <Section title="7. Data Security">
          <Para>We use administrative, technical, and physical safeguards to protect personal information against unauthorized access, misuse, disclosure, or destruction.</Para>
          <Para>Despite our efforts, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.</Para>
        </Section>

        <Section title="8. Cookies & Tracking Technologies">
          <Para>We use cookies, SDKs, and similar technologies to:</Para>
          <BulletList items={[
            'Maintain app functionality',
            'Improve analytics and performance',
            'Remember user preferences',
            'Enhance security and fraud prevention',
          ]} />
          <Para>Third-party tools such as Firebase may also use cookies or tracking technologies in accordance with their own privacy policies.</Para>
        </Section>

        <Section title="9. User Rights">
          <Para>Under applicable data protection laws, users may have the right to:</Para>
          <BulletList items={[
            'Access personal information',
            'Correct inaccurate data',
            'Withdraw consent',
            'Request deletion of personal information',
            'Object to certain processing activities',
            'Request data portability',
          ]} />
          <Para>Requests may be submitted through the contact information below.</Para>
        </Section>

        <Section title="10. Children's Privacy">
          <Para>Fast Motion Rider App is not directed toward children under the age of 18.</Para>
          <Para>We do not knowingly collect personal information from minors.</Para>
        </Section>

        <Section title="11. Third-Party Services">
          <Para>The Platform may contain links or integrations with third-party services such as:</Para>
          <BulletList items={[
            'Payment gateways',
            'Mapping and navigation services',
            'Firebase and analytics providers',
          ]} />
          <Para>We are not responsible for the privacy practices of third-party services.</Para>
        </Section>

        <Section title="12. International Data Transfers">
          <Para>Your information may be stored or processed outside Nigeria where necessary for platform operations.</Para>
          <Para>Where international transfers occur, we implement appropriate safeguards to protect personal data.</Para>
        </Section>

        <Section title="13. Changes to This Privacy Policy">
          <Para>We may update this Privacy Policy from time to time.</Para>
          <Para>Any changes will be posted on this page with an updated effective date.</Para>
          <Para>Continued use of the Platform after changes become effective constitutes acceptance of the revised Privacy Policy.</Para>
        </Section>

        <Section title="14. Contact Information">
          <Para>If you have questions, concerns, or privacy-related requests, contact us at:</Para>
          <BulletList items={[
            'Email: privacy@fastmotionlogisticsltd.com',
            'Support: support@fastmotionlogisticsltd.com',
            'Website: Fast Motion Logistics Ltd',
          ]} />
          <Para>By using Fast Motion Rider App, you acknowledge that you have read, understood, and agreed to this Privacy Policy.</Para>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SubHeading({ children }: { children: string }) {
  return <Text style={styles.subHeading}>{children}</Text>;
}

function Para({ children }: { children: React.ReactNode }) {
  return <Text style={styles.para}>{children}</Text>;
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.list}>
      {items.map((item, i) => (
        <View key={i} style={styles.listRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    ...(Platform.OS === 'web' ? ({ position: 'fixed' } as object) : null),
    backgroundColor: COLORS.surface,
    zIndex: 1800,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  appBarTitle: { fontSize: 18, fontWeight: '700', color: COLORS.onSurface },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 4,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.onSurface, textAlign: 'center' },
  subtitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, textAlign: 'center', marginTop: 2 },
  meta: { fontSize: 13, color: COLORS.onSurfaceVariant, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  effectiveDate: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.outline,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  section: { marginTop: 20, gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface, marginBottom: 4 },
  subHeading: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: 10, marginBottom: 2 },
  para: { fontSize: 14, color: COLORS.onSurfaceVariant, lineHeight: 22 },
  list: { gap: 4, paddingLeft: 4 },
  listRow: { flexDirection: 'row', gap: 8 },
  bullet: { fontSize: 14, color: COLORS.outline, lineHeight: 22 },
  listText: { flex: 1, fontSize: 14, color: COLORS.onSurfaceVariant, lineHeight: 22 },
});
