import type { Exercise } from './types';

/**
 * Master exercise list. Workouts only reference exercises by id, so each
 * demo video is generated once and reused everywhere.
 *
 * To add an exercise: copy an entry, give it a new kebab-case id and fill
 * in every field. The video path is derived from the id automatically.
 */
type ExerciseInput = Omit<Exercise, 'video'>;

const ex = (e: ExerciseInput): Exercise => ({ ...e, video: `/videos/${e.id}.mp4` });

export const EXERCISES: Exercise[] = [
  // ─── Arms ────────────────────────────────────────────────────────────
  ex({
    id: 'bicep-curl',
    name: 'Bicep Curl',
    targetMuscles: ['Biceps', 'Forearms'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [15, 20],
    cues: [
      'Elbows pinned to your sides',
      'Palms face forward, curl to shoulder height',
      'Lower slowly all the way to straight arms',
    ],
    mistakes: ['Swinging the weights with your hips or back', 'Elbows drifting forward', 'Cutting the lowering phase short'],
    modification: 'Curl one arm at a time, or use lighter weights.',
    motion:
      'Standing tall, feet hip-width, a dumbbell in each hand with arms straight at her sides and palms facing forward. Keeping elbows tucked at her sides, she curls both dumbbells up to shoulder height, squeezes, then slowly lowers back to straight arms.',
  }),
  ex({
    id: 'hammer-curl',
    name: 'Hammer Curl',
    targetMuscles: ['Biceps', 'Brachialis', 'Forearms'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [15, 20],
    cues: ['Palms face each other the whole time', 'Elbows stay tight to your ribs', 'Control the weight down'],
    mistakes: ['Rocking the torso to lift', 'Shrugging the shoulders up'],
    modification: 'Alternate arms, or use lighter weights.',
    motion:
      'Standing tall, dumbbells at her sides with palms facing her thighs (neutral grip). Keeping the neutral grip and elbows at her sides, she curls both dumbbells up toward her shoulders, then lowers them slowly back down.',
  }),
  ex({
    id: 'overhead-triceps-extension',
    name: 'Overhead Triceps Extension',
    targetMuscles: ['Triceps'],
    equipment: 'one-dumbbell',
    heavyWeightLb: [15, 25],
    cues: [
      'Hold one dumbbell with both hands overhead',
      'Elbows point forward, close to your head',
      'Lower behind your head, then press back up',
      'Ribs down, glutes squeezed',
    ],
    mistakes: ['Elbows flaring wide', 'Arching the lower back', 'Letting the weight drop fast behind the head'],
    modification: 'Sit on the floor or a chair, or use a lighter dumbbell.',
    motion:
      'Standing tall, she holds one dumbbell vertically overhead with both hands cupping the top end, arms straight. Keeping her upper arms still beside her ears, she bends her elbows to lower the dumbbell behind her head, then straightens her arms to press it back overhead.',
  }),
  ex({
    id: 'triceps-kickback',
    name: 'Triceps Kickback',
    targetMuscles: ['Triceps'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [12, 15],
    cues: [
      'Hinge forward with a flat back, knees soft',
      'Upper arms parallel to the floor and still',
      'Straighten your arms back, squeeze, return',
    ],
    mistakes: ['Swinging the upper arm', 'Rounding the back', 'Going too heavy and losing the lockout'],
    modification: 'Kick back one arm at a time with the other hand on your thigh.',
    motion:
      'She hinges forward at the hips to about 45 degrees with a flat back and soft knees, a dumbbell in each hand, upper arms held along her sides parallel to the floor and elbows bent at 90 degrees. She straightens both arms back until fully extended, pauses, then bends the elbows to return.',
  }),
  ex({
    id: 'skull-crusher',
    name: 'Floor Skull Crusher',
    targetMuscles: ['Triceps'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [12, 20],
    cues: [
      'Lie on your back, knees bent, arms straight over your chest',
      'Bend only at the elbows, lowering beside your head',
      'Keep elbows pointing to the ceiling',
    ],
    mistakes: ['Elbows flaring out', 'Moving the shoulders instead of the elbows', 'Lowering too fast'],
    modification: 'Use one dumbbell held with both hands.',
    motion:
      'Lying on her back on a mat, knees bent and feet flat, holding a dumbbell in each hand with arms straight above her chest and palms facing each other. Keeping upper arms still, she bends her elbows to lower the dumbbells beside her ears, then extends her arms back to straight.',
  }),

  // ─── Shoulders ───────────────────────────────────────────────────────
  ex({
    id: 'shoulder-press',
    name: 'Shoulder Press',
    targetMuscles: ['Shoulders', 'Triceps'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [15, 25],
    cues: [
      'Start with dumbbells at shoulder height',
      'Press straight up until arms are extended',
      'Brace your core, don’t arch your back',
    ],
    mistakes: ['Leaning back to push the weight', 'Stopping at half range', 'Shrugging the shoulders to the ears'],
    modification: 'Press one arm at a time, or sit down to support your back.',
    motion:
      'Standing tall with feet hip-width, she holds dumbbells at shoulder height, elbows bent and slightly in front of her body, palms facing forward. She presses both dumbbells straight overhead until her arms are extended, then lowers them back to shoulder height under control.',
  }),
  ex({
    id: 'arnold-press',
    name: 'Arnold Press',
    targetMuscles: ['Shoulders', 'Triceps'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [12, 20],
    cues: [
      'Start with palms facing you at chin height',
      'Rotate palms forward as you press up',
      'Reverse the rotation on the way down',
    ],
    mistakes: ['Rushing the rotation', 'Arching the lower back', 'Going too heavy to rotate smoothly'],
    modification: 'Do a regular shoulder press without the rotation.',
    motion:
      'Standing tall, she holds dumbbells in front of her chin with elbows bent and palms facing her body. As she presses upward she rotates her palms to face forward, finishing with arms extended overhead, then reverses the rotation as she lowers back to the start.',
  }),
  ex({
    id: 'lateral-raise',
    name: 'Lateral Raise',
    targetMuscles: ['Side delts'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [12, 15],
    cues: [
      'Slight bend in the elbows',
      'Raise out to the sides to shoulder height',
      'Lead with the elbows, lower slowly',
    ],
    mistakes: ['Swinging the body for momentum', 'Raising above shoulder height', 'Shrugging the traps'],
    modification: 'Raise to a lower height, or bend the elbows to 90 degrees.',
    motion:
      'Standing tall, dumbbells at her sides with palms facing in and a soft bend in her elbows. She raises both arms out to the sides until they reach shoulder height, forming a T, then slowly lowers them back down.',
  }),
  ex({
    id: 'front-raise',
    name: 'Front Raise',
    targetMuscles: ['Front delts'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [12, 15],
    cues: [
      'Palms face down, arms nearly straight',
      'Raise in front to shoulder height',
      'Keep your torso still',
    ],
    mistakes: ['Leaning back', 'Using momentum', 'Lifting above shoulder height'],
    modification: 'Alternate arms, or hold one dumbbell with both hands.',
    motion:
      'Standing tall, dumbbells resting in front of her thighs with palms facing her body. With arms nearly straight she raises both dumbbells forward to shoulder height, pauses, then lowers slowly.',
  }),
  ex({
    id: 'rear-delt-fly',
    name: 'Bent-Over Rear Delt Fly',
    targetMuscles: ['Rear delts', 'Upper back'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [12, 15],
    cues: [
      'Hinge forward with a flat back',
      'Soft elbows, open arms wide like wings',
      'Squeeze shoulder blades, lower slowly',
    ],
    mistakes: ['Rounding the back', 'Bending the elbows into a row', 'Jerking the weight up'],
    modification: 'Use lighter weights, or rest your forehead on a sturdy surface.',
    motion:
      'She hinges forward at the hips until her torso is nearly parallel to the floor, flat back, soft knees, dumbbells hanging below her chest with palms facing each other. With a slight bend in the elbows she raises both arms out to the sides to shoulder level, squeezing her shoulder blades, then lowers under control.',
  }),

  // ─── Back ────────────────────────────────────────────────────────────
  ex({
    id: 'bent-over-row',
    name: 'Bent-Over Row',
    targetMuscles: ['Lats', 'Upper back', 'Biceps'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [15, 25],
    cues: [
      'Hinge to about 45 degrees, back flat',
      'Pull elbows back toward your hips',
      'Squeeze your shoulder blades, then lower',
    ],
    mistakes: ['Rounding the lower back', 'Standing up as you pull', 'Shrugging instead of rowing'],
    modification: 'Row one arm at a time with your free hand on your thigh.',
    motion:
      'She hinges forward at the hips to about 45 degrees with a flat back and soft knees, dumbbells hanging below her shoulders with palms facing each other. She pulls both dumbbells up toward her lower ribs, driving her elbows back, squeezes her shoulder blades, then lowers to straight arms.',
  }),
  ex({
    id: 'single-arm-row',
    name: 'Single-Arm Row',
    targetMuscles: ['Lats', 'Upper back', 'Biceps'],
    equipment: 'one-dumbbell',
    heavyWeightLb: [20, 25],
    perSide: true,
    cues: [
      'Staggered stance, free hand on your front thigh',
      'Pull the dumbbell to your hip',
      'Keep your shoulders square to the floor',
    ],
    mistakes: ['Twisting the torso open', 'Pulling to the chest instead of the hip', 'Rounding the back'],
    modification: 'Use a lighter weight and a shorter range.',
    motion:
      'In a staggered stance with her left foot forward and left hand resting on her left thigh, she hinges forward with a flat back holding a dumbbell in her right hand hanging straight down. She rows the dumbbell up toward her right hip, elbow close to her body, then lowers it back to a straight arm.',
  }),
  ex({
    id: 'renegade-row',
    name: 'Renegade Row',
    targetMuscles: ['Lats', 'Core', 'Shoulders'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [12, 15],
    cues: [
      'High plank on the dumbbells, feet wide',
      'Row one dumbbell to your hip, then alternate',
      'Hips stay level. Don’t rotate.',
    ],
    mistakes: ['Hips twisting or piking up', 'Feet too close together', 'Rushing the reps'],
    modification: 'Drop to your knees in the plank.',
    motion:
      'In a high plank with hands gripping two dumbbells on the floor under her shoulders and feet set wider than hip-width, body in a straight line. She rows the right dumbbell up to her hip while keeping her hips level, sets it down, then rows the left, alternating.',
  }),
  ex({
    id: 'pullover',
    name: 'Floor Pullover',
    targetMuscles: ['Lats', 'Chest', 'Core'],
    equipment: 'one-dumbbell',
    heavyWeightLb: [15, 25],
    cues: [
      'Lie on your back, dumbbell held over your chest',
      'Arms nearly straight, lower it back overhead',
      'Keep your ribs down, pull back over your chest',
    ],
    mistakes: ['Arching the lower back off the floor', 'Bending the elbows too much', 'Lowering past a comfortable range'],
    modification: 'Use a lighter dumbbell and a shorter range.',
    motion:
      'Lying on her back on a mat with knees bent and feet flat, she holds one dumbbell with both hands above her chest, arms nearly straight. Keeping her lower back on the floor, she lowers the dumbbell in an arc back behind her head toward the floor, then pulls it back over her chest.',
  }),

  // ─── Chest ───────────────────────────────────────────────────────────
  ex({
    id: 'floor-press',
    name: 'Floor Chest Press',
    targetMuscles: ['Chest', 'Triceps', 'Front delts'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [15, 25],
    cues: [
      'Lie on your back, knees bent',
      'Elbows at about 45 degrees from your body',
      'Press straight up, lower until elbows touch the floor',
    ],
    mistakes: ['Elbows flared straight out to a T', 'Bouncing elbows off the floor', 'Uneven press'],
    modification: 'Press one arm at a time, or use lighter weights.',
    motion:
      'Lying on her back on a mat with knees bent and feet flat, holding dumbbells above her chest with arms extended. She lowers both dumbbells until her upper arms lightly touch the floor, elbows angled about 45 degrees from her torso, then presses them back up.',
  }),
  ex({
    id: 'floor-fly',
    name: 'Floor Chest Fly',
    targetMuscles: ['Chest', 'Front delts'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [12, 20],
    cues: [
      'Lie on your back with a slight bend in the elbows',
      'Open your arms wide until elbows touch the floor',
      'Hug the weights back together over your chest',
    ],
    mistakes: ['Straightening the arms fully', 'Dropping the weights fast', 'Turning it into a press'],
    modification: 'Use lighter weights.',
    motion:
      'Lying on her back on a mat with knees bent, she holds dumbbells above her chest with palms facing each other and a slight bend in the elbows. She opens her arms wide in an arc until her upper arms touch the floor, then squeezes her chest to bring the dumbbells back together above her chest.',
  }),
  ex({
    id: 'push-up',
    name: 'Push-Up',
    targetMuscles: ['Chest', 'Triceps', 'Core'],
    equipment: 'bodyweight',
    cues: [
      'Hands under your shoulders, body in a straight line',
      'Lower your chest toward the floor',
      'Elbows angle back about 45 degrees',
    ],
    mistakes: ['Sagging hips', 'Flaring elbows straight out', 'Head dropping forward'],
    modification: 'Do them from your knees or with hands on a raised surface.',
    motion:
      'In a high plank with hands slightly wider than her shoulders and body in a straight line from head to heels. She bends her elbows to lower her chest toward the floor, elbows angled back, then pushes back up to the plank.',
  }),

  // ─── Legs ────────────────────────────────────────────────────────────
  ex({
    id: 'goblet-squat',
    name: 'Goblet Squat',
    targetMuscles: ['Quads', 'Glutes', 'Core'],
    equipment: 'one-dumbbell',
    heavyWeightLb: [20, 30],
    cues: [
      'Hold one dumbbell vertically at your chest',
      'Sit your hips down and back, chest tall',
      'Knees track over your toes',
      'Drive through your whole foot to stand',
    ],
    mistakes: ['Heels lifting', 'Knees caving inward', 'Rounding the back at the bottom'],
    modification: 'Squat to a chair, or reduce the depth.',
    motion:
      'Standing with feet slightly wider than hip-width and toes turned slightly out, she holds one dumbbell vertically against her chest with both hands. She sits her hips down and back into a deep squat with chest tall and knees tracking over toes, then drives through her feet to stand.',
  }),
  ex({
    id: 'sumo-squat',
    name: 'Sumo Squat',
    targetMuscles: ['Inner thighs', 'Glutes', 'Quads'],
    equipment: 'one-dumbbell',
    heavyWeightLb: [20, 30],
    cues: [
      'Wide stance, toes turned out',
      'Hold the dumbbell hanging between your legs',
      'Push your knees out as you sit down',
    ],
    mistakes: ['Knees collapsing in', 'Leaning too far forward', 'Stance too narrow'],
    modification: 'Reduce the depth, or use no weight.',
    motion:
      'Standing in a wide stance with toes turned out about 45 degrees, she holds one dumbbell by one end with both hands, hanging between her legs. She bends her knees and lowers her hips straight down, knees pushing out over toes and chest tall, then stands back up squeezing her glutes.',
  }),
  ex({
    id: 'reverse-lunge',
    name: 'Reverse Lunge',
    targetMuscles: ['Quads', 'Glutes', 'Hamstrings'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [15, 25],
    cues: [
      'Step back and lower until both knees are near 90 degrees',
      'Front knee stays over the ankle',
      'Push through the front heel to return. Alternate legs.',
    ],
    mistakes: ['Front knee caving inward', 'Slamming the back knee down', 'Leaning the torso forward'],
    modification: 'Hold a wall or chair for balance, or shorten the depth.',
    motion:
      'Standing tall with a dumbbell in each hand at her sides, she steps her right foot back and lowers until both knees bend about 90 degrees, back knee hovering just above the floor. She pushes through her front heel to return to standing, then repeats stepping back with the left leg, alternating.',
  }),
  ex({
    id: 'lateral-lunge',
    name: 'Lateral Lunge',
    targetMuscles: ['Glutes', 'Inner thighs', 'Quads'],
    equipment: 'one-dumbbell',
    heavyWeightLb: [15, 20],
    cues: [
      'Take a big step to the side',
      'Sit your hips back over the bent leg, other leg straight',
      'Push off to return. Alternate sides.',
    ],
    mistakes: ['Bent knee caving in', 'Heel lifting', 'Rounding forward'],
    modification: 'Take a smaller step, or use no weight.',
    motion:
      'Standing tall holding one dumbbell at her chest, she takes a wide step to the right, bends her right knee and sits her hips back while keeping her left leg straight and both feet flat. She pushes off her right foot to return to center, then repeats to the left, alternating.',
  }),
  ex({
    id: 'split-squat',
    name: 'Split Squat',
    targetMuscles: ['Quads', 'Glutes'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [15, 25],
    perSide: true,
    cues: [
      'Long staggered stance, back heel lifted',
      'Drop your back knee straight down',
      'Keep your torso tall and front heel planted',
    ],
    mistakes: ['Stance too short', 'Front knee collapsing in', 'Pushing off the back foot'],
    modification: 'Hold a wall for balance, or reduce the depth.',
    motion:
      'In a long staggered stance with her left foot forward and right heel lifted, a dumbbell in each hand at her sides. Keeping her torso upright, she bends both knees to lower her back knee straight down toward the floor, then drives through her front foot to rise, staying in the split stance.',
  }),
  ex({
    id: 'curtsy-lunge',
    name: 'Curtsy Lunge',
    targetMuscles: ['Glutes', 'Outer hips', 'Quads'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [15, 20],
    cues: [
      'Step one leg back and across behind the other',
      'Lower with your hips square to the front',
      'Front knee tracks over the toes. Alternate sides.',
    ],
    mistakes: ['Twisting the hips open', 'Crossing too far behind', 'Front knee caving inward'],
    modification: 'Use no weight and a shallower lunge.',
    motion:
      'Standing tall with dumbbells at her sides, she steps her right foot diagonally back behind her left leg and bends both knees into a curtsy lunge, keeping hips facing forward. She drives through her left foot to stand, then repeats on the other side, alternating.',
  }),
  ex({
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    targetMuscles: ['Hamstrings', 'Glutes', 'Lower back'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [20, 30],
    cues: [
      'Soft knees. Push your hips straight back.',
      'Dumbbells slide close along your legs',
      'Flat back, lower to mid-shin, squeeze your glutes to stand',
    ],
    mistakes: ['Rounding the back', 'Bending the knees into a squat', 'Weights drifting away from the legs'],
    modification: 'Use a shorter range, stopping at the knees.',
    motion:
      'Standing tall with feet hip-width, dumbbells in front of her thighs with palms facing her. With a slight knee bend and flat back, she pushes her hips back and lowers the dumbbells along her legs to mid-shin, feeling a hamstring stretch, then drives her hips forward to stand tall.',
  }),
  ex({
    id: 'single-leg-rdl',
    name: 'Single-Leg Romanian Deadlift',
    targetMuscles: ['Hamstrings', 'Glutes', 'Balance'],
    equipment: 'one-dumbbell',
    heavyWeightLb: [15, 25],
    perSide: true,
    cues: [
      'Stand on one leg, knee soft',
      'Hinge forward as your back leg lifts behind you',
      'Keep your hips square, return tall',
    ],
    mistakes: ['Hips opening toward the ceiling', 'Rounding the back', 'Locking the standing knee'],
    modification: 'Keep the back toes lightly on the floor like a kickstand.',
    motion:
      'Standing on her left leg with a soft knee, holding a dumbbell in her right hand. She hinges forward at the hips, lowering the dumbbell toward the floor while her right leg extends straight behind her, body forming a T with hips square, then returns to standing tall.',
  }),
  ex({
    id: 'calf-raise',
    name: 'Calf Raise',
    targetMuscles: ['Calves'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [20, 30],
    cues: [
      'Rise up high onto the balls of your feet',
      'Pause at the top',
      'Lower slowly, heels to the floor',
    ],
    mistakes: ['Bouncing quickly', 'Rolling to the outside of the feet', 'Bending the knees'],
    modification: 'Hold a wall for balance, or go without weight.',
    motion:
      'Standing tall with feet hip-width, dumbbells at her sides. She rises up onto the balls of her feet as high as possible, pauses, then slowly lowers her heels back to the floor.',
  }),

  // ─── Glutes ──────────────────────────────────────────────────────────
  ex({
    id: 'glute-bridge',
    name: 'Dumbbell Glute Bridge',
    targetMuscles: ['Glutes', 'Hamstrings'],
    equipment: 'one-dumbbell',
    heavyWeightLb: [20, 30],
    cues: [
      'Rest the dumbbell on your hip bones',
      'Drive through your heels, lift hips',
      'Squeeze your glutes at the top, ribs down',
    ],
    mistakes: ['Arching the lower back at the top', 'Feet too far from the hips', 'Pushing through the toes'],
    modification: 'Do it without weight.',
    motion:
      'Lying on her back on a mat with knees bent and feet flat about hip-width, one dumbbell held horizontally across her hips with both hands. She drives through her heels to lift her hips until her body forms a straight line from shoulders to knees, squeezes her glutes, then lowers.',
  }),
  ex({
    id: 'single-leg-glute-bridge',
    name: 'Single-Leg Glute Bridge',
    targetMuscles: ['Glutes', 'Hamstrings'],
    equipment: 'bodyweight',
    perSide: true,
    cues: [
      'One foot planted, other leg extended',
      'Lift your hips level, don’t let one side drop',
      'Squeeze at the top, lower with control',
    ],
    mistakes: ['Hips tilting to one side', 'Pushing through the toes', 'Arching the back'],
    modification: 'Do a two-leg bridge instead.',
    motion:
      'Lying on her back on a mat with her left knee bent and left foot flat, right leg extended straight in line with her left thigh. She drives through her left heel to lift her hips level, squeezes her glutes at the top, then lowers.',
  }),

  // ─── Core ────────────────────────────────────────────────────────────
  ex({
    id: 'russian-twist',
    name: 'Russian Twist',
    targetMuscles: ['Obliques', 'Abs'],
    equipment: 'one-dumbbell',
    heavyWeightLb: [12, 15],
    cues: [
      'Sit tall, lean back slightly',
      'Rotate your ribs, not just your arms',
      'Keep your feet down for control',
    ],
    mistakes: ['Rounding the back', 'Only moving the arms', 'Going too fast'],
    modification: 'No weight, just hands clasped.',
    motion:
      'Seated on a mat with knees bent and heels on the floor, she leans back slightly with a tall spine, holding one dumbbell horizontally at her chest with both hands. She rotates her torso to the right to bring the dumbbell beside her hip, then rotates to the left, alternating.',
  }),
  ex({
    id: 'dead-bug',
    name: 'Dead Bug',
    targetMuscles: ['Deep core', 'Abs'],
    equipment: 'one-dumbbell',
    heavyWeightLb: [10, 15],
    cues: [
      'Press your lower back into the floor',
      'Reach opposite arm and leg away slowly',
      'Exhale as you extend',
    ],
    mistakes: ['Lower back arching off the floor', 'Moving too fast', 'Holding the breath'],
    modification: 'Move only the legs, keeping arms still.',
    motion:
      'Lying on her back holding one dumbbell with both hands straight above her chest, knees bent at 90 degrees over her hips (tabletop). Keeping her lower back pressed to the floor, she slowly extends one leg out straight to hover above the floor, returns it, then extends the other leg, alternating.',
  }),
  ex({
    id: 'weighted-crunch',
    name: 'Weighted Crunch',
    targetMuscles: ['Abs'],
    equipment: 'one-dumbbell',
    heavyWeightLb: [15, 25],
    cues: [
      'Hold the dumbbell on your chest',
      'Curl your shoulders off the floor',
      'Lower slowly, don’t pull your neck',
    ],
    mistakes: ['Yanking the head forward', 'Using momentum', 'Lifting too high into a sit-up'],
    modification: 'Do it without weight, arms crossed on your chest.',
    motion:
      'Lying on her back on a mat with knees bent and feet flat, holding one dumbbell against her chest with both hands. She curls her head and shoulders off the floor by contracting her abs, pauses, then lowers slowly.',
  }),
  ex({
    id: 'plank-drag',
    name: 'Plank Drag-Through',
    targetMuscles: ['Core', 'Shoulders', 'Obliques'],
    equipment: 'one-dumbbell',
    heavyWeightLb: [12, 15],
    cues: [
      'High plank, dumbbell beside one hand',
      'Reach under and drag it to the other side',
      'Hips stay level and still',
    ],
    mistakes: ['Hips swaying side to side', 'Piking the hips up', 'Feet too narrow'],
    modification: 'Plank from your knees.',
    motion:
      'In a high plank with feet slightly wide and a dumbbell on the floor just outside her left hand. She reaches her right hand under her body to grab the dumbbell and drags it across to the right side, returns her hand to plank, then drags it back with the left hand, keeping hips level.',
  }),
  ex({
    id: 'woodchop',
    name: 'Standing Woodchop',
    targetMuscles: ['Obliques', 'Core', 'Shoulders'],
    equipment: 'one-dumbbell',
    heavyWeightLb: [12, 20],
    perSide: true,
    cues: [
      'Start with the dumbbell high over one shoulder',
      'Chop diagonally down across to the opposite knee',
      'Pivot your back foot. Rotate from your core.',
    ],
    mistakes: ['Rounding the back at the bottom', 'Moving only the arms', 'Twisting the knee without pivoting'],
    modification: 'Use a lighter dumbbell and a smaller range.',
    motion:
      'Standing with feet shoulder-width, she holds one dumbbell with both hands above her right shoulder. She rotates and chops the dumbbell diagonally down across her body toward the outside of her left knee, bending her knees and pivoting her right foot, then lifts it back up to the start.',
  }),
  ex({
    id: 'toe-reach',
    name: 'Weighted Toe Reach',
    targetMuscles: ['Abs'],
    equipment: 'one-dumbbell',
    heavyWeightLb: [12, 15],
    cues: [
      'Legs straight up toward the ceiling',
      'Reach the dumbbell toward your toes',
      'Lift your shoulder blades, lower slowly',
    ],
    mistakes: ['Swinging the legs', 'Pulling with the neck', 'Legs drifting down'],
    modification: 'Bend your knees, or go without weight.',
    motion:
      'Lying on her back with both legs extended straight up toward the ceiling, holding one dumbbell with both hands above her chest. She curls her shoulders off the floor and reaches the dumbbell up toward her toes, then lowers her shoulders back down.',
  }),
  ex({
    id: 'bicycle-crunch',
    name: 'Bicycle Crunch',
    targetMuscles: ['Obliques', 'Abs'],
    equipment: 'bodyweight',
    cues: [
      'Hands lightly behind your head',
      'Rotate your shoulder toward the opposite knee',
      'Extend the other leg long, slow and controlled',
    ],
    mistakes: ['Pulling on the neck', 'Pedaling too fast', 'Only moving the elbows'],
    modification: 'Keep the extended leg higher, or feet down.',
    motion:
      'Lying on her back with hands lightly behind her head and shoulders lifted, legs raised. She rotates her right shoulder toward her left knee as she extends her right leg long, then switches sides in a slow pedaling motion.',
  }),
  ex({
    id: 'side-plank',
    name: 'Side Plank',
    targetMuscles: ['Obliques', 'Core', 'Shoulders'],
    equipment: 'bodyweight',
    perSide: true,
    cues: [
      'Elbow directly under your shoulder',
      'Lift your hips into a straight line',
      'Top hand on hip or reaching up',
    ],
    mistakes: ['Hips sagging', 'Elbow too far from the shoulder', 'Rolling the chest toward the floor'],
    modification: 'Bottom knee down.',
    motion:
      'Lying on her left side propped on her left forearm with the elbow under her shoulder and legs stacked. She lifts her hips so her body forms a straight line from head to feet and holds, right hand on her hip, breathing steadily.',
  }),

  // ─── Full body ───────────────────────────────────────────────────────
  ex({
    id: 'thruster',
    name: 'Squat to Press (Thruster)',
    targetMuscles: ['Quads', 'Glutes', 'Shoulders'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [15, 25],
    cues: [
      'Dumbbells at shoulders, squat down',
      'Drive up and press overhead in one motion',
      'Lower to your shoulders as you sit into the next squat',
    ],
    mistakes: ['Pressing before your legs finish driving', 'Knees caving', 'Arching the back overhead'],
    modification: 'Separate the squat and the press.',
    motion:
      'Standing with feet shoulder-width, holding dumbbells at her shoulders with palms facing each other. She squats down with chest tall, then drives up powerfully and uses that momentum to press both dumbbells straight overhead, then lowers them back to her shoulders as she sits into the next squat.',
  }),
  ex({
    id: 'clean-and-press',
    name: 'Clean and Press',
    targetMuscles: ['Glutes', 'Hamstrings', 'Shoulders', 'Upper back'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [15, 20],
    cues: [
      'Hinge with the dumbbells at your knees',
      'Snap your hips and pull the weights to your shoulders',
      'Press overhead, then lower in reverse',
    ],
    mistakes: ['Curling the weights up with the arms', 'Rounding the back', 'Rushing the lowering phase'],
    modification: 'Deadlift, then curl to your shoulders, then press.',
    motion:
      'Standing with dumbbells in front of her thighs, she hinges at the hips so the dumbbells lower to just above her knees, then extends her hips explosively and pulls the dumbbells up, rotating her elbows under to catch them at her shoulders. She then presses both dumbbells overhead, lowers them back to her shoulders, and returns them to her thighs.',
  }),
  ex({
    id: 'dumbbell-swing',
    name: 'Dumbbell Swing',
    targetMuscles: ['Glutes', 'Hamstrings', 'Core'],
    equipment: 'one-dumbbell',
    heavyWeightLb: [20, 30],
    cues: [
      'Hold one end of the dumbbell with both hands',
      'Hinge and let it swing back between your legs',
      'Snap your hips forward. Arms just guide it to chest height.',
    ],
    mistakes: ['Squatting instead of hinging', 'Lifting with the arms', 'Leaning back at the top'],
    modification: 'Do a Romanian deadlift at a steady pace instead.',
    motion:
      'Standing with feet slightly wider than shoulder-width, she holds one dumbbell vertically by the top end with both hands. She hinges her hips back so the dumbbell swings between her legs, then snaps her hips forward to stand tall, letting the dumbbell float up to chest height with straight arms, then lets it swing back into the next hinge.',
  }),
  ex({
    id: 'farmer-march',
    name: 'Farmer March',
    targetMuscles: ['Core', 'Grip', 'Hip flexors'],
    equipment: 'two-dumbbells',
    heavyWeightLb: [20, 30],
    cues: [
      'Stand tall, dumbbells at your sides',
      'Lift one knee to hip height, then switch',
      'Shoulders down, core braced, no leaning',
    ],
    mistakes: ['Leaning side to side', 'Shrugging the shoulders', 'Rushing the march'],
    modification: 'Lift the knees lower, or march without weight.',
    motion:
      'Standing tall with a dumbbell in each hand at her sides, shoulders down and core braced. She slowly lifts her right knee to hip height, lowers it, then lifts her left knee, marching in place with an upright torso.',
  }),
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise {
  const e = EXERCISE_BY_ID[id];
  if (!e) throw new Error(`Unknown exercise id: ${id}`);
  return e;
}
