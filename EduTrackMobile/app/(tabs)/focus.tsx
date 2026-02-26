import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { auth, db } from '../../constants/firebase';
import { collection, onSnapshot, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Branding } from '@/components/Branding';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

export default function Focus() {
    const { theme, isDark } = useTheme();
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isStudyMode, setIsStudyMode] = useState(true);
    const [weeklyActivity, setWeeklyActivity] = useState<any>({ Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 });

    const timerRef = useRef<any>(null);

    useEffect(() => {
        if (isTimerRunning) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleTimerComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isTimerRunning]);

    useEffect(() => {
        loadStudyActivity();
    }, []);

    const handleTimerComplete = () => {
        setIsTimerRunning(false);
        if (isStudyMode) {
            logStudyTime(25);
        }
        Alert.alert(
            isStudyMode ? "Study Session Complete!" : "Break Over!",
            isStudyMode ? "Great job! Time for a break." : "Ready to get back to work?",
            [{ text: "OK" }]
        );
        setTimeLeft(isStudyMode ? 25 * 60 : 5 * 60);
    };

    const toggleTimer = () => setIsTimerRunning(!isTimerRunning);

    const resetTimer = () => {
        setIsTimerRunning(false);
        setTimeLeft(isStudyMode ? 25 * 60 : 5 * 60);
    };

    const setMode = (study: boolean) => {
        setIsStudyMode(study);
        setIsTimerRunning(false);
        setTimeLeft(study ? 25 * 60 : 5 * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const logStudyTime = async (minutes: number) => {
        if (!auth.currentUser) return;
        const today = new Date();
        const dateStr = today.toISOString().split("T")[0];
        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][today.getDay()];

        const docRef = doc(db, "users", auth.currentUser.uid, "studyActivity", dateStr);
        try {
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                await updateDoc(docRef, { minutes: snap.data().minutes + minutes });
            } else {
                await setDoc(docRef, { minutes, day: dayName, timestamp: today.getTime() });
            }
            loadStudyActivity();
        } catch (error) {
            console.error(error);
        }
    };

    const loadStudyActivity = () => {
        if (!auth.currentUser) return;
        const q = collection(db, "users", auth.currentUser.uid, "studyActivity");
        onSnapshot(q, (snapshot) => {
            const dataMap: any = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

            const now = new Date();
            const sun = new Date(now);
            sun.setDate(now.getDate() - now.getDay());
            sun.setHours(0, 0, 0, 0);

            snapshot.docs.forEach(d => {
                const data = d.data();
                if (data.timestamp >= sun.getTime()) {
                    dataMap[data.day] += data.minutes;
                }
            });
            setWeeklyActivity(dataMap);
        });
    };

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const maxMins = Math.max(...Object.values(weeklyActivity) as number[], 60);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Branding title="Pomodoro engine & activity tracking" />

                <View style={[styles.timerCard, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
                    <View style={[styles.modeToggle, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                        <TouchableOpacity
                            style={[styles.modeBtn, isStudyMode && { backgroundColor: Colors[theme].tint }]}
                            onPress={() => setMode(true)}
                        >
                            <Text style={[styles.modeBtnText, { color: Colors[theme].icon }, isStudyMode && { color: '#fff' }]}>Study</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, !isStudyMode && { backgroundColor: Colors[theme].tint }]}
                            onPress={() => setMode(false)}
                        >
                            <Text style={[styles.modeBtnText, { color: Colors[theme].icon }, !isStudyMode && { color: '#fff' }]}>Break</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.timerDisplay, { color: Colors[theme].text }]}>{formatTime(timeLeft)}</Text>

                    <View style={styles.controls}>
                        <TouchableOpacity style={[styles.startBtn, { backgroundColor: Colors[theme].tint }]} onPress={toggleTimer}>
                            <Text style={styles.startBtnText}>{isTimerRunning ? 'Pause' : 'Start'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.resetBtn, { borderColor: Colors[theme].border }]} onPress={resetTimer}>
                            <Text style={[styles.resetBtnText, { color: Colors[theme].text }]}>Reset</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.activityCard, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
                    <Text style={[styles.cardTitle, { color: Colors[theme].text }]}>Weekly Activity (mins)</Text>
                    <View style={styles.chart}>
                        {days.map(day => (
                            <View key={day} style={styles.chartColumn}>
                                <View style={[styles.barContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
                                    <View style={[styles.bar, { height: `${(weeklyActivity[day] / maxMins) * 100}%`, backgroundColor: isStudyMode ? '#10b981' : Colors[theme].tint }]} />
                                </View>
                                <Text style={[styles.dayLabel, { color: Colors[theme].icon }]}>{day}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        marginBottom: 30,
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
    scrollContent: {
        padding: 20,
    },
    timerCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 30,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 24,
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        borderRadius: 15,
        padding: 6,
        marginBottom: 40,
    },
    modeBtn: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
    },
    modeBtnActive: {
        backgroundColor: '#2563eb',
    },
    modeBtnText: {
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    modeBtnTextActive: {
        color: '#fff',
    },
    timerDisplay: {
        fontSize: 84,
        fontWeight: '900',
        color: '#fff',
        fontVariant: ['tabular-nums'],
        marginBottom: 40,
    },
    controls: {
        flexDirection: 'row',
        gap: 15,
        width: '100%',
    },
    startBtn: {
        flex: 2,
        backgroundColor: '#2563eb',
        borderRadius: 15,
        padding: 18,
        alignItems: 'center',
    },
    startBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    resetBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 15,
        padding: 18,
        alignItems: 'center',
    },
    resetBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    activityCard: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 24,
    },
    chart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 150,
    },
    chartColumn: {
        alignItems: 'center',
        flex: 1,
    },
    barContainer: {
        height: 120,
        width: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 6,
        justifyContent: 'flex-end',
        marginBottom: 10,
    },
    bar: {
        backgroundColor: '#10b981',
        borderRadius: 6,
        width: '100%',
    },
    dayLabel: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
    },
});
