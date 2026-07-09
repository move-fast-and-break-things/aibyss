import ivm from "isolated-vm";

const ISOLATE_RECREATE_COOLDOWN_MS = 60_000;

export class CodeRunner {
  private memoryLimitMb = 64;
  private timeLimitMs = 75;
  private isolate: ivm.Isolate;
  private disposedManually = false;
  private lastIsolateRecreateTs = 0;

  constructor() {
    this.isolate = new ivm.Isolate({ memoryLimit: this.memoryLimitMb });
  }

  dispose() {
    this.disposedManually = true;
    this.isolate.dispose();
  }

  async runCode(code: string) {
    if (this.disposedManually) {
      throw new Error("CodeRunner was disposed, create a new instance to run code");
    }

    this.recreateIsolateIfDisposed();

    let context: ivm.Context | undefined;
    try {
      context = await this.isolate.createContext();

      // https://github.com/laverdet/isolated-vm/blob/main/README.md#examples
      // Get a Reference{} to the global object within the context.
      const jail = context.global;
      // This makes the global object available in the context as `global`. We use `derefInto()` here
      // because otherwise `global` would actually be a Reference{} object in the new isolate.
      await jail.set("global", jail.derefInto());

      const result = await context.eval(code, { timeout: this.timeLimitMs });
      return result;
    } finally {
      // always release the context to avoid memory leaks
      context?.release();
    }
  }

  private recreateIsolateIfDisposed() {
    if (!this.isolate.isDisposed) {
      return;
    }

    if (Date.now() - this.lastIsolateRecreateTs < ISOLATE_RECREATE_COOLDOWN_MS) {
      throw new Error("the isolate is disposed and is waiting for the recreate cooldown");
    }

    this.isolate = new ivm.Isolate({ memoryLimit: this.memoryLimitMb });
    this.lastIsolateRecreateTs = Date.now();
  }
}
