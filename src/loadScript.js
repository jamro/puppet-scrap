export default async function loadScript(path) {
  return await import(path)
}