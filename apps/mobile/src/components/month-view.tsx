import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Note } from '@/types';

type Props = {
  cursor: Date;
  notes: Note[];
  onDrill: (d: Date) => void;
  unlocked?: boolean;
};

const DOW = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function CountDots({ count, color, emptyColor }: { count: number; color: string; emptyColor: string }) {
  const visibleDots = Math.min(Math.max(count, 3), 5);
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: visibleDots }, (_, i) => (
        <View
          key={i}
          style={[
            styles.countDot,
            { backgroundColor: i < count ? color : emptyColor },
          ]}
        />
      ))}
    </View>
  );
}

export function MonthView({ cursor, notes, onDrill, unlocked }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const now = new Date();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={[styles.rail, { borderLeftColor: colors.border }]}>
        {Array.from({ length: daysInMonth }, (_, k) => {
          const d = k + 1;
          const dt = new Date(y, m, d);
          const list = notes
            .filter((n) => sameDay(new Date(n.createdAt), dt))
            .sort((a, b) => a.createdAt - b.createdAt);
          const isToday = sameDay(dt, now);

          return (
            <TouchableOpacity
              key={d}
              activeOpacity={0.7}
              onPress={() => onDrill(dt)}
              style={[
                styles.dayRow,
                isToday && { backgroundColor: colors.backgroundElement },
              ]}
            >
              <View style={styles.dayLabelBox}>
                <Text style={[styles.dayNumber, { color: colors.text }]}>{d}</Text>
                <Text style={[styles.dow, { color: colors.textSecondary }]}>
                  {DOW[dt.getDay()]}
                </Text>
              </View>

              <View
                style={[
                  styles.dot,
                  {
                    borderColor: colors.border,
                    backgroundColor:
                      list.length || isToday ? colors.primary : colors.backgroundElement,
                  },
                ]}
              />

              <View style={styles.contentBox}>
                <View style={styles.summaryLeft}>
                  <Text
                    numberOfLines={1}
                    style={[styles.previewText, { color: colors.textSecondary }]}
                  >
                    {list.length
                      ? list[0]?.important && !unlocked
                        ? '🔒 Locked note'
                        : list[0]?.body.trim()
                          ? list[0]?.body
                          : 'photo'
                      : '—'}
                  </Text>
                  <CountDots
                    count={list.length}
                    color={colors.primary}
                    emptyColor={colors.border}
                  />
                </View>

                {list.length > 0 && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.backgroundElement },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                      {list.length} {list.length === 1 ? 'note' : 'notes'}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingLeft: 48,
    paddingRight: Spacing.three,
    paddingBottom: 100,
  },
  rail: {
    borderLeftWidth: 1,
  },
  dayRow: {
    minHeight: 52,
    paddingLeft: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 8,
    position: 'relative',
    justifyContent: 'center',
    marginVertical: 1,
  },
  dayLabelBox: {
    position: 'absolute',
    left: -48,
    top: 6,
    width: 40,
    alignItems: 'flex-end',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  dow: {
    fontSize: 10,
    fontWeight: '600',
  },
  dot: {
    position: 'absolute',
    left: -6,
    top: 14,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  contentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  summaryLeft: {
    flex: 1,
  },
  previewText: {
    fontSize: 13,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
  },
  countDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
