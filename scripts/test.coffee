Runner = require('../tests/runner')
runner = new Runner(true)

require('../tests/ts_test')(runner)
runner.report()
