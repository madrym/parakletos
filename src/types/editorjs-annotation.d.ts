declare module 'editorjs-annotation' {
    import { InlineTool } from '@editorjs/editorjs';
    
    export default class Annotation implements InlineTool {
      constructor({api}: any);
      static get isInline(): boolean;
      static get title(): string;
      render(): HTMLElement;
      surround(range: Range): void;
      checkState(selection: Selection): boolean;
    }
  }