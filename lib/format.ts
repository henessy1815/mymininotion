import type { CharCount } from '@/lib/text';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 9/28(월) */
export function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}

/** 9/28(월) 오후 3:12 */
export function formatDateTime(ts: number) {
  const d = new Date(ts);
  const h = d.getHours();
  const period = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${formatDate(ts)} ${period} ${h12}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function displayTitle(title: string) {
  return title.trim() || '제목 없음';
}

/** 공백 포함 1,234자 · 공백 제외 1,050자 — ko-KR fixed so the separator is always ',' */
export function formatCharCount({ total, nonSpace }: CharCount): string {
  return `공백 포함 ${total.toLocaleString('ko-KR')}자 · 공백 제외 ${nonSpace.toLocaleString('ko-KR')}자`;
}
