import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon
          src={require('@/assets/images/tabIcons/home.png')}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <Label>Jobs</Label>
        <Icon
          src={require('@/assets/images/tabIcons/explore.png')}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="earnings">
        <Label>Earnings</Label>
        <Icon
          src={require('@/assets/images/tabIcons/explore.png')}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="help">
        <Label>Help</Label>
        <Icon
          src={require('@/assets/images/tabIcons/explore.png')}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon
          src={require('@/assets/images/tabIcons/explore.png')}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
