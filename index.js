/**
 * @typedef {{[symbol: string]: *}} exported_namespace
 */
/**
 * @typedef {(namespace: exported_namespace) => *} importer
 */

class EximportBridgeNamespace {
    /**
     *
     * @param {EximportBridge} bridge
     */
    constructor(bridge) {
        Object.defineProperty(
            this,
            "_bridge",
            {
                "configurable": false,
                "enumerable": false,
                "value": bridge,
                "writable": false,
            }
        )
    }
}
class EximportBridge {
    /**
     * This is a convenience property so you can just do
     * `require("eximport-bridge").bridge` rather than `(const b =
     * require("eximport-bridge"); new b())`
     */
    static get bridge() {
        return new EximportBridge()
    }
    constructor() {
        this.ns = new EximportBridgeNamespace(this)
        /**
         * @type {((ns: EximportBridgeNamespace) => *)[]}
         */
        this.onfulfilled = []
        /**
         * @type {((e: *) => *)[]}
         */
        this.onrejected = []
        /**
         * @type {?boolean}
         */
        this.state = null
    }
    /**
     * This is to be run at the end of an exporting file, to pick up any symbols
     * which would not be exported inline.
     *
     * @param {exported_namespace} ns
     */
    commit(ns) {
        this.state = true
        Object.assign(this.ns, ns)
        for(const h of this.onfulfilled) {
            h(this.ns)
        }
    }
    /**
     * This adds another eximport bridge's export to this - ie, supports `export
     * ... from "..."` syntax.
     *
     * @param {EximportBridge} required
     * @param {?*} map A map of names on this bridge to names on the supplied bridge
     */
    exportFrom(required, map = null) {
        if(map) {
            required.then(
                ns => {
                    for(const [l, r] of Object.entries(map)) {
                        this.ns[l] = ns[r]
                    }
                }
            )
        } else {
            required.then(
                ns => Object.assign(
                    this.ns,
                    ns,
                    {
                        default: this.ns.default
                    }
                )
            )
        }
    }
    /**
     * @deprecated
     *
     * This adds an importer hook. Usually this would be added implicitly via
     * eximport, typically in a pattern like:
     *
     * ```
     *  var Foo = undefined;
     *  require("foo").importer(ns => Foo = ns.Foo)
     * ```
     *
     * Once the file has been completely loaded, this will run immediately;
     * before that, it will queue up an importer instead.
     *
     * @param {importer} f
     */
    importer(f) {
        return this.then(ns => f(ns))
    }
    /**
     * This works like Promise.prototype.then() except that the function will be
     * evaluated before return if the promise is already resolved. This allows
     * you to get immediate evaluation in contexts which support it.
     *
     * This is _not_ a Promise. This doesn't act like a promise on `then()`. But
     * it will return a Promise at that time.
     *
     * The key difference is that this will run the handler in the current
     * execution context, immediately if possible, whereas this returns a true
     * Promise which will never execute a `.then()` itself before the current
     * execution context ends.
     *
     * @param {(ns: exported_namespace) => *} onfulfilled
     * @param {?(reason?: *) => *} onrejected
     * @returns {Promise}
     */
    then(onfulfilled, onrejected = null) {
        if(this.state !== null) {
            if(this.state) {
                return Promise.resolve(onfulfilled(this.ns))
            } else if(onrejected) {
                return Promise.resolve(onrejected())
            } else {
                return Promise.reject(null)
            }
        } else {
            return new Promise((resolve, reject) => {
                this.onfulfilled.push(ns => resolve(onfulfilled(ns)))
                this.onrejected.push(e => reject(onrejected ? onrejected(e) : e))
            })
        }
    }
}

module.exports = EximportBridge