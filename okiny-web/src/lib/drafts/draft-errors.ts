export class DraftLimitError extends Error {
  constructor(message = "Draft limit reached") {
    super(message);
    this.name = "DraftLimitError";
  }
}

