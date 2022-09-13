export class Storage {
  private storage: Map<string, any>;

  constructor() {
    this.storage = new Map();
  }
  set(key, value) {
    console.log('set', key, value);
    this.storage.set(key, value);
  }
  get(key) {
    const value = this.storage.get(key) ?? {};
    console.log('get', key, value);
    return value;
  }
  removeItem(key) {
    this.storage.delete(key);
  }
  clear() {
    this.storage.clear();
  }
}
