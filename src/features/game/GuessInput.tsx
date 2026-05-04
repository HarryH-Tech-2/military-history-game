import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../design/components/Button';
import { colors, radii, spacing, type } from '../../design/tokens';

export function GuessInput({
  pointsAvailable, onSubmit, disabled,
}: {
  pointsAvailable: number;
  onSubmit: (guess: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');

  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <View style={{ gap: spacing.sm }}>
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
      <Button label="Submit" onPress={submit} disabled={disabled || !value.trim()} />
      <Text style={[type.caption, styles.points]}>Points available: {pointsAvailable}</Text>
    </View>
  );
}

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
