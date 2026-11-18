import React from 'react';
import { Pressable, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { KairosProvider, useKairos } from './src/store';
import { Icon, T, tap } from './src/ui';
import { palette } from './src/theme';
import Welcome from './src/screens/Welcome';
import Home from './src/screens/Home';
import Pedidos from './src/screens/Pedidos';
import Comunidades from './src/screens/Comunidades';
import Entrega from './src/screens/Entrega';
import Perfil from './src/screens/Perfil';
import { Doar, Pedir } from './src/screens/Forms';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ICONES: Record<string, { icon: string; label: string }> = {
  Inicio: { icon: 'home', label: 'Início' },
  Pedidos: { icon: 'list', label: 'Pedidos' },
  Entrega: { icon: 'truck', label: 'Entrega' },
  Perfil: { icon: 'user', label: 'Perfil' },
};

/** Tab bar em pilula flutuante com o botao de acao principal no centro. */
function PillBar({ state, navigation }: BottomTabBarProps) {
  const { t, usuario } = useKairos();
  const ins = useSafeAreaInsets();
  const acao = usuario?.papel === 'comunidade' ? 'Pedir' : 'Doar';
  const itens = state.routes.map((r, i) => {
    const on = state.index === i;
    const meta = ICONES[r.name];
    return (
      <Pressable key={r.key} accessibilityRole="tab" accessibilityLabel={meta.label} accessibilityState={{ selected: on }}
        onPress={() => { tap(); navigation.navigate(r.name); }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: on ? 14 : 10, borderRadius: 22,
          backgroundColor: on ? (t.dark ? '#16161A1A' : '#FFFFFF1F') : 'transparent' }}>
        <Icon name={meta.icon} size={21} color={t.pillInk} />
        {on ? <T v="label" c={t.pillInk}>{meta.label}</T> : null}
      </Pressable>
    );
  });
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(ins.bottom, 12) + 4, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: t.pill, borderRadius: 30, padding: 6,
        shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 10 }}>
        {itens.slice(0, 2)}
        <Pressable accessibilityLabel={acao === 'Doar' ? 'Doar um recurso' : 'Pedir ajuda'} onPress={() => { tap(); navigation.getParent()?.navigate(acao); }}
          style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: palette.sol, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 }}>
          <Icon name="plus" size={24} color="#16161A" stroke={2.4} />
        </Pressable>
        {itens.slice(2)}
      </View>
    </View>
  );
}

function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={p => <PillBar {...p} />}>
      <Tab.Screen name="Inicio" component={Home} />
      <Tab.Screen name="Pedidos" component={Pedidos} />
      <Tab.Screen name="Entrega" component={Entrega} />
      <Tab.Screen name="Perfil" component={Perfil} />
    </Tab.Navigator>
  );
}

function Root() {
  const { t, usuario } = useKairos();
  const base = t.dark ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer theme={{ ...base, colors: { ...base.colors, background: t.bg, card: t.bg, text: t.ink, primary: t.ink, border: t.line } }}>
      <StatusBar style={usuario ? (t.dark ? 'light' : 'dark') : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!usuario ? (
          <Stack.Screen name="Welcome" component={Welcome} />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Screen name="Comunidades" component={Comunidades}
              options={{ headerShown: true, title: '', headerShadowVisible: false, headerTintColor: t.ink, headerStyle: { backgroundColor: t.bg } }} />
            <Stack.Screen name="Doar" component={Doar} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Pedir" component={Pedir} options={{ presentation: 'modal' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [ok] = useFonts({ BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  if (!ok) return <View style={{ flex: 1, backgroundColor: palette.sol }} />;
  return (
    <SafeAreaProvider>
      <KairosProvider>
        <Root />
      </KairosProvider>
    </SafeAreaProvider>
  );
}
