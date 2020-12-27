load("@build_bazel_rules_nodejs//:index.bzl", "npm_package_bin")

def bundle_js(name, outs, entries, target, data, config = None, visibility = None, webpack_args = []):
    entry_args = [["--entry", x] for x in entries]
    config_args = [x for x in ["--config", config] for y in [config] if y != None]
    output_args = None
    if len(outs) > 1:
        output_args = ["--output-path", "$(@D)"]
    else:
        output_args = ["--output", "$@"]
    args = [
        "--target",
        target,
        "--config",
        config,
        "--mode",
    ] + select({
        "//:release_build": ["production"],
        "//conditions:default": ["development"],
    }) + [y for x in entry_args for y in x] + output_args + webpack_args + config_args

    npm_package_bin(
        name = name,
        outs = outs,
        data = data,
        args = args,
        tool = "@npm//webpack/bin:webpack",
        visibility = visibility,
    )
