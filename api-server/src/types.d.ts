import 'react';
declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // Isso força o VS Code a parar de reclamar do React
  }
}