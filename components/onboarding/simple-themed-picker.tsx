import { IntPickerOption, PickerOption } from '@/types/onboarding';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Keyboard, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SimpleThemedPickerProps {
  label: string;
  value: string | number;
  onValueChange: (value: string | number) => void;
  options: PickerOption[] | IntPickerOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export default function SimpleThemedPicker({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  error,
  required = false,
}: SimpleThemedPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (optionValue: string | number) => {
    // Preserve the numeric type if it's a number
    onValueChange(optionValue);
    setModalVisible(false);
  };

  const getDisplayText = () => {
    const selectedOption = options.find(option => option.value === value || String(option.value) === String(value));
    return selectedOption ? selectedOption.label : placeholder;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      
      <TouchableOpacity
        style={[styles.picker, error && styles.pickerError]}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Keyboard.dismiss(); // Dismiss any open keyboard before showing picker
          }
          setModalVisible(true);
        }}
      >
        <Text style={[
          styles.pickerText,
          !value ? styles.placeholderText : null
        ]}>
          {getDisplayText()}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.optionsList}>
            {options.map((option) => (
              <TouchableOpacity
                key={String(option.value)}
                style={[
                  styles.option,
                  (option.value === value || String(option.value) === String(value)) && styles.selectedOption
                ]}
                onPress={() => handleSelect(option.value)}
              >
                <Text style={[
                  styles.optionText,
                  (option.value === value || String(option.value) === String(value)) && styles.selectedOptionText
                ]}>
                  {option.label}
                </Text>
                {(option.value === value || String(option.value) === String(value)) && (
                  <Ionicons name="checkmark" size={20} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  required: {
    color: '#FF4444',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  pickerError: {
    borderColor: '#FF4444',
    borderWidth: 2,
  },
  pickerText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedOption: {
    backgroundColor: '#f9f9f9',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '600',
  },
});