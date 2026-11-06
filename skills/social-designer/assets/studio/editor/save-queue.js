// One write at a time; newer edits coalesce into the next snapshot.
export function createSaveQueue({ snapshot, write, onSaved, onConflict, onError }) {
  let task = null, requested = false;
  async function flush() {
    try {
      while (requested) {
        requested = false;
        const request = snapshot();
        if (!request) return true;
        const result = await write(request);
        if (result.conflict) { requested = false; onConflict(result, request); return false; }
        if (result.error) { requested = false; onError(new Error(result.error)); return false; }
        requested = onSaved(result, request) || requested;
      }
      return true;
    } catch (error) {
      requested = false;
      onError(error);
      return false;
    } finally { task = null; }
  }
  return () => {
    requested = true;
    if (!task) task = Promise.resolve().then(flush);
    return task;
  };
}

// A GET begun while clean must not adopt over edits/saves that happened while it waited.
export async function pollSavedProject({ state, read, adopt, onError, isHidden = () => false }) {
  if (state.dirty || state.conflict || isHidden()) return false;
  const generation = state.editGeneration, revision = state.revision;
  const unchanged = () => !state.dirty && !state.conflict && state.editGeneration === generation && state.revision === revision;
  try {
    const result = await read();
    if (!unchanged()) return false;
    if (result.revision !== state.revision) { adopt(result); return true; }
    return false;
  } catch (error) {
    if (unchanged()) onError(error);
    return false;
  }
}
