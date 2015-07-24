declare module __ {
}

interface UnderscoreObserveStatic {
    observe<T>(array: T[], event: string, callback: (new_item: T, old_item: T, item_index: number) => void): void;
    observe<T>(array: T[], callback: (new_array: T[], old_array: T[]) => void): void;
}

declare var __: UnderscoreObserveStatic;

declare module "underscore-observable-arrays" {
    export = __;
}
