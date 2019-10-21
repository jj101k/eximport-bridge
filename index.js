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
        /**
         * @type {?boolean}
         */
        this.state = null
        this.promise = new Promise(
            /**
             * @param {exported_namespace} ns
             */
            resolve => this.commit = ns => {
                this.state = true
                Object.assign(this.ns, ns)
                resolve(this.ns)
            }
        )
        this.ns = new EximportBridgeNamespace(this)
    }
    /**
     *
     * @param {EximportBridge} required
     * @param {?*} map
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
     * @param {(ns: exported_namespace) => *} onfulfilled
     * @param {?(reason?: *) => *} onrejected
     */
    then(onfulfilled, onrejected = null) {
        if(this.state !== null) {
            if(this.state) {
                return Promise.resolve(onfulfilled(this.ns))
            } else if(onrejected) {
                return Promise.resolve(onrejected())
            } else {
                return this
            }
        } else {
            return this.promise.then(onfulfilled, onrejected)
        }
    }
}

module.exports = EximportBridge