import type { Workout } from '../types';
import { ABS } from './abs';
import { ARMS } from './arms';
import { BOOTY } from './booty';
import { FULL_BODY } from './fullBody';
import { LEGS } from './legs';
import { LOWER } from './lower';
import { UPPER } from './upper';

/** Every workout in the library. To add a category file, import it here. */
export const WORKOUTS: Workout[] = [...ARMS, ...LEGS, ...UPPER, ...LOWER, ...BOOTY, ...ABS, ...FULL_BODY];
