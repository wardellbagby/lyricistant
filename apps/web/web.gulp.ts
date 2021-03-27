import { promises as fs } from "fs";
import path from "path";
import * as util from "util";
import { merge } from "webpack-merge";
import WebpackDevServer from "webpack-dev-server";
import { series } from "gulp";
import rendererWebpackConfig from "@lyricistant/renderer/webpack.config";
import defaultWebpackConfig from "@tooling/default.webpack.config";

import { getOutputDirectory as getOutDir, titleCase } from "@tooling/common-tasks.gulp";
import webpack, { Configuration } from "webpack";

type Mode = "development" | "production" | "test";

const getOutputDirectory = (mode: Mode) => getOutDir(mode, __dirname);

const clean = (mode: Mode) => {
  const curried = async () => {
    await fs.rmdir(getOutputDirectory(mode), { recursive: true });
  };
  curried.displayName = `clean${titleCase(mode)}Web`;
  return curried;
};

const createWebpackConfig = async (mode: Mode) => {
  let webpackMode: Configuration["mode"];
  if (mode === "test") {
    webpackMode = "production";
  } else {
    webpackMode = mode;
  }
  return merge<Configuration>(
    {
      mode: webpackMode,
      entry: ["./apps/web/main/index.ts"],
      output: {
        filename: "renderer.js",
        path: getOutputDirectory(mode)
      }
    },
    rendererWebpackConfig(),
    defaultWebpackConfig(mode)
  );
};

const copyWebHtmlFile = (mode: Mode) => {
  const curried = async () => {
    await fs.mkdir(getOutputDirectory(mode), { recursive: true });
    await fs.copyFile(
      'packages/renderer/main/index.html',
      path.resolve(getOutputDirectory(mode), 'index.html')
    );
  };
  curried.displayName = `copy${titleCase(mode)}WebHtmlFile`;
  return curried;
};

const runWebServer = async () => {
  const config = await createWebpackConfig("development");

  const server = new WebpackDevServer(webpack(config), {
    port: 8080,
    hot: true,
    contentBase: config.output.path,
  });
  return util.promisify(server.listen.bind(server, { port: 8080 }))();
};

const bundleWeb = (mode: Mode) => {
  const curried = async () => {
    const config = await createWebpackConfig(mode);
    return new Promise<undefined>((resolve, reject) => {
      webpack(config, (error, stats) => {
        if (error) {
          reject(error);
        }
        if (stats.hasErrors()) {
          reject(stats.toString());
        }
        resolve(undefined);
      });
    });
  };
  curried.displayName = `bundle${titleCase(mode)}Web`;
  return curried;
};

// const buildWebDeps = series(buildCommon, buildRenderer, buildCodeMirror);
const buildWebDeps = async () => true;

export const startWeb = series(
  buildWebDeps,
  clean('development'),
  copyWebHtmlFile('development'),
  runWebServer
);
export const buildWeb = series(
  buildWebDeps,
  clean("production"),
  copyWebHtmlFile("production"),
  bundleWeb("production")
);
export const buildTestWeb = series(
  buildWebDeps,
  clean('test'),
  copyWebHtmlFile('test'),
  bundleWeb('test')
);
