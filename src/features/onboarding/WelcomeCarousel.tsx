import React, { useRef, useState } from 'react';
import { FlatList, ImageBackground, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../../design/components/Screen';
import { Button } from '../../design/components/Button';
import { colors, spacing, type } from '../../design/tokens';

interface Slide {
  title: string;
  body: string;
  background: number; // require()'d image module id
}

const SLIDES: Slide[] = [
  {
    title: "Guess history's greatest battles",
    body: 'Famous and forgotten — across 5,000 years.',
    background: require('../../../assets/onboarding/slide-1.webp'),
  },
  {
    title: 'One clue. One guess.',
    body: 'Up to 10 points per battle.',
    background: require('../../../assets/onboarding/slide-2.webp'),
  },
  {
    title: 'Need help? Use a clue.',
    body: 'Each one costs 2 points.',
    background: require('../../../assets/onboarding/slide-3.webp'),
  },
  {
    title: 'Climb through the ages.',
    body: 'From antiquity to the modern era.',
    background: require('../../../assets/onboarding/slide-4.webp'),
  },
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
          <ImageBackground
            source={item.background}
            style={[styles.slide, { width }]}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(14,27,44,0.1)', 'rgba(14,27,44,0.55)', 'rgba(14,27,44,0.95)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.textBlock}>
              <Text style={[type.display, styles.title]}>{item.title}</Text>
              <Text style={[type.body, styles.body]}>{item.body}</Text>
            </View>
          </ImageBackground>
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
  slide: { flex: 1, justifyContent: 'flex-end' },
  textBlock: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { color: colors.parchment, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 4 },
  body:  { color: colors.parchment, textAlign: 'center', opacity: 0.92 },
  dots:  { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: spacing.md },
  dot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.inkSoft },
  dotActive: { backgroundColor: colors.bronze, width: 24 },
});
