declare module "react-test-renderer" {
  import { ReactElement } from "react";

  interface TestRendererOptions {
    createNodeMock?: (element: ReactElement) => any;
  }

  interface TestRendererInstance {
    root: TestInstance;
    update(element: ReactElement): void;
    unmount(): void;
    toJSON(): any;
    toTree(): any;
  }

  interface TestInstance {
    instance: any;
    type: any;
    props: any;
    parent: TestInstance | null;
    children: TestInstance[] | null;
    find(predicate: (instance: TestInstance) => boolean): TestInstance;
    findByType(type: any): TestInstance;
    findByProps(props: any): TestInstance;
    findAll(predicate: (instance: TestInstance) => boolean, options?: { deep?: boolean }): TestInstance[];
    findAllByType(type: any, options?: { deep?: boolean }): TestInstance[];
    findAllByProps(props: any, options?: { deep?: boolean }): TestInstance[];
  }

  export function create(element: ReactElement, options?: TestRendererOptions): TestRendererInstance;
  export function act(callback: () => void | Promise<void>): void;
}
