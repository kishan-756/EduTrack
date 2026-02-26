import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../constants/firebase';
import { signOut } from 'firebase/auth';
import { IconSymbol } from './ui/icon-symbol';
import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/theme';

export function Branding({ title }: { title?: string }) {
    const { theme, toggleTheme, isDark } = useTheme();

    const handleLogout = () => {
        signOut(auth);
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.logoRow}>
                    <Image
                        source={require('../assets/images/logo.png')}
                        style={[styles.logo, { tintColor: Colors[theme].tint }]}
                    />
                    <Text style={[styles.brandText, { color: Colors[theme].text }]}>EduTrack</Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={toggleTheme}
                        style={[
                            styles.themeButton,
                            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }
                        ]}
                    >
                        <IconSymbol
                            name={isDark ? "sun.max.fill" : "moon.fill"}
                            size={20}
                            color={isDark ? "#fbbf24" : "#475569"}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <IconSymbol name="arrow.right.square" size={20} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
            {title && <Text style={[styles.subtitle, { color: Colors[theme].icon }]}>{title}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logo: {
        width: 40,
        height: 40,
        borderRadius: 8,
    },
    brandText: {
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    themeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    logoutButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    subtitle: {
        fontSize: 16,
        marginTop: 4,
    },
});
