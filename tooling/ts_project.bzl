load("@npm//@bazel/typescript:index.bzl", _ts_project = "ts_project")

def ts_project(**kwargs):
    _ts_project(
        tsc = "//:tsc",
        tsconfig = "//:tsconfig.json",
        declaration = True,
        source_map = True,
        **kwargs
    )

def ts_script(**kwargs):
    _ts_project(
        tsc = "//:tsc",
        tsconfig = "//:script-tsconfig",
        **kwargs
    )
