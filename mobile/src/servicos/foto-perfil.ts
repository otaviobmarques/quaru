import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/**
 * Foto de perfil (v0.4.1). Pede a permissão SÓ na hora (galeria ou câmera), recorta em quadrado no centro,
 * reduz para 320×320 e comprime em JPEG. Devolve um data URI que vai para o estado local: no Android/iOS fica
 * dentro do banco cifrado (SQLCipher, ADR-0010); na web, no localStorage deste navegador. Nunca é enviada.
 */
export type ResultadoFoto = { ok: true; uri: string } | { ok: false; motivo: 'cancelado' | 'sem_permissao' | 'erro' };
export const LADO_FOTO = 320;

export async function escolherFoto(origem: 'galeria' | 'camera'): Promise<ResultadoFoto> {
  try {
    const perm = origem === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return { ok: false, motivo: 'sem_permissao' };
    const opcoes: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1, exif: false };
    const r = origem === 'camera' ? await ImagePicker.launchCameraAsync(opcoes) : await ImagePicker.launchImageLibraryAsync(opcoes);
    if (r.canceled || !r.assets?.[0]) return { ok: false, motivo: 'cancelado' };
    const a = r.assets[0];
    const lado = Math.min(a.width, a.height);
    const corte = { originX: Math.floor((a.width - lado) / 2), originY: Math.floor((a.height - lado) / 2), width: lado, height: lado };
    const f = await ImageManipulator.manipulateAsync(a.uri, [...(lado > 0 && a.width !== a.height ? [{ crop: corte }] : []), { resize: { width: LADO_FOTO, height: LADO_FOTO } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true });
    if (!f.base64) return { ok: false, motivo: 'erro' };
    return { ok: true, uri: `data:image/jpeg;base64,${f.base64}` };
  } catch {
    return { ok: false, motivo: 'erro' };
  }
}
