# eximport-bridge

This module provides the import-require bridge for eximport. It's not expected
to be useful on its own.

# BUGS

Code after the last export is not executed except when doing a side-effect-only
import or importing a symbol which had to be deferred to the end.