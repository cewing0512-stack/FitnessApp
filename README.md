# Dumbbell Library

A personal dumbbell workout **library** PWA. You browse and pick a workout yourself. The app never schedules anything.

> Status: **Phase 1 of 5** is done: the data model and seeded library. Screens, player, PWA and video pipeline come next.

## Develop

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests, including library validation
npm run build      # typecheck + production build
```

## Library data

Everything lives in `src/data/` as plain TypeScript.

| File | What it holds |
| --- | --- |
| `exercises.ts` | The master list of 40 dumbbell/bodyweight exercises (cues, mistakes, modification, motion description, video path) |
| `moves.ts` | Bodyweight warm-up and stretch moves, plus the warm-up/cool-down presets |
| `workouts/*.ts` | One file per category. Workouts only reference exercises by id |
| `weights.ts` | Works out the suggested weight and rep guidance for each block |
| `validate.ts` | Checks the whole library; runs as part of `npm test` |

### Add an exercise
1. Copy an entry in `src/data/exercises.ts` and give it a new kebab-case `id`.
2. Fill in every field. `motion` should precisely describe one rep, because it becomes the video prompt.
3. Dumbbell exercises need a `heavyWeightLb` range. Bodyweight ones don't.
4. Run `npm test`. Validation fails if a field is missing or the exercise isn't used in any workout.

### Add a workout
Add an object to the category file in `src/data/workouts/`:

```ts
{
  id: 'my-new-workout',
  name: 'My New Workout',
  category: 'arms',            // arms | legs | upper | lower | booty | abs | full
  format: 'circuit',           // circuit (2–3 rounds) | straight (1 round, no repeats)
  intensity: 'standard',       // standard (your default weight) | heavy
  description: 'One short sentence.',
  rounds: 3,
  items: items('bicep-curl', { exerciseId: 'goblet-squat', heavy: true }, 'push-up'),
  warmup: 'upper',             // full | upper | lower
  cooldown: 'upper',           // full | upper | lower | core
}
```

Durations are never typed in. They're computed as warm-up (3 min) + get-ready + work/rest blocks + cool-down (2.5 min). At the default 60s work / 30s rest, **15–16 work blocks ≈ 28–30 min**, so use 5 × 3, 8 × 2, or 16 straight. Validation warns if a workout falls outside 27–32 min.

For one-sided moves in a straight-through workout, use `...bothSides('split-squat')` to give each side a full 60s block. Otherwise the block is split 30s per side.
