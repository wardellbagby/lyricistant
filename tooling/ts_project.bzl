"""
Contains rules for compiling Typescript code.
"""

load("@npm//@bazel/typescript:index.bzl", _ts_project = "ts_project")

def ts_project(**kwargs):
    _ts_project(
        tsc = "//:tsc",
        tsconfig = select({
            "//:test_build": "//:test-tsconfig",
            "//conditions:default": "//:tsconfig.json",
        }),
        declaration = True,
        **kwargs
    )

def ts_node_project(**kwargs):
    _ts_project(
        tsc = "//:tsc",
        tsconfig = "//:script-tsconfig",
        **kwargs
    )
