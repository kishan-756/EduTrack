import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { auth, db } from '../../constants/firebase';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { Branding } from '@/components/Branding';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

export default function CGPA() {
  const { theme, isDark } = useTheme();
  const [subject, setSubject] = useState('');
  const [credits, setCredits] = useState('');
  const [grade, setGrade] = useState('O');
  const [semester, setSemester] = useState('1');
  const [allData, setAllData] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const creditsRef = useRef<TextInput>(null);

  const gradeMap: any = { O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5 };
  const grades = ["O", "A+", "A", "B+", "B", "C"];
  const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = collection(db, "users", auth.currentUser.uid, "cgpa");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllData(data);
    });

    return () => unsubscribe();
  }, []);

  const handleAddResult = async () => {
    if (!subject || !credits || !auth.currentUser) return;

    const data = {
      subject,
      credits: Number(credits),
      grade,
      sem: semester
    };

    try {
      if (editId) {
        await updateDoc(doc(db, "users", auth.currentUser.uid, "cgpa", editId), data);
        setEditId(null);
      } else {
        await addDoc(collection(db, "users", auth.currentUser.uid, "cgpa"), data);
      }
      setSubject('');
      setCredits('');
    } catch (error) {
      console.error(error);
    }
  };

  const deleteResult = async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, "users", auth.currentUser.uid, "cgpa", id));
  };

  const calculateCGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;
    allData.forEach(item => {
      const pts = (gradeMap[item.grade] || 0) * item.credits;
      totalPoints += pts;
      totalCredits += item.credits;
    });
    return totalCredits ? (totalPoints / totalCredits).toFixed(2) : "0.00";
  };

  const getSemesterData = () => {
    const semData: any = {};
    allData.forEach(item => {
      if (!semData[item.sem]) semData[item.sem] = { points: 0, credits: 0, subjects: [] };
      const pts = (gradeMap[item.grade] || 0) * item.credits;
      semData[item.sem].points += pts;
      semData[item.sem].credits += item.credits;
      semData[item.sem].subjects.push(item);
    });
    return semData;
  };

  const semData = getSemesterData();
  const overall = calculateCGPA();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Branding title="Track your GPA across semesters" />

          <View style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)', borderColor: Colors[theme].tint }]}>
            <Text style={[styles.summaryLabel, { color: Colors[theme].tint }]}>Overall CGPA</Text>
            <Text style={[styles.summaryValue, { color: Colors[theme].text }]}>{overall}</Text>
            <View style={[styles.progressBarBackground, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
              <View style={[styles.progressBarForeground, { width: `${(Number(overall) / 10) * 100}%`, backgroundColor: Colors[theme].tint }]} />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
            <Text style={[styles.cardTitle, { color: Colors[theme].text }]}>Add New Result</Text>
            <View style={styles.inputRow}>
              <View style={{ flex: 2, marginRight: 12 }}>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: Colors[theme].text, borderColor: Colors[theme].border }]}
                  placeholder="Subject"
                  placeholderTextColor="#94a3b8"
                  value={subject}
                  onChangeText={setSubject}
                  returnKeyType="next"
                  onSubmitEditing={() => creditsRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  ref={creditsRef}
                  style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: Colors[theme].text, borderColor: Colors[theme].border }]}
                  placeholder="Credits"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={credits}
                  onChangeText={setCredits}
                  returnKeyType="done"
                  onSubmitEditing={handleAddResult}
                />
              </View>
            </View>

            <View style={styles.selectorRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {semesters.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.chip,
                      { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: Colors[theme].border },
                      semester === s && { backgroundColor: Colors[theme].tint, borderColor: Colors[theme].tint }
                    ]}
                    onPress={() => setSemester(s)}
                  >
                    <Text style={[styles.chipText, { color: Colors[theme].icon }, semester === s && { color: '#fff' }]}>Sem {s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.selectorRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {grades.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.chip,
                      { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: Colors[theme].border },
                      grade === g && { backgroundColor: Colors[theme].tint, borderColor: Colors[theme].tint }
                    ]}
                    onPress={() => setGrade(g)}
                  >
                    <Text style={[styles.chipText, { color: Colors[theme].icon }, grade === g && { color: '#fff' }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity style={[styles.addButton, { backgroundColor: Colors[theme].tint }]} onPress={handleAddResult}>
              <Text style={styles.addButtonText}>{editId ? 'Update Result' : 'Add Result'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>Semester Breakdown</Text>
          {Object.keys(semData).sort().map(sem => {
            const s = semData[sem];
            const gpa = (s.points / s.credits).toFixed(2);
            return (
              <View key={sem} style={[styles.semCard, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
                <View style={[styles.semHeader, { borderBottomColor: Colors[theme].border }]}>
                  <Text style={[styles.semTitle, { color: Colors[theme].text }]}>Semester {sem}</Text>
                  <View style={[styles.gpaBadge, { backgroundColor: Colors[theme].tint }]}>
                    <Text style={styles.gpaText}>GPA: {gpa}</Text>
                  </View>
                </View>
                <View style={styles.semBody}>
                  {s.subjects.map((sub: any) => (
                    <View key={sub.id} style={styles.subjectRow}>
                      <Text style={[styles.subjectText, { color: Colors[theme].icon }]}>{sub.subject} ({sub.credits}cr) - {sub.grade}</Text>
                      <TouchableOpacity onPress={() => deleteResult(sub.id)}>
                        <Text style={styles.deleteText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
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
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  summaryCard: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  summaryLabel: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 16,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarForeground: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
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
  inputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectorRow: {
    marginBottom: 12,
  },
  horizontalScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  semCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  semHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  semTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  gpaBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  semBody: {
    gap: 8,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  deleteText: {
    fontSize: 24,
    color: '#ef4444',
  },
});