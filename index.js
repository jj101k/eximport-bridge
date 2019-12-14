/**
 * @typedef {{[symbol: string]: *}} exported_namespace
 */
/**
 * @typedef {(namespace: exported_namespace) => *} importer
 */

class EximportBridgeNamespace {
    /**
     * Builds a namespace prepared to export the given names (where `null`
     * exposes that an `export * from...` is present)
     *
     * @param {EximportBridge} bridge
     * @param {(?string)[]} names
     */
    constructor(bridge, names) {
        Object.defineProperty(
            this,
            "_bridge",
            {
                configurable: false,
                enumerable: false,
                value: bridge,
                writable: false,
            }
        )
        /**
         * @type {number} If nonzero, the module contains an `export * from ...`
         *  which means its exports aren't known until all such lines are hit.
         */
        let export_stars = 0
        Object.defineProperty(
            this,
            "_exportStars",
            {
                configurable: false,
                enumerable: false,
                get: () => export_stars,
            }
        )

        /**
         * @type {{[name: string]: *}}
         */
        const stored_values = {}
        for(const n of names) {
            if(n === null) {
                export_stars++
            } else {
                Object.defineProperty(
                    this,
                    n,
                    {
                        get: () => {
                            if(n in stored_values) {
                                return stored_values[n]
                            }
                            let g
                            do {
                                g = this._bridge.generator.next()
                                if(n in stored_values) {
                                    return stored_values[n]
                                }
                            } while(!g.done)
                            return undefined
                        },
                        set: v => {
                            stored_values[n] = v
                        },
                        enumerable: true,
                    }
                )
            }
        }
    }
}
class EximportBridge {
    /**
     * This returns a bridge prepared to export the given names (where `null`
     * exposes that an `export * from...` is present)
     *
     * @param {(?string)[]} names
     * @returns {EximportBridge}
     */
    static prepareBridge(names) {
        return new EximportBridge(names)
    }
    /**
     * Builds a bridge prepared to export the given names (where `null` exposes
     * that an `export * from...` is present)
     *
     * @param {(?string)[]} names
     */
    constructor(names) {
        this.ns = new EximportBridgeNamespace(this, names)
        this.exportStarsSeen = 0
    }
    /**
     * This is to be run at the end of an exporting file, to pick up any symbols
     * which would not be exported inline.
     *
     * This must run in the context of the source code so that possible
     * reassignment works consistently.
     *
     * @param {exported_namespace} ns
     */
    commit(ns) {
        Object.assign(this.ns, ns)
    }
     /**
     * This is the harness that runs the code on the exported module.
     *
     * In most cases, this will just run to the first injected `yield`, but if
     * an `export * from ...` is present it will run to that line.
     *
     * After running, all the export names, if not necessarily the values, will
     * be known to the bridge.
     *
     * It's expected that the inner code will `yield` immediately after every
     * symbol it exports, so that cyclic imports can work
     *
     * @param {() => Generator} f
     */
    execute(f) {
        this.generator = f()
        if(this.ns._exportStars > this.exportStarsSeen) {
            let g
            do {
                g = this.generator.next()
                if(this.ns._exportStars <= this.exportStarsSeen) break
            } while(!g.done)
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
            for(const [l, r] of Object.entries(map)) {
                this.ns[l] = required.ns[r]
            }
        } else {
            this.exportStarsSeen++
            Object.assign(
                this.ns,
                required.ns,
                {
                    default: this.ns.default
                }
            )
        }
    }
    /**
     * This is callable on the importing side to explicitly finish exporting the
     * file. Until this is called, all symbols have been loaded on demand, which
     * could cause some surprising behaviour if you're expecting some code after
     * the last imported symbol to run.
     */
    finish() {
        let g
        do {
            g = this.generator.next()
        } while(!g.done)
    }
    /**
     * This returns a bespoke export object for the importing file, binding the
     * local names that it wants to the exported names.
     *
     * This is in effect a customised subview of the exported namespace.
     *
     * @param {{[local: string]: string}} import_to_export
     */
    named(import_to_export) {
        const subview = {}
        for(const [local, remote] of Object.entries(import_to_export)) {
            Object.defineProperty(
                subview,
                local,
                {
                    get: () => this.ns[remote]
                }
            )
        }
        return subview
    }
}

module.exports = EximportBridge