#import <Capacitor/Capacitor.h>

CAP_PLUGIN(FilesPlugin, "Files",
    CAP_PLUGIN_METHOD(openFile, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(saveFile, CAPPluginReturnPromise);
)
