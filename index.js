class EximportBridge extends Promise {
    /**
     * This is a convenience property so you can just do
     * `require("eximport-bridge").bridge` rather than `(const b =
     * require("eximport-bridge"); new b())`
     */
    static get bridge() {
        return new EximportBridge()
    }
    constructor(f) {
        if(f) {
            super(f)
        } else {
            let commit
            super(resolve => commit = resolve)
            this.commit = commit
            /**
             * @type {{[symbol: string]: *}}
             */
            this.ns = {}
        }
    }
    importer(f) {
        this.then(
            ns => {f(ns); return ns},
        )
    }
}

module.exports = EximportBridge