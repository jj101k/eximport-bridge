# 2.0.0

- Complete rewrite to use a generator instead of promises, dropping `.then()`
  (no longer needed) and `.importer()` (previously deprecated).

# 1.1.1

- Forward compat: calling `.then()` without a reject handler will now return a
  rejected native `Promise` rather than the bridge object
- `.then()` arguments are now executable in the current context, so that it's
  possible to finish synchronously while using a `.then()` handler. Please note
  that as a result, if you were expecting the handler to be booted out to after
  the current execution finishes, it no longer will be.

# 1.1.0

- Forward compat: expose the bridge on the namespace. This lets the namespace
  itself go in module.exports without any reduction in functionality. Compat
  warning: if you actually want to name an export as `_bridge`, that's not going
  to work.

# 1.0.0

- Initial release