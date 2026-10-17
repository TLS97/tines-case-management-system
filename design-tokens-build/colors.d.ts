/* @deprecated: This file will be removed in a future release. Use types.d.ts instead */
/* build: v1.23.0 */
import type {} from '@digdir/designsystemet-types';

// Augment types based on theme
declare module '@digdir/designsystemet-types' {
  export interface ColorDefinitions {
    accent: never;
    'htil-hovedfarge': never;
    'htil-sekundaerfarge': never;
    neutral: never;
  }
  export interface SeverityColorDefinitions {
    info: never;
    success: never;
    warning: never;
    danger: never;
  }
}
