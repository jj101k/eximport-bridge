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
        /** @type {?((namespace: {[symbol: string]: *}) => *)[]} */
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
    importer(f) {
        if(this.importers) {
            this.importers.push(f)
        } else {
            f(this.ns)
        }
    }
}

module.exports = EximportBridge