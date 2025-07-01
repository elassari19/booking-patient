import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width } = Dimensions.get('window');
const CALENDAR_WIDTH = width - 32;
const DAY_WIDTH = CALENDAR_WIDTH / 7;

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  markedDates?: Record<string, { marked: boolean; color?: string }>;
  minDate?: Date;
  maxDate?: Date;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar({
  selectedDate,
  onDateSelect,
  markedDates = {},
  minDate,
  maxDate,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateDisabled = useCallback(
    (date: Date) => {
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return false;
    },
    [minDate, maxDate]
  );

  const isDateSelected = useCallback(
    (date: Date) => {
      if (!selectedDate) return false;
      return formatDateKey(date) === formatDateKey(selectedDate);
    },
    [selectedDate]
  );

  const isDateMarked = useCallback(
    (date: Date) => {
      const dateKey = formatDateKey(date);
      return markedDates[dateKey]?.marked || false;
    },
    [markedDates]
  );

  const getMarkedColor = useCallback(
    (date: Date) => {
      const dateKey = formatDateKey(date);
      return markedDates[dateKey]?.color || '#007bff';
    },
    [markedDates]
  );

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const isDisabled = isDateDisabled(date);
      const isSelected = isDateSelected(date);
      const isMarked = isDateMarked(date);
      const markedColor = getMarkedColor(date);

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            styles.dayButton,
            isSelected && styles.selectedDay,
            isDisabled && styles.disabledDay,
          ]}
          onPress={() => !isDisabled && onDateSelect(date)}
          disabled={isDisabled}
        >
          <Text
            style={[
              styles.dayText,
              isSelected && styles.selectedDayText,
              isDisabled && styles.disabledDayText,
            ]}
          >
            {day}
          </Text>
          {isMarked && (
            <View
              style={[styles.markedDot, { backgroundColor: markedColor }]}
            />
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <IconSymbol name="chevron.left" size={20} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <IconSymbol name="chevron.right" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Days of week header */}
      <View style={styles.daysHeader}>
        {DAYS.map((day) => (
          <View key={day} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarGrid}>{renderCalendarDays()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderCell: {
    width: DAY_WIDTH,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_WIDTH,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButton: {
    borderRadius: 8,
    position: 'relative',
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDay: {
    backgroundColor: '#007bff',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledDay: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: '#ccc',
  },
  markedDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
