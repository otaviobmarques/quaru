/**
 * v0.5 (web): pede ao navegador que não apague o localStorage do Quaru quando faltar espaço ou após dias sem uso
 * (o Safari apaga dados de sites não instalados após 7 dias sem visita). Não garante, mas reduz o risco.
 * Retorna true se ficou persistente, false se o navegador negou e null se não há suporte.
 */
export async function pedirArmazenamentoPersistente(): Promise<boolean | null> {
  try {
    const st = typeof navigator !== 'undefined' ? navigator.storage : undefined;
    if (!st?.persist) return null;
    if (await st.persisted?.()) return true;
    return await st.persist();
  } catch { return null; }
}
