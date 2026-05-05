import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../tokens';
import { useColors } from '../useColors';
import { haptics } from '../../services/haptics';

type Props = Omit<TextInputProps, 'secureTextEntry'>;

export const PasswordInput = forwardRef<TextInput, Props>(function PasswordInput(props, ref) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const toggle = () => {
    haptics.selection();
    setVisible(v => !v);
  };

  return (
    <View style={styles.wrap}>
      <TextInput
        ref={ref}
        {...props}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          styles.input,
          {
            backgroundColor: colors.inkSoft,
            color: colors.parchment,
            borderColor: colors.bronzeDeep,
          },
          props.style,
        ]}
        placeholderTextColor={props.placeholderTextColor ?? colors.parchmentDim}
      />
      <Pressable
        onPress={toggle}
        hitSlop={12}
        style={styles.eye}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color={colors.parchmentDim}
        />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { position: 'relative', justifyContent: 'center' },
  input: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: 48,
    borderWidth: 1,
    fontSize: 16,
  },
  eye: {
    position: 'absolute',
    right: spacing.md,
    height: 44,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
