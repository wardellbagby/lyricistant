## Table of Contents

1. [> **Getting Started** <](1-getting_started.md)
2. [How Platforms Work](2-how_platforms_work.md)
3. [How The Renderer Works](3-how_the_renderer_works.md)

# Getting Started with Lyricistant

So you want to potentially contribute to Lyricistant? I'm happy to hear that! Let's help get you started on your
journey!

## What you need to know

### The Platforms of Lyricistant

First, it's important to know that Lyricistant builds for Web, Electron, Android, and iOS. In code, these are referred
to as "platforms". Every platform includes a core set of common functionality (the common platform) and can also provide
platform-specific functionality that makes sense for that platform. For instance, Electron has special logic to handle
app updates, while other platforms don't need that logic and so don't include it.

Depending on the platform in question, platform code can run directly in the browser with access to the DOM (Android &
iOS), in Node (Electron), or in a Web Worker (Web when running in Chrome or Firefox). This is important as it means that
all the common functionality for platforms must be written in an entirely agnostic way. It must assume it doesn't have
access to the DOM or Node, and instead use pure ES6 functionality.

### The Lone Renderer

On the flip side is the renderer, written using React. The renderer is the code that the user actually ends up seeing.
It's the renderer's job to provide information on what the user has been doing to the current platform. Code here should
always be written in a way that it doesn't matter what platform its running on, it'll just work. However, it is allowed
to do browser and feature checks to work around visual or API quirks in different browsers.

The renderer **always** runs in a browser, so it has access to the DOM and can use DOM features as it likes. However,
due to it not knowing what platform is currently in use, it must always communicate with the platform using only data
that is JSON-serializable.

### Platform / Renderer communication

All communication between the platform and renderer uses what is _effectively_ an event emitter system. If you're not
familiar, what happens is that platform and renderer code are both given an object where they can both send and listen
to events from their counterpart.

An "event" is a channel (which can be thought of as a string key) and some optional JSON-serializable data.
JSON-serializable data means that primitives (strings, booleans, numbers), arrays of primitives, and objects with string
keys and primitive values are valid, but everything else is not.

For example, the renderer listens for events with the channel of `new-file-created` in order to know when the platform
has created a new file.

Platforms use a `RendererDelegate` to communicate with the renderer, and the renderer uses a `PlatformDelegate` to
communicate with the current platform. We'll get more in depth as to how these work in the
["How Platforms work"](2-how_platforms_work.md) and ["How the Renderer works"](3-how_the_renderer_works.md) pages.

---

### [Next, let's talk more about how platforms work!](2-how_platforms_work.md)
