// Only the newest asynchronous load may mount or publish a stage.
export function createLatestLoad({ prepare, mount, publish }) {
  let generation = 0;
  return async (...args) => {
    const own = ++generation;
    const isCurrent = () => own === generation;
    const prepared = await prepare(...args);
    if (!isCurrent()) return null;
    const value = await mount(prepared, isCurrent);
    if (!isCurrent() || !value) return null;
    return publish(value);
  };
}
