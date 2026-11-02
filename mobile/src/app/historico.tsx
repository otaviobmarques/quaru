import { Redirect } from 'expo-router';

/** v0.4.2: endereço antigo (/historico). Agora é a seção "historico" da aba Treinos. */
export default function Historico() {
  return <Redirect href="/treinos?secao=historico" />;
}
