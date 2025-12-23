import { PickerOption } from '@/types/onboarding';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Keyboard, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchablePickerProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: PickerOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  allowCustomInput?: boolean;
}

export default function SearchablePicker({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select or type an option',
  error,
  required = false,
  allowCustomInput = true,
}: SearchablePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isCustomInput, setIsCustomInput] = useState(false);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setModalVisible(false);
    setSearchText('');
    setIsCustomInput(false);
  };

  const handleCustomInput = () => {
    setIsCustomInput(true);
    setSearchText(value);
  };

  const handleCustomSave = () => {
    if (searchText.trim()) {
      onValueChange(searchText.trim());
      setModalVisible(false);
      setSearchText('');
      setIsCustomInput(false);
    }
  };

  const getDisplayText = () => {
    if (!value) return placeholder;
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
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
              onPress={() => {
                setModalVisible(false);
                setSearchText('');
                setIsCustomInput(false);
              }}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search or type your own..."
              value={searchText}
              onChangeText={setSearchText}
              autoFocus={isCustomInput}
            />
          </View>

          {isCustomInput ? (
            <View style={styles.customInputContainer}>
              <Text style={styles.customInputLabel}>Custom Entry:</Text>
              <View style={styles.customInputActions}>
                <TouchableOpacity
                  style={styles.cancelCustomButton}
                  onPress={() => {
                    setIsCustomInput(false);
                    setSearchText('');
                  }}
                >
                  <Text style={styles.cancelCustomText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveCustomButton}
                  onPress={handleCustomSave}
                >
                  <Text style={styles.saveCustomText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <ScrollView style={styles.optionsList}>
                {filteredOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.option,
                      value === option.value && styles.selectedOption
                    ]}
                    onPress={() => handleSelect(option.value)}
                  >
                    <Text style={[
                      styles.optionText,
                      value === option.value && styles.selectedOptionText
                    ]}>
                      {option.label}
                    </Text>
                    {value === option.value && (
                      <Ionicons name="checkmark" size={20} color="#000" />
                    )}
                  </TouchableOpacity>
                ))}
                
                {allowCustomInput && searchText.length > 0 && !filteredOptions.some(opt => 
                  opt.label.toLowerCase() === searchText.toLowerCase()
                ) && (
                  <TouchableOpacity
                    style={styles.customOption}
                    onPress={handleCustomInput}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#666" />
                    <Text style={styles.customOptionText}>
                      Add &ldquo;{searchText}&rdquo;
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
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
  customOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#F8F9FA',
  },
  customOptionText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    fontStyle: 'italic',
  },
  customInputContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  customInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  customInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelCustomButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelCustomText: {
    fontSize: 14,
    color: '#666',
  },
  saveCustomButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#000',
  },
  saveCustomText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
});