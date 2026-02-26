import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Linking } from 'react-native';
import { auth, db } from '../../constants/firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Branding } from '@/components/Branding';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/theme';

export default function Storage() {
    const { theme, toggleTheme, isDark } = useTheme();
    const [folders, setFolders] = useState<any[]>([]);
    const [currentFolder, setCurrentFolder] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [isAddingFolder, setIsAddingFolder] = useState(false);
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = collection(db, "users", auth.currentUser.uid, "folders");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFolders(data);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!auth.currentUser || !currentFolder) return;

        const q = collection(db, "users", auth.currentUser.uid, "folders", currentFolder.id, "items");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(data);
        });

        return () => unsubscribe();
    }, [currentFolder]);

    const handleCreateFolder = async () => {
        if (!name || !auth.currentUser) return;
        try {
            await addDoc(collection(db, "users", auth.currentUser.uid, "folders"), {
                name,
                createdAt: serverTimestamp()
            });
            setName('');
            setIsAddingFolder(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddItem = async () => {
        if (!name || !url || !auth.currentUser || !currentFolder) return;
        try {
            await addDoc(collection(db, "users", auth.currentUser.uid, "folders", currentFolder.id, "items"), {
                name,
                url,
                type: 'link',
                createdAt: serverTimestamp()
            });
            setName('');
            setUrl('');
            setIsAddingItem(false);
        } catch (error) {
            console.error(error);
        }
    };

    const deleteFolder = async (id: string) => {
        if (!auth.currentUser) return;
        Alert.alert("Delete Folder", "Are you sure you want to delete this folder and all its contents?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    await deleteDoc(doc(db, "users", auth.currentUser!.uid, "folders", id));
                }
            }
        ]);
    };

    const deleteItem = async (id: string) => {
        if (!auth.currentUser || !currentFolder) return;
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "folders", currentFolder.id, "items", id));
    };

    if (currentFolder) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setCurrentFolder(null)} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back to Root</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: Colors[theme].text }]}>{currentFolder.name}</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={toggleTheme} style={styles.themeButtonMini}>
                            <IconSymbol name={isDark ? "sun.max.fill" : "moon.fill"} size={16} color={isDark ? "#fbbf24" : "#475569"} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutButtonMini}>
                            <IconSymbol name="arrow.right.square" size={18} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {isAddingItem ? (
                        <View style={[styles.card, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
                            <Text style={[styles.cardTitle, { color: Colors[theme].text }]}>Add Resource</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: Colors[theme].text, borderColor: Colors[theme].border }]}
                                placeholder="Resource Name"
                                placeholderTextColor="#94a3b8"
                                value={name}
                                onChangeText={setName}
                            />
                            <TextInput
                                style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: Colors[theme].text, borderColor: Colors[theme].border }]}
                                placeholder="URL (Drive, YouTube, etc.)"
                                placeholderTextColor="#94a3b8"
                                value={url}
                                onChangeText={setUrl}
                            />
                            <View style={styles.buttonRow}>
                                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setIsAddingItem(false)}>
                                    <Text style={styles.buttonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.confirmButton, { backgroundColor: Colors[theme].tint }]} onPress={handleAddItem}>
                                    <Text style={styles.buttonText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity style={[styles.addItemBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', borderColor: Colors[theme].border }]} onPress={() => setIsAddingItem(true)}>
                            <Text style={[styles.addItemBtnText, { color: Colors[theme].icon }]}>+ Add Resource</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.itemsContainer}>
                        {items.map(item => (
                            <View key={item.id} style={[styles.itemRow, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
                                <TouchableOpacity onPress={() => Linking.openURL(item.url)} style={styles.itemInfo}>
                                    <Text style={styles.itemIconText}>🔗</Text>
                                    <View>
                                        <Text style={[styles.itemName, { color: Colors[theme].text }]}>{item.name}</Text>
                                        <Text style={[styles.itemType, { color: Colors[theme].icon }]}>link</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => deleteItem(item.id)}>
                                    <Text style={styles.deleteText}>×</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                        {items.length === 0 && <Text style={[styles.emptyText, { color: Colors[theme].icon }]}>No resources yet.</Text>}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <View style={styles.rootHeader}>
                <Branding />
                <TouchableOpacity style={[styles.createFolderBtn, { backgroundColor: Colors[theme].tint }]} onPress={() => setIsAddingFolder(true)}>
                    <Text style={styles.createFolderBtnText}>+ New Folder</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {isAddingFolder && (
                    <View style={[styles.card, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
                        <Text style={[styles.cardTitle, { color: Colors[theme].text }]}>New Folder</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: Colors[theme].text, borderColor: Colors[theme].border }]}
                            placeholder="Folder Name (e.g. Physics)"
                            placeholderTextColor="#94a3b8"
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setIsAddingFolder(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.confirmButton, { backgroundColor: Colors[theme].tint }]} onPress={handleCreateFolder}>
                                <Text style={styles.buttonText}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={styles.grid}>
                    {folders.map(folder => (
                        <TouchableOpacity
                            key={folder.id}
                            style={[styles.folderCard, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}
                            onPress={() => setCurrentFolder(folder)}
                        >
                            <TouchableOpacity style={styles.folderDelete} onPress={() => deleteFolder(folder.id)}>
                                <Text style={styles.deleteTextMini}>×</Text>
                            </TouchableOpacity>
                            <Text style={styles.folderIcon}>📁</Text>
                            <Text style={[styles.folderName, { color: Colors[theme].text }]} numberOfLines={1}>{folder.name}</Text>
                        </TouchableOpacity>
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
    header: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rootHeader: {
        padding: 20,
        paddingBottom: 0,
    },
    logoutButtonMini: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    themeButtonMini: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    createFolderBtn: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    createFolderBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    backButton: {
        paddingVertical: 8,
    },
    backButtonText: {
        color: '#3b82f6',
        fontWeight: '600',
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
        marginBottom: 20,
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
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#334155',
    },
    confirmButton: {
        backgroundColor: '#2563eb',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    folderCard: {
        width: '47%',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        position: 'relative',
    },
    folderIcon: {
        fontSize: 42,
        marginBottom: 8,
    },
    folderName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
    folderDelete: {
        position: 'absolute',
        top: 8,
        right: 12,
    },
    deleteTextMini: {
        color: '#ef4444',
        fontSize: 20,
    },
    addItemBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 16,
        borderRadius: 12,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        marginBottom: 20,
    },
    addItemBtnText: {
        color: '#94a3b8',
        fontWeight: '600',
    },
    itemsContainer: {
        gap: 12,
    },
    itemRow: {
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    itemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    itemIconText: {
        fontSize: 20,
    },
    itemName: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    itemType: {
        color: '#94a3b8',
        fontSize: 12,
    },
    deleteText: {
        fontSize: 28,
        color: '#ef4444',
    },
    emptyText: {
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 40,
    }
});
