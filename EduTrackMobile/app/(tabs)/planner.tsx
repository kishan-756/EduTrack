import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { auth, db } from '../../constants/firebase';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { Branding } from '@/components/Branding';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

export default function Planner() {
    const { theme, isDark } = useTheme();
    const [task, setTask] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [tasks, setTasks] = useState<any[]>([]);
    const [editId, setEditId] = useState<string | null>(null);

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = collection(db, "users", auth.currentUser.uid, "planner");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTasks(data);
        });

        return () => unsubscribe();
    }, []);

    const handleAddTask = async () => {
        if (!task || !auth.currentUser) return;

        const data = {
            text: task,
            priority,
            done: false
        };

        try {
            if (editId) {
                await updateDoc(doc(db, "users", auth.currentUser.uid, "planner", editId), { text: task, priority });
                setEditId(null);
            } else {
                await addDoc(collection(db, "users", auth.currentUser.uid, "planner"), data);
            }
            setTask('');
            setPriority('Medium');
        } catch (error) {
            console.error(error);
        }
    };

    const toggleTask = async (item: any) => {
        if (!auth.currentUser) return;
        await updateDoc(doc(db, "users", auth.currentUser.uid, "planner", item.id), { done: !item.done });
    };

    const deleteTask = async (id: string) => {
        if (!auth.currentUser) return;
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "planner", id));
    };

    const startEdit = (item: any) => {
        setEditId(item.id);
        setTask(item.text);
        setPriority(item.priority);
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'High': return '#ef4444';
            case 'Medium': return '#f59e0b';
            case 'Low': return '#10b981';
            default: return '#64748b';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Branding title="Keep track of your tasks" />

                <View style={[styles.card, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: Colors[theme].text, borderColor: Colors[theme].border }]}
                        placeholder="Enter a task..."
                        placeholderTextColor="#94a3b8"
                        value={task}
                        onChangeText={setTask}
                    />

                    <View style={styles.priorityContainer}>
                        {['Low', 'Medium', 'High'].map(p => (
                            <TouchableOpacity
                                key={p}
                                style={[
                                    styles.priorityButton,
                                    { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderColor: Colors[theme].border },
                                    priority === p && { backgroundColor: getPriorityColor(p), borderColor: getPriorityColor(p) }
                                ]}
                                onPress={() => setPriority(p)}
                            >
                                <Text style={[styles.priorityText, priority === p && { color: '#fff' }]}>{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={[styles.addButton, { backgroundColor: Colors[theme].tint }]} onPress={handleAddTask}>
                        <Text style={styles.addButtonText}>{editId ? 'Update Task' : 'Add to Planner'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.listContainer}>
                    {tasks.map(item => (
                        <View key={item.id} style={[styles.taskItem, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
                            <TouchableOpacity onPress={() => toggleTask(item)} style={styles.taskCheckbox}>
                                <View style={[styles.checkbox, { borderColor: Colors[theme].border }, item.done && { backgroundColor: Colors[theme].tint, borderColor: Colors[theme].tint }]}>
                                    {item.done && <Text style={styles.checkIcon}>✓</Text>}
                                </View>
                                <Text style={[styles.taskText, { color: Colors[theme].text }, item.done && styles.taskTextDone]}>{item.text}</Text>
                            </TouchableOpacity>

                            <View style={styles.taskActions}>
                                <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) }]}>
                                    <Text style={styles.badgeText}>{item.priority}</Text>
                                </View>
                                <TouchableOpacity onPress={() => startEdit(item)}>
                                    <IconSymbol name="chevron.right" size={18} color={Colors[theme].icon} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => deleteTask(item.id)}>
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
    card: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 24,
    },
    input: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    priorityButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
    },
    priorityText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
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
    taskItem: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    taskCheckbox: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    checkIcon: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    taskText: {
        fontSize: 16,
        color: '#fff',
    },
    taskTextDone: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    taskActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    deleteText: {
        fontSize: 24,
        color: '#ef4444',
        lineHeight: 24,
        marginLeft: 4,
    },
});