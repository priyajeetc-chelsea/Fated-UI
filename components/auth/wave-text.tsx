import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ThemedText } from '../themed-text';

interface WaveTextProps {
  text: string;
  style?: any;
}

export function WaveText({ text, style }: WaveTextProps) {
  const animatedValues = useRef(
    text.split('').map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = animatedValues.map((animatedValue, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 50), // Stagger the animation
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.stagger(30, animations).start();

    return () => {
      animatedValues.forEach(value => value.stopAnimation());
    };
  }, [animatedValues]);

  return (
    <View style={styles.container}>
      {text.split('').map((char, index) => (
        <Animated.View
          key={index}
          style={[
            {
              transform: [
                {
                  translateY: animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10],
                  }),
                },
              ],
              opacity: animatedValues[index].interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.6, 1, 0.6],
              }),
            },
          ]}
        >
          <ThemedText style={[styles.letter, style]}>
            {char === ' ' ? '\u00A0' : char}
          </ThemedText>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    fontSize: 45,
    lineHeight: 50,
    fontFamily: 'Playfair Display',
    fontWeight: '600',
    color: '#004242',
  },
});