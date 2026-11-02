// Ponto de entrada: polyfills ANTES de qualquer módulo do app (Hermes sem toSorted/toReversed; ver src/polyfills.ts).
import './src/polyfills';
import 'expo-router/entry';
