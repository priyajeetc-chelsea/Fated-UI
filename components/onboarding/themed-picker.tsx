import { IntPickerOption, PickerOption } from '@/types/onboarding';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Keyboard, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ThemedPickerProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: PickerOption[]|IntPickerOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  multiple?: boolean;
  selectedValues?: (string | number)[];
  onMultiValueChange?: (values: (string | number)[]) => void;
  maxSelections?: number;
}

export default function ThemedPicker({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  error,
  required = false,
  multiple = false,
  selectedValues = [],
  onMultiValueChange,
  maxSelections,
}: ThemedPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSingleSelect = (optionValue: string | number) => {
    onValueChange(String(optionValue));
    setModalVisible(false);
  };

  const handleMultiSelect = (optionValue: string | number) => {
    if (!onMultiValueChange) return;
    
    // Preserve the type - don't convert to string
    const isSelected = selectedValues.some(v => v === optionValue || String(v) === String(optionValue));
    const newValues = isSelected
      ? selectedValues.filter(v => v !== optionValue && String(v) !== String(optionValue))
      : maxSelections && selectedValues.length >= maxSelections
      ? selectedValues // Don't add if at max limit
      : [...selectedValues, optionValue];
    
    onMultiValueChange(newValues);
  };

  const getDisplayText = () => {
    if (multiple) {
      if (selectedValues.length === 0) return placeholder;
      if (selectedValues.length === 1) {
        const option = options.find(opt => opt.value === selectedValues[0] || String(opt.value) === String(selectedValues[0]));
        return option?.label || String(selectedValues[0]);
      }
      return `${selectedValues.length} selected`;
    } else {
      if (!value) return placeholder;
      const option = options.find(opt => String(opt.value) === value);
      return option?.label || value;
    }
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
          (!value && !multiple) || (multiple && selectedValues.length === 0) ? styles.placeholderText : null
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
              onPress={() => {
                setModalVisible(false);
              }}
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
                  multiple 
                    ? (selectedValues.some(v => v === option.value || String(v) === String(option.value)) && styles.selectedOption)
                    : (value === String(option.value) && styles.selectedOption)
                ]}
                onPress={() => multiple ? handleMultiSelect(option.value) : handleSingleSelect(option.value)}
              >
                <Text style={[
                  styles.optionText,
                  multiple
                    ? (selectedValues.some(v => v === option.value || String(v) === String(option.value)) && styles.selectedOptionText)
                    : (value === String(option.value) && styles.selectedOptionText)
                ]}>
                  {option.label}
                </Text>
                {multiple && selectedValues.some(v => v === option.value || String(v) === String(option.value)) && (
                  <Ionicons name="checkmark" size={20} color="#000" />
                )}
                {!multiple && value === String(option.value) && (
                  <Ionicons name="checkmark" size={20} color="#000" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          {multiple && (
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
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
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
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
    paddingVertical: 16,
    marginTop: 20,
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
  searchInput: {
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
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
    backgroundColor: '#F5F5F5',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  doneButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});