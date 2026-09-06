import type { ExerciseDef, Muscle, Store } from '../types';

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: 'Borst',
  back: 'Rug',
  legs: 'Benen',
  shoulders: 'Schouders',
  arms: 'Armen',
  core: 'Core',
  other: 'Overig',
};

export const MUSCLES: Muscle[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'other'];

const L = (id: string, name: string, muscle: Muscle): ExerciseDef => ({ id, name, muscle });

// A built-in library of common exercises with muscle groups.
export const EXERCISE_LIBRARY: ExerciseDef[] = [
  // chest
  L('bench-press', 'Bench Press', 'chest'),
  L('incline-bench-press', 'Incline Bench Press', 'chest'),
  L('decline-bench-press', 'Decline Bench Press', 'chest'),
  L('dumbbell-press', 'Dumbbell Bench Press', 'chest'),
  L('incline-dumbbell-press', 'Incline Dumbbell Press', 'chest'),
  L('machine-chest-press', 'Machine Chest Press', 'chest'),
  L('cable-fly', 'Cable Fly', 'chest'),
  L('pec-deck', 'Pec Deck', 'chest'),
  L('dumbbell-fly', 'Dumbbell Fly', 'chest'),
  L('push-up', 'Push-up', 'chest'),
  L('dips', 'Dips', 'chest'),
  // back
  L('deadlift', 'Deadlift', 'back'),
  L('sumo-deadlift', 'Sumo Deadlift', 'back'),
  L('barbell-row', 'Barbell Row', 'back'),
  L('pendlay-row', 'Pendlay Row', 'back'),
  L('t-bar-row', 'T-Bar Row', 'back'),
  L('pull-up', 'Pull-up', 'back'),
  L('chin-up', 'Chin-up', 'back'),
  L('lat-pulldown', 'Lat Pulldown', 'back'),
  L('close-grip-pulldown', 'Close-grip Pulldown', 'back'),
  L('seated-row', 'Seated Cable Row', 'back'),
  L('dumbbell-row', 'Dumbbell Row', 'back'),
  L('chest-supported-row', 'Chest-supported Row', 'back'),
  L('face-pull', 'Face Pull', 'back'),
  L('straight-arm-pulldown', 'Straight-arm Pulldown', 'back'),
  L('shrug', 'Shrug', 'back'),
  L('back-extension', 'Back Extension', 'back'),
  // legs
  L('squat', 'Squat', 'legs'),
  L('front-squat', 'Front Squat', 'legs'),
  L('goblet-squat', 'Goblet Squat', 'legs'),
  L('hack-squat', 'Hack Squat', 'legs'),
  L('romanian-deadlift', 'Romanian Deadlift', 'legs'),
  L('leg-press', 'Leg Press', 'legs'),
  L('lunges', 'Lunges', 'legs'),
  L('walking-lunge', 'Walking Lunge', 'legs'),
  L('bulgarian-split-squat', 'Bulgarian Split Squat', 'legs'),
  L('step-up', 'Step-up', 'legs'),
  L('leg-extension', 'Leg Extension', 'legs'),
  L('leg-curl', 'Leg Curl', 'legs'),
  L('seated-leg-curl', 'Seated Leg Curl', 'legs'),
  L('calf-raise', 'Standing Calf Raise', 'legs'),
  L('seated-calf-raise', 'Seated Calf Raise', 'legs'),
  L('hip-thrust', 'Hip Thrust', 'legs'),
  L('glute-bridge', 'Glute Bridge', 'legs'),
  L('hip-abduction', 'Hip Abduction', 'legs'),
  // shoulders
  L('overhead-press', 'Overhead Press', 'shoulders'),
  L('push-press', 'Push Press', 'shoulders'),
  L('dumbbell-shoulder-press', 'Dumbbell Shoulder Press', 'shoulders'),
  L('arnold-press', 'Arnold Press', 'shoulders'),
  L('machine-shoulder-press', 'Machine Shoulder Press', 'shoulders'),
  L('lateral-raise', 'Lateral Raise', 'shoulders'),
  L('cable-lateral-raise', 'Cable Lateral Raise', 'shoulders'),
  L('rear-delt-fly', 'Rear Delt Fly', 'shoulders'),
  L('front-raise', 'Front Raise', 'shoulders'),
  L('upright-row', 'Upright Row', 'shoulders'),
  // arms
  L('bicep-curl', 'Bicep Curl', 'arms'),
  L('dumbbell-curl', 'Dumbbell Curl', 'arms'),
  L('hammer-curl', 'Hammer Curl', 'arms'),
  L('preacher-curl', 'Preacher Curl', 'arms'),
  L('incline-curl', 'Incline Dumbbell Curl', 'arms'),
  L('cable-curl', 'Cable Curl', 'arms'),
  L('concentration-curl', 'Concentration Curl', 'arms'),
  L('triceps-pushdown', 'Triceps Pushdown', 'arms'),
  L('rope-pushdown', 'Rope Pushdown', 'arms'),
  L('skullcrusher', 'Skullcrusher', 'arms'),
  L('overhead-triceps-extension', 'Overhead Triceps Extension', 'arms'),
  L('triceps-dip', 'Triceps Dip', 'arms'),
  L('close-grip-bench', 'Close-grip Bench Press', 'arms'),
  L('wrist-curl', 'Wrist Curl', 'arms'),
  // core
  L('plank', 'Plank', 'core'),
  L('hanging-leg-raise', 'Hanging Leg Raise', 'core'),
  L('cable-crunch', 'Cable Crunch', 'core'),
  L('crunch', 'Crunch', 'core'),
  L('russian-twist', 'Russian Twist', 'core'),
  L('ab-wheel', 'Ab Wheel Rollout', 'core'),
  L('leg-raise', 'Lying Leg Raise', 'core'),
  L('mountain-climber', 'Mountain Climber', 'core'),
  L('side-plank', 'Side Plank', 'core'),
  // other / conditioning
  L('running', 'Running', 'other'),
  L('cycling', 'Cycling', 'other'),
  L('rowing-machine', 'Rowing Machine', 'other'),
  L('kettlebell-swing', 'Kettlebell Swing', 'other'),
  L('farmer-carry', "Farmer's Carry", 'other'),
  L('burpee', 'Burpee', 'other'),
  L('jump-rope', 'Jump Rope', 'other'),
];

const norm = (s: string) => s.trim().toLowerCase();

// All exercises available to pick: built-in + the user's custom defs + any names
// already used in routines/history that aren't otherwise known (as 'other'),
// deduped by normalized name. Nothing is mutated — this is derived on the fly.
export function allExercises(store: Store): ExerciseDef[] {
  const byName = new Map<string, ExerciseDef>();
  for (const d of EXERCISE_LIBRARY) byName.set(norm(d.name), d);
  for (const d of store.customExercises ?? []) byName.set(norm(d.name), d);

  const consider = (name: string) => {
    const k = norm(name);
    if (!byName.has(k)) byName.set(k, { id: 'x:' + k, name, muscle: 'other', custom: true });
  };
  for (const day of Object.values(store.days)) day?.ex.forEach((e) => consider(e.name));
  for (const s of store.workoutLog ?? []) s.exercises.forEach((e) => consider(e.name));

  return [...byName.values()];
}

// Resolve an exercise name to its definition (for muscle group, etc.).
export function findDef(store: Store, name: string): ExerciseDef | null {
  const k = norm(name);
  return (
    (store.customExercises ?? []).find((d) => norm(d.name) === k) ||
    EXERCISE_LIBRARY.find((d) => norm(d.name) === k) ||
    null
  );
}

export function muscleOf(store: Store, name: string): Muscle {
  return findDef(store, name)?.muscle ?? 'other';
}
