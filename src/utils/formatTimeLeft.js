export default function formatTimeLeft(sec) {
  if(sec === null) return '???'
  let t = Math.round(sec)
  let s = t % 60
  t = (t - s)/60
  let m = t % 60
  t = (t - m)/60
  let h = t
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}