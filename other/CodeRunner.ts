import ivm from "isolated-vm";

export class CodeRunner {
  private memoryLimitMb = 64;
  private timeLimitMs = 75;
  private heapUsageRecycleThreshold = 0.75;
  private isolate: ivm.Isolate;

  constructor() {
    this.isolate = new ivm.Isolate({ memoryLimit: this.memoryLimitMb });
  }

  dispose() {
    this.isolate.dispose();
  }

  async runCode(code: string) {
    if (this.isolate.isDisposed) {
      throw new Error("CodeRunner was disposed, create a new instance to run code");
    }

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

  needsRecycle() {
    if (this.isolate.isDisposed) {
      return true;
    }

    const heapStats = this.isolate.getHeapStatisticsSync();
    const usedBytes = heapStats.used_heap_size + heapStats.externally_allocated_size;
    return usedBytes > this.memoryLimitMb * 1024 * 1024 * this.heapUsageRecycleThreshold;
  }

  recycle() {
    if (!this.isolate.isDisposed) {
      this.isolate.dispose();
    }
    this.isolate = new ivm.Isolate({ memoryLimit: this.memoryLimitMb });
  }
}
