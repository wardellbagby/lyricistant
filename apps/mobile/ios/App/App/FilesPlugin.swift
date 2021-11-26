import Capacitor
import UIKit
import MobileCoreServices
import UniformTypeIdentifiers
import Foundation
import JavaScriptCore

@objc(FilesPlugin)
public class FilesPlugin: CAPPlugin, UIDocumentPickerDelegate,UINavigationControllerDelegate {
    private var delegate: UIDocumentPickerDelegate? = nil
    
    @objc func openFile(_ call: CAPPluginCall) {
        guard let viewController = self.bridge?.viewController else { return }
        let types = UTType.types(tag: "txt",
                                 tagClass: UTTagClass.filenameExtension,
                                 conformingTo: nil) + [UTType.LyricsFileFormat]
        
        DispatchQueue.main.async {
            let documentPickerController = UIDocumentPickerViewController(
                forOpeningContentTypes: types)
            
            self.delegate = OpenFileDelegate(call);
            documentPickerController.delegate = self.delegate;
            
            viewController.present(documentPickerController, animated: true, completion: nil)
        }
    }
    
    @objc func saveFile(_ call: CAPPluginCall) {
        guard let array = call.getArray("data")?.map({ value in
            (value as! NSNumber).uint8Value
        }) else {
            call.reject("Couldn't convert data to UTF")
            return
        }
        let data = Data(bytes: array, count: array.count)
        guard let path = call.getString("path") else {
            showSaveFilePicker(call, data);
            return;
        }
        
        do {
            let url = URL(string: path)!
            try data.write(to: url)
            call.resolve(FileMetadata(url))
        } catch {
            call.reject(error.localizedDescription)
        }
    }
    
    private func showSaveFilePicker(_ call: CAPPluginCall, _ data: Data) {
        guard let viewController = self.bridge?.viewController else { return }
        let fileManager = FileManager.default
        
        do {
            let path = fileManager.temporaryDirectory.appendingPathComponent("Lyrics.lyrics")
            try data.write(to: path)
            
            DispatchQueue.main.async {
                let documentPickerController = UIDocumentPickerViewController(
                    forExporting: [path])
                
                self.delegate = SaveFileDelegate(call);
                documentPickerController.delegate = self.delegate;
                
                viewController.present(documentPickerController, animated: true, completion: nil)
            }
        } catch {
            call.reject("Unable to create temp file.")
            return
        }
    }
}

private func FileMetadata(_ path: URL) -> [String: Any] {
    return ["path": path.absoluteString, "name": path.lastPathComponent];
}

private func PlatformFile(_ path: URL, _ data: [UInt8]) -> [String: Any] {
    return FileMetadata(path).merging(["data": data]) { (current, _) in current }
}

private class OpenFileDelegate : NSObject, UIDocumentPickerDelegate {
    private let call: CAPPluginCall;
    
    init(_ call: CAPPluginCall) {
        self.call = call;
    }
    
    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let filePath = urls.first else {
            return
        }
        do {
            let data = [UInt8](try Data(contentsOf: filePath))
            call.resolve(PlatformFile(filePath, data));
        } catch {
            call.reject("Unable to read the selected file");
        }
    }
    
    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        self.call.resolve();
    }
}

private class SaveFileDelegate : NSObject, UIDocumentPickerDelegate {
    private let call: CAPPluginCall;
    
    init(_ call: CAPPluginCall) {
        self.call = call;
    }
    
    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let filePath = urls.first else {
            return
        }
        call.resolve(["path": filePath.absoluteString, "name": filePath.lastPathComponent]);
    }
    
    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        self.call.resolve();
    }
}

extension UTType {
    static let LyricsFileFormat = UTType(exportedAs: "com.wardellbagby.lyrics")
}
