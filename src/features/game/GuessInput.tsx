import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { Button } from '../../design/components/Button';
import { colors, radii, spacing, type } from '../../design/tokens';

export interface GuessInputHandle {
  shake: () => void;
}

export const GuessInput = forwardRef<GuessInputHandle, {
  pointsAvailable: number;
  onSubmit: (guess: string) => void;
  disabled?: boolean;
}>(function GuessInput({ pointsAvailable, onSubmit, disabled }, ref) {
  const [value, setValue] = useState('');
  const tx = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    shake: () => {
      tx.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    },
  }));

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));

  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <Animated.View style={animStyle}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Name the battle…"
          placeholderTextColor={colors.parchmentDim}
          editable={!disabled}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="send"
          onSubmitEditing={submit}
          style={styles.input}
        />
      </Animated.View>
      <Button label="Submit" onPress={submit} disabled={disabled || !value.trim()} />
      <Text style={[type.caption, styles.points]}>Points available: {pointsAvailable}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.inkSoft,
    color: colors.parchment,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.bronzeDeep,
  },
  points: { color: colors.parchmentDim, textAlign: 'center' },
});
