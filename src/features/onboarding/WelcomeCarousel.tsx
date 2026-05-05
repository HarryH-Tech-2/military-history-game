import React, { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Screen } from '../../design/components/Screen';
import { Button } from '../../design/components/Button';
import { colors, spacing, type } from '../../design/tokens';

const SLIDES = [
  { title: "Guess history's greatest battles", body: 'Famous and forgotten — across 5,000 years.' },
  { title: 'One clue. One guess.',              body: 'Up to 10 points per battle.' },
  { title: 'Need help? Use a clue.',            body: 'Each one costs 2 points.' },
  { title: 'Climb through the ages.',           body: 'From antiquity to the modern era.' },
];

export function WelcomeCarousel({ onDone }: { onDone: () => void }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);

  const advance = () => {
    if (index === SLIDES.length - 1) onDone();
    else {
      const next = index + 1;
      ref.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    }
  };

  return (
    <Screen padded={false}>
      <FlatList
        ref={ref}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={[type.display, styles.title]}>{item.title}</Text>
            <Text style={[type.body, styles.body]}>{item.body}</Text>
          </View>
        )}
      />
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
        <Button label={index === SLIDES.length - 1 ? 'Get started' : 'Next'} onPress={advance} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  slide: { flex: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.md },
  title: { color: colors.parchment, textAlign: 'center' },
  body:  { color: colors.parchmentDim, textAlign: 'center' },
  dots:  { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: spacing.md },
  dot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.inkSoft },
  dotActive: { backgroundColor: colors.bronze, width: 24 },
});
