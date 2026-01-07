declare module 'uuid' {
  export function v4(): string;
  export function v4(options: {
    random: ArrayLike<number>;
  }): string;
  export function v4(options: {
    rng: () => ArrayLike<number>;
  }): string;
  export function v4(options: {
    random?: ArrayLike<number>;
    rng?: () => ArrayLike<number>;
  }): string;
  export function v4(options?: {
    random?: ArrayLike<number>;
    rng?: () => ArrayLike<number>;
  }, buffer?: ArrayLike<number>, offset?: number): string;
  export namespace v4 {
    const NIL: string;
    function validate(uuid: string): boolean;
    function version(uuid: string): number;
    function parse(uuid: string, buffer?: ArrayLike<number>, offset?: number): ArrayLike<number>;
    function stringify(uuid: ArrayLike<number>, offset?: number): string;
  }
  export function v3(name: string | ArrayLike<number>, namespace: string | ArrayLike<number>): string;
  export function v3(name: string | ArrayLike<number>, namespace: string | ArrayLike<number>, buffer: ArrayLike<number>, offset?: number): string;
  export namespace v3 {
    const NIL: string;
    const DNS: string;
    const URL: string;
    function validate(uuid: string): boolean;
    function version(uuid: string): number;
    function parse(uuid: string, buffer?: ArrayLike<number>, offset?: number): ArrayLike<number>;
    function stringify(uuid: ArrayLike<number>, offset?: number): string;
  }
  export function v5(name: string | ArrayLike<number>, namespace: string | ArrayLike<number>): string;
  export function v5(name: string | ArrayLike<number>, namespace: string | ArrayLike<number>, buffer: ArrayLike<number>, offset?: number): string;
  export namespace v5 {
    const NIL: string;
    const DNS: string;
    const URL: string;
    function validate(uuid: string): boolean;
    function version(uuid: string): number;
    function parse(uuid: string, buffer?: ArrayLike<number>, offset?: number): ArrayLike<number>;
    function stringify(uuid: ArrayLike<number>, offset?: number): string;
  }
  export function validate(uuid: string): boolean;
  export function version(uuid: string): number;
  export function parse(uuid: string, buffer?: ArrayLike<number>, offset?: number): ArrayLike<number>;
  export function stringify(uuid: ArrayLike<number>, offset?: number): string;
  export const NIL: string;
  export const DNS: string;
  export const URL: string;
}