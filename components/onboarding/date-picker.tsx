import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Keyboard, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface DatePickerProps {
  label: string;
  value: string;
  onDateChange: (date: string) => void;
  error?: string;
  required?: boolean;
}

export default function DatePicker({
  label,
  value,
  onDateChange,
  error,
  required = false,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  
  // Initialize with a date that's 25 years ago (within valid range)
  const getInitialDate = () => {
    const today = new Date();
    return new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
  };
  
  const [selectedDate, setSelectedDate] = useState(getInitialDate());

  React.useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
      }
    }
  }, [value]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'dismissed') {
        return;
      }
    }

    if (selectedDate) {
      setSelectedDate(selectedDate);
      const dateString = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      onDateChange(dateString);
      
      if (Platform.OS === 'android') {
        setShowPicker(false);
      }
    }
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getMaxDate = () => {
    const today = new Date();
    // Set to 18 years ago for minimum age requirement
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return maxDate;
  };

  const getMinDate = () => {
    // Set to 100 years ago for reasonable minimum
    const today = new Date();
    return new Date(today.getFullYear() - 100, 0, 1);
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
          setShowPicker(true);
        }}
      >
        <Text style={[
          styles.pickerText,
          !value ? styles.placeholderText : null
        ]}>
          {value ? formatDisplayDate(value) : 'Select your date of birth'}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#666" />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPicker && Platform.OS === 'web' && (
        <Modal
          visible={showPicker}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.webModalOverlay}>
            <View style={styles.webModalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowPicker(false)}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Date of Birth</Text>
                <TouchableOpacity
                  onPress={() => setShowPicker(false)}
                  style={styles.modalButton}
                >
                  <Text style={[styles.modalButtonText, styles.doneButton]}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.webDatePickerContainer}>
                <Text style={styles.webDateLabel}>Enter your date of birth (YYYY-MM-DD):</Text>
                <TextInput
                  style={styles.webDateInput}
                  value={value || selectedDate.toISOString().split('T')[0]}
                  onChangeText={(text) => {
                    // Auto-format as user types
                    let formatted = text.replace(/\D/g, ''); // Remove non-digits
                    if (formatted.length >= 4) {
                      formatted = formatted.slice(0, 4) + '-' + formatted.slice(4);
                    }
                    if (formatted.length >= 7) {
                      formatted = formatted.slice(0, 7) + '-' + formatted.slice(7, 9);
                    }
                    
                    // Validate complete date
                    if (formatted.match(/^\d{4}-\d{2}-\d{2}$/)) {
                      const date = new Date(formatted);
                      const minDate = getMinDate();
                      const maxDate = getMaxDate();
                      
                      if (!isNaN(date.getTime()) && date >= minDate && date <= maxDate) {
                        setSelectedDate(date);
                        onDateChange(formatted);
                        // Auto-close modal after a short delay for better UX
                        setTimeout(() => setShowPicker(false), 1000);
                      }
                    } else if (formatted.length <= 10) {
                      // Allow partial input for better UX
                      onDateChange(formatted);
                    }
                  }}
                  placeholder="1999-01-15"
                  placeholderTextColor="#999"
                  maxLength={10}
                  keyboardType="numeric"
                />
                <Text style={styles.webDateHint}>Format: YYYY-MM-DD (e.g., 1999-01-15)</Text>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showPicker && Platform.OS !== 'web' && (
        <>
          {Platform.OS === 'ios' ? (
            <Modal
              visible={showPicker}
              animationType="slide"
              presentationStyle="pageSheet"
              onRequestClose={() => setShowPicker(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    onPress={() => setShowPicker(false)}
                    style={styles.modalButton}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Select Date</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const dateString = selectedDate.toISOString().split('T')[0];
                      onDateChange(dateString);
                      setShowPicker(false);
                    }}
                    style={styles.modalButton}
                  >
                    <Text style={[styles.modalButtonText, styles.doneButton]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    maximumDate={getMaxDate()}
                    minimumDate={getMinDate()}
                    style={styles.datePicker}
                    textColor="#000000"
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={getMaxDate()}
              minimumDate={getMinDate()}
            />
          )}
        </>
      )}
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
  modalButton: {
    padding: 4,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#666',
  },
  doneButton: {
    color: '#000',
    fontWeight: '600',
  },
  datePicker: {
    height: 200,
    width: '100%',
  },
  datePickerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  webModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  webDatePickerContainer: {
    padding: 20,
  },
  webDateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  webDateInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    textAlign: 'center',
    marginBottom: 8,
  },
  webDateHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});