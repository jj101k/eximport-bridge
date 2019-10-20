# 1.1.0

- Forward compat: expose the bridge on the namespace. This lets the namespace
  itself go in module.exports without any reduction in functionality. Compat
  warning: if you actually want to name an export as `_bridge`, that's not going
  to work.

# 1.0.0

- Initial release