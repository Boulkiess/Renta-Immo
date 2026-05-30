import 'styled-components';
import type { darkTheme } from '../theme/themes.js';

declare module 'styled-components' {
  export interface DefaultTheme extends Omit<typeof darkTheme, ''> {}
}
