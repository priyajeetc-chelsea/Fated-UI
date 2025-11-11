import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepNames: string[];
}

export default function ProgressIndicator({ currentStep, totalSteps, stepNames }: ProgressIndicatorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.stepText}>
        Step {currentStep} of {totalSteps}: {stepNames[currentStep - 1]}
      </Text>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${(currentStep / totalSteps) * 100}%` }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 2,
  },
});