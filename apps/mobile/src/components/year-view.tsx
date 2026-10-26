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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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

export function YearView({ cursor, notes, onDrill, unlocked }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

  const yr = cursor.getFullYear();
  const now = new Date();
  const curM = now.getFullYear() === yr ? now.getMonth() : -1;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={[styles.rail, { borderLeftColor: colors.border }]}>
        {MONTHS.map((nm, i) => {
          const monthNotes = notes
            .filter((n) => {
              const d = new Date(n.createdAt);
              return d.getFullYear() === yr && d.getMonth() === i;
            })
            .sort((a, b) => a.createdAt - b.createdAt);

          const days = new Set(
            monthNotes.map((n) => new Date(n.createdAt).getDate())
          ).size;

          const isNow = i === curM;

          return (
            <TouchableOpacity
              key={nm}
              activeOpacity={0.7}
              onPress={() => onDrill(new Date(yr, i, 1))}
              style={[
                styles.monthRow,
                isNow && { backgroundColor: colors.backgroundElement },
              ]}
            >
              <View style={styles.monthLabelBox}>
                <Text style={[styles.monthName, { color: colors.text }]}>{nm}</Text>
                <Text style={[styles.yearShort, { color: colors.textSecondary }]}>
                  {String(yr).slice(2)}
                </Text>
              </View>

              <View
                style={[
                  styles.dot,
                  {
                    borderColor: colors.border,
                    backgroundColor:
                      monthNotes.length || isNow
                        ? colors.primary
                        : colors.backgroundElement,
                  },
                ]}
              />

              <View style={styles.contentBox}>
                <View style={styles.summaryLeft}>
                  <Text
                    numberOfLines={1}
                    style={[styles.previewText, { color: colors.textSecondary }]}
                  >
                    {monthNotes.length
                      ? monthNotes[0]?.important && !unlocked
                        ? '🔒 Locked note'
                        : monthNotes[0]?.body.trim()
                          ? monthNotes[0]?.body
                          : 'photo'
                      : '—'}
                  </Text>
                  <CountDots
                    count={monthNotes.length}
                    color={colors.primary}
                    emptyColor={colors.border}
                  />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {monthNotes.length
                      ? `${days} ${days === 1 ? 'day' : 'days'} · ${monthNotes.length} ${monthNotes.length === 1 ? 'note' : 'notes'}`
                      : 'empty'}
                  </Text>
                </View>

                {monthNotes.length > 0 && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.backgroundElement },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                      {monthNotes.length} {monthNotes.length === 1 ? 'note' : 'notes'}
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
  monthRow: {
    minHeight: 56,
    paddingLeft: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    position: 'relative',
    justifyContent: 'center',
    marginVertical: 1,
  },
  monthLabelBox: {
    position: 'absolute',
    left: -48,
    top: 10,
    width: 40,
    alignItems: 'flex-end',
  },
  monthName: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  yearShort: {
    fontSize: 10,
    fontWeight: '600',
  },
  dot: {
    position: 'absolute',
    left: -6,
    top: 18,
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
  metaText: {
    fontSize: 11,
    marginTop: 2,
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
