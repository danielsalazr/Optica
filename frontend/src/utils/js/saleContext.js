export const SALE_CONTEXT_KEY = 'optica.crearVenta.context.v1';

export function resolveSaleContext(saved, empresas, jornadas) {
  const empresa = empresas.find(item => String(item.id) === String(saved?.empresaId || ''));
  if (!empresa) return { empresaId: '', jornadaId: '' };
  const jornada = jornadas.find(item =>
    String(item.id) === String(saved?.jornadaId || '') &&
    String(item.empresa_id) === String(empresa.id) && item.estado !== 'closed');
  return { empresaId: String(empresa.id), jornadaId: jornada ? String(jornada.id) : '' };
}
