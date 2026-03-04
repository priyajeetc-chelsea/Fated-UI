import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

interface WaveTextProps {
  text: string;
  style?: any;
}

export function WaveText({ text, style }: WaveTextProps) {
  const letters = text.split("");

  // Phase 1: rotate the first letter 360°
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Phase 2: fade-in for letters after the first
  const revealAnims = useRef(
    letters.slice(1).map(() => new Animated.Value(0)),
  ).current;

  // Phase 2: continuous subtle wave for all letters
  const waveAnims = useRef(letters.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // ── Phase 1: spin "F" once (700ms) ──────────────────────────────────
    const spinOnce = Animated.timing(rotateAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    });

    // ── Phase 2a: staggered fade-in of remaining letters ─────────────────
    const fadeIns = revealAnims.map((anim) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    );
    const staggeredReveal = Animated.stagger(80, fadeIns);

    // ── Phase 2b: continuous small wave on all letters ───────────────────
    const startWave = () => {
      const waveLoops = waveAnims.map((anim) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 350,
              useNativeDriver: true,
            }),
          ]),
        ),
      );
      Animated.stagger(80, waveLoops).start();
    };

    // Run phase 1, then phase 2a + 2b together
    Animated.sequence([spinOnce, staggeredReveal]).start(() => startWave());

    return () => {
      rotateAnim.stopAnimation();
      revealAnims.forEach((a) => a.stopAnimation());
      waveAnims.forEach((a) => a.stopAnimation());
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      {/* First letter — rotates in phase 1, then joins the wave */}
      <Animated.View
        style={{
          transform: [
            { rotate: spin },
            {
              translateY: waveAnims[0].interpolate({
                inputRange: [0, 1],
                outputRange: [0, -6],
              }),
            },
          ],
        }}
      >
        <ThemedText style={[styles.letter, style]}>{letters[0]}</ThemedText>
      </Animated.View>

      {/* Remaining letters — hidden until phase 2, then wave */}
      {letters.slice(1).map((char, i) => (
        <Animated.View
          key={i + 1}
          style={{
            opacity: revealAnims[i],
            transform: [
              {
                translateY: waveAnims[i + 1].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -6],
                }),
              },
            ],
          }}
        >
          <ThemedText style={[styles.letter, style]}>
            {char === " " ? "\u00A0" : char}
          </ThemedText>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  letter: {
    fontSize: 45,
    lineHeight: 50,
    fontFamily: "Playfair Display Bold",
    color: "#4B164C",
  },
});
