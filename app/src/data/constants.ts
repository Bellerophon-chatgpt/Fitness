export const DAYS_SHORT = ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO'];
export const DAYS_LONG = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
export const MONTHS = ['JAN', 'FEB', 'MRT', 'APR', 'MEI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];
export const RECENTS = [
  'Bench Press', 'Squat', 'Deadlift', 'Pull-up', 'Overhead Press', 'Barbell Row',
  'Lat Pulldown', 'Bicep Curl', 'Romanian Deadlift', 'Leg Press', 'Lunges', 'Dips',
  'Cable Fly', 'Triceps Pushdown',
];

// today, with Monday = 0
export const TODAY = (new Date().getDay() + 6) % 7;

export function todayLabel(): string {
  const d = new Date();
  return `${DAYS_SHORT[TODAY]} · ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
