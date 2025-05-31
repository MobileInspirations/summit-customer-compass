
export class CancellationToken {
  private _cancelled = false;

  get isCancelled(): boolean {
    return this._cancelled;
  }

  cancel(): void {
    this._cancelled = true;
    console.log('Categorization cancellation requested');
  }

  throwIfCancelled(): void {
    if (this._cancelled) {
      throw new Error('Operation was cancelled');
    }
  }
}
