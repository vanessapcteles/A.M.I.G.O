import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useThemeColors } from '../theme/colors';

const BackButton = () => {
    const navigation = useNavigation();
    const colors = useThemeColors();

    const handlePress = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    if (!navigation.canGoBack()) {
        return null;
    }

    return (
        <TouchableOpacity onPress={handlePress} style={styles.button}>
            <ChevronLeft size={32} color={colors.text} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 8,
        marginLeft: -8, // Alignment correction
        marginRight: 8,
    }
});

export default BackButton;
