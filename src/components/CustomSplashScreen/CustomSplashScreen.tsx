import { View, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CustomSplashScreenProps = {
    onLayout?: () => void;
};

const CustomSplashScreen = ({ onLayout }: CustomSplashScreenProps) => {
    return (
        <SafeAreaView style={styles.container} onLayout={onLayout}>
            <Image
                source={require('@/../assets/images/Sini-splash.png')}
                style={styles.image}
                resizeMode="cover"
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
    image: { width: '100%', height: '110%' },
});

export default CustomSplashScreen;

