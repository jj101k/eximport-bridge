/**
 * @typedef {(namespace: {[symbol: string]: *}) => *} importer
 */

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
        /** @type {?importer[]} */
        this.importers = []
        /**
         * @type {{[symbol: string]: *}}
         */
        this.ns = {}
    }
    /**
     *
     * @param {{[symbol: string]: *}} finished_exports
     */
    commit(finished_exports) {
        Object.assign(this.ns, finished_exports)
        for(const f of this.importers) {
            f(this.ns)
        }
        this.importers = null
    }
    /**
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
        if(this.importers) {
            this.importers.push(f)
        } else {
            f(this.ns)
        }
    }
}

module.exports = EximportBridge