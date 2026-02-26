import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import { auth, db } from '../../constants/firebase';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { Branding } from '@/components/Branding';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

export default function Dashboard() {
  const { theme, isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = collection(db, "users", auth.currentUser.uid, "schedule");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchedule(data);
    });

    return () => unsubscribe();
  }, []);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddEvent = async () => {
    if (!title || !time || !auth.currentUser) return;

    const data = {
      title,
      time,
      days: selectedDays.length > 0 ? selectedDays : ["One-time"]
    };

    try {
      if (editId) {
        await updateDoc(doc(db, "users", auth.currentUser.uid, "schedule", editId), data);
        setEditId(null);
      } else {
        await addDoc(collection(db, "users", auth.currentUser.uid, "schedule"), data);
      }
      setTitle('');
      setTime('');
      setSelectedDays([]);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, "users", auth.currentUser.uid, "schedule", id));
  };

  const startEdit = (item: any) => {
    setEditId(item.id);
    setTitle(item.title);
    setTime(item.time);
    setSelectedDays(item.days || []);
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      const formattedTime = selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setTime(formattedTime);
    }
  };

  const getValidDate = () => {
    try {
      if (!time) return new Date();
      const parts = time.split(' ');
      const timeParts = parts[0].split(':').map(Number);
      let hours = timeParts[0];
      const minutes = timeParts[1];
      const modifier = parts[1];

      if (modifier) {
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
      }

      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return isNaN(d.getTime()) ? new Date() : d;
    } catch (e) {
      return new Date();
    }
  };

  const toggleAmPm = () => {
    if (!time) {
      setTime('12:00 AM');
      return;
    }

    if (time.toUpperCase().includes('AM')) {
      setTime(time.replace(/AM/i, 'PM'));
    } else if (time.toUpperCase().includes('PM')) {
      setTime(time.replace(/PM/i, 'AM'));
    } else {
      setTime(time + ' AM');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Branding title="Managed Schedule" />

        <View style={[styles.card, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
          <Text style={[styles.cardTitle, { color: Colors[theme].text }]}>Add Event</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: Colors[theme].text, borderColor: Colors[theme].border }]}
            placeholder="Event / Class Name"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
          />

          <View style={[styles.timeInputContainer, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: Colors[theme].border }]}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: 'transparent', borderWidth: 0, color: Colors[theme].text }]}
              placeholder="Time (e.g. 10:00)"
              placeholderTextColor="#94a3b8"
              value={time}
              onChangeText={setTime}
            />
            <TouchableOpacity style={[styles.amPmToggle, { borderLeftColor: Colors[theme].border }]} onPress={toggleAmPm}>
              <Text style={[styles.amPmText, { color: Colors[theme].text }]}>
                {time.toUpperCase().includes('PM') ? 'PM' : 'AM'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pickerTrigger, { borderLeftColor: Colors[theme].border }]} onPress={() => setShowPicker(true)}>
              <IconSymbol name="clock.fill" size={20} color={isDark ? "#fbbf24" : "#2563eb"} />
            </TouchableOpacity>
          </View>

          {showPicker && (
            <View style={[Platform.OS === 'ios' ? styles.pickerContainer : null, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)' }]}>
              <DateTimePicker
                value={getValidDate()}
                mode="time"
                is24Hour={false}
                onChange={onTimeChange}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setShowPicker(false)}
                >
                  <Text style={[styles.doneButtonText, { color: Colors[theme].tint }]}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Text style={styles.label}>Repeat Days</Text>
          <View style={styles.daysContainer}>
            {daysOfWeek.map(day => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: Colors[theme].border },
                  selectedDays.includes(day) && { backgroundColor: Colors[theme].tint, borderColor: Colors[theme].tint }
                ]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[
                  styles.dayText,
                  { color: Colors[theme].icon },
                  selectedDays.includes(day) && { color: '#fff' }
                ]}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.addButton, { backgroundColor: Colors[theme].tint }]} onPress={handleAddEvent}>
            <Text style={styles.addButtonText}>{editId ? 'Update Event' : 'Add Event'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          {schedule.map(item => (
            <View key={item.id} style={[styles.scheduleItem, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: Colors[theme].text }]}>{item.title}</Text>
                <Text style={[styles.itemDetail, { color: Colors[theme].icon }]}>{item.time} | {item.days.join(', ')}</Text>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => startEdit(item)} style={styles.actionButton}>
                  <IconSymbol name="chevron.right" size={20} color={Colors[theme].tint} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteEvent(item.id)} style={styles.actionButton}>
                  <Text style={styles.deleteText}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
    overflow: 'hidden',
  },
  pickerTrigger: {
    padding: 14,
    borderLeftWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pickerContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 16,
    padding: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  doneButton: {
    alignItems: 'flex-end',
    padding: 10,
  },
  doneButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: 'bold',
  },
  amPmToggle: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#334155',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  amPmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 8,
    marginBottom: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dayButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  dayText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    gap: 12,
  },
  scheduleItem: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  itemDetail: {
    fontSize: 13,
    color: '#94a3b8',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  deleteText: {
    fontSize: 24,
    color: '#ef4444',
    lineHeight: 24,
  },
});