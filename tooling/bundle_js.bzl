"""
Contains rules for bundling Javascript code.
"""

load("@build_bazel_rules_nodejs//:index.bzl", "npm_package_bin")

def bundle_js(name, outs, entries, target, data, config = None, visibility = None, bundle_name = None, webpack_args = []):
    """Runs Webpack for the given entries.

    Args:
        name: A unique name for this rule.
        outs: The expected output for this rule.
        entries: The entries that will be passed into Webpack to bundle.
        target: The Webpack target to use.
        data: Data necessary for the Webpack bundling process.
        config: An optional Webpack config file to provide.
        visibility: The visibility of this rule.
        bundle_name: The name of the resulting bundle from Webpack.
        webpack_args: Extra args that should be passed into Webpack.
    """
    entry_args = [["--entry", x] for x in entries]
    configs = [x for x in ["$(execpath //:tooling/default.webpack.config.js)", config] if x != None]
    configs = [["--config", x] for x in configs]
    config_args = [x for x in ["--merge"] if len(configs) > 1] + [x for y in configs for x in y]
    output_args = ["--output-path", "$(@D)"]
    webpack_args = webpack_args + select({
        "//:test_build": ["--env", "isUiTest"],
        "//conditions:default": [],
    })
    if bundle_name != None:
        webpack_args = webpack_args + ["--env", "outputFile=" + bundle_name]
    outs_with_sourcemaps = outs + [out + ".map" for out in outs if out.endswith(".js")]
    args = [
        "bundle",
        "--target",
        target,
        "--mode",
    ] + select({
        "//:release_build": ["production"],
        "//conditions:default": ["development"],
    }) + [y for x in entry_args for y in x] + output_args + webpack_args + config_args

    npm_package_bin(
        name = name,
        outs = outs_with_sourcemaps,
        data = data + ["//:tooling/default.webpack.config.js", "//:package-lock.json", "@npm//source-map-loader"],
        args = args,
        tool = "@npm//webpack-cli/bin:webpack-cli",
        link_workspace_root = True,
        visibility = visibility,
    )
