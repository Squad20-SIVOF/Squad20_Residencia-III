export function readPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png'].includes(file.type))
    return Promise.reject(new Error('Envie uma imagem JPG ou PNG.'))
  if (file.size > 5 * 1024 * 1024)
    return Promise.reject(new Error('A imagem deve ter até 5 MB.'))
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(file)
  })
}
