const bridge_class = require("./index")
const assert = require("assert")
assert.ok(bridge_class, "Class exists")
const bridge = bridge_class.bridge
assert.ok(bridge, "Convenience property works")