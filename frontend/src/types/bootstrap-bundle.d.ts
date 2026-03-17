declare module "bootstrap/dist/js/bootstrap.bundle.min.js" {
  export class Popover {
    constructor(element: Element, options?: Record<string, unknown>);
    dispose?: () => void;
  }
}
