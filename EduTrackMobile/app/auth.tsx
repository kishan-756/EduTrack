import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { auth, db } from '../constants/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/theme';

export default function AuthScreen() {
    const { theme, isDark } = useTheme();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleAuth = async () => {
        if (!email || !password || (!isLogin && !name)) {
            alert("Please fill all fields");
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await updateProfile(user, { displayName: name });
                await setDoc(doc(db, "users", user.uid), {
                    name,
                    email,
                    createdAt: new Date().getTime()
                });
            }
            router.replace('/(tabs)');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: Colors[theme].background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={[styles.card, { backgroundColor: Colors[theme].card, borderColor: Colors[theme].border }]}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../assets/images/logo.png')}
                            style={[styles.logo, { tintColor: Colors[theme].tint }]}
                        />
                        <Text style={[styles.logoText, { color: Colors[theme].text }]}>EduTrack</Text>
                    </View>

                    <Text style={[styles.title, { color: Colors[theme].text }]}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
                    <Text style={[styles.subtitle, { color: Colors[theme].icon }]}>
                        {isLogin ? 'Sign in to track your progress' : 'Start your academic journey today'}
                    </Text>

                    <View style={styles.form}>
                        {!isLogin && (
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: Colors[theme].text }]}>Full Name</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: Colors[theme].text, borderColor: Colors[theme].border }]}
                                    placeholder="John Doe"
                                    placeholderTextColor="#94a3b8"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: Colors[theme].text }]}>Email Address</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: Colors[theme].text, borderColor: Colors[theme].border }]}
                                placeholder="name@example.com"
                                placeholderTextColor="#94a3b8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: Colors[theme].text }]}>Password</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: Colors[theme].text, borderColor: Colors[theme].border }]}
                                placeholder="••••••••"
                                placeholderTextColor="#94a3b8"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: Colors[theme].tint }, loading && styles.buttonDisabled]}
                            onPress={handleAuth}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.toggleContainer}
                            onPress={() => setIsLogin(!isLogin)}
                        >
                            <Text style={[styles.toggleText, { color: Colors[theme].icon }]}>
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <Text style={[styles.toggleLink, { color: Colors[theme].tint }]}>{isLogin ? 'Create one' : 'Login'}</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        width: 80,
        height: 80,
        marginBottom: 10,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        marginBottom: 32,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    button: {
        backgroundColor: '#2563eb',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    toggleContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    toggleText: {
        color: '#94a3b8',
        fontSize: 14,
    },
    toggleLink: {
        color: '#3b82f6',
        fontWeight: '600',
    },
});
