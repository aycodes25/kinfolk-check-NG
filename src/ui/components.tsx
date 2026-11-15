import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './theme';

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const t = useTheme();
  const inner = <View style={{ padding: t.space(2.5), gap: t.space(2) }}>{children}</View>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {scroll ? <ScrollView contentContainerStyle={{ flexGrow: 1 }}>{inner}</ScrollView> : inner}
    </SafeAreaView>
  );
}

export const H1 = ({ children }: { children: React.ReactNode }) => {
  const t = useTheme();
  return <Text style={{ color: t.ink, fontSize: 28, fontWeight: '800' }}>{children}</Text>;
};

export const Body = ({ children, style }: { children: React.ReactNode; style?: object }) => {
  const t = useTheme();
  return <Text style={[{ color: t.ink, fontSize: 17, lineHeight: 25 }, style]}>{children}</Text>;
};

export const Muted = ({ children }: { children: React.ReactNode }) => {
  const t = useTheme();
  return <Text style={{ color: t.muted, fontSize: 14, lineHeight: 20 }}>{children}</Text>;
};

type BtnProps = { label: string; onPress: () => void; disabled?: boolean; style?: ViewStyle };

export function PrimaryButton({ label, onPress, disabled, style }: BtnProps) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.btn,
        { backgroundColor: disabled ? t.border : t.accent, borderRadius: t.radius },
        style,
      ]}
    >
      <Text style={{ color: '#2A0F0B', fontSize: 17, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, style }: BtnProps) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.btn, { borderColor: t.primary, borderWidth: 2, borderRadius: t.radius }, style]}
    >
      <Text style={{ color: t.primary, fontSize: 17, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View
      style={[
        { backgroundColor: t.card, borderRadius: t.radius, padding: t.space(2), borderWidth: 1, borderColor: t.border, gap: t.space(1) },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        minWidth: 56,
        alignItems: 'center',
        borderRadius: 999,
        borderWidth: 2,
        borderColor: selected ? t.primary : t.border,
        backgroundColor: selected ? t.primary : t.card,
      }}
    >
      <Text style={{ color: selected ? t.onPrimary : t.ink, fontWeight: '700', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

export function Banner({ tone, children }: { tone: 'warning' | 'danger' | 'success'; children: React.ReactNode }) {
  const t = useTheme();
  const color = t.status[tone];
  return (
    <View style={{ borderLeftWidth: 6, borderLeftColor: color, backgroundColor: t.card, padding: t.space(2), borderRadius: 12, gap: 4 }}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
});
