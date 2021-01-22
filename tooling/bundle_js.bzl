"""
Contains rules for bundling Javascript code.
"""

load("@build_bazel_rules_nodejs//:index.bzl", "npm_package_bin")

def bundle_js(name, outs, entries, target, data, config = None, visibility = None, webpack_args = []):
    """Runs Webpack for the given entries.

    Args:
        name: A unique name for this rule.
        outs: The expected output for this rule.
        entries: The entries that will be passed into Webpack to bundle.
        target: The Webpack target to use.
        data: Data necessary for the Webpack bundling process.
        config: An optional Webpack config file to provide.
        visibility: The visibility of this rule.
        webpack_args: Extra args that should be passed into Webpack.
    """
    entry_args = [["--entry", x] for x in entries]
    config_args = [x for x in ["--config", config] for y in [config] if y != None]
    output_args = None
    env_args = select({
        "//:test_build": ["--define", 'process.env.NODE_ENV="ui-testing"'],
        "//conditions:default": [],
    })
    if len(outs) > 1:
        output_args = ["--output-path", "$(@D)"]
    else:
        output_args = ["--output", "$@"]
    args = [
        "--target",
        target,
        "--config",
        config,
        "--devtool",
        "source-map",
        "--mode",
    ] + select({
        "//:release_build": ["production"],
        "//conditions:default": ["development"],
    }) + [y for x in entry_args for y in x] + output_args + webpack_args + config_args + env_args

    npm_package_bin(
        name = name,
        outs = outs,
        data = data,
        args = args,
        tool = "@npm//webpack/bin:webpack",
        visibility = visibility,
    )
