import { requireOptionalNativeModule } from 'expo-modules-core';

type Nativo = { excluirDoBackup(caminho: string): Promise<boolean>; estaExcluido(caminho: string): Promise<boolean> };
/** Só existe no iOS (build nativo). No Android o backup é tratado pelo plugin sem-backup-android; na web/Expo Go é null. */
export const QuaruBackup = requireOptionalNativeModule<Nativo>('QuaruBackup');
