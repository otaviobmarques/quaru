import { Redirect } from 'expo-router';

/** v0.4.2: endereço antigo (/rotinas). Agora é a seção "meus" da aba Treinos. */
export default function Rotinas() {
  return <Redirect href="/treinos?secao=meus" />;
}
