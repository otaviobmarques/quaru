import { FaixaFichas, Ficha } from '@/componentes/ui';
import { proximasDatas, rotuloData } from '@/dominio/agenda';

/** v0.9: fichas com as próximas datas (Hoje, Amanhã, Qua 05/11…), para agendar ou reagendar um treino. */
export function SeletorDia({ hojeDia, valor, onChange, dias = 30, desde, pular }: {
  hojeDia: string; valor: string | null; onChange: (dia: string) => void; dias?: number; desde?: string; pular?: string;
}) {
  return (
    <FaixaFichas rolar>
      {proximasDatas(desde ?? hojeDia, dias).filter((d) => d !== pular).map((d) => (
        <Ficha key={d} texto={rotuloData(d, hojeDia)} ativa={d === valor} onPress={() => onChange(d)} />
      ))}
    </FaixaFichas>
  );
}
