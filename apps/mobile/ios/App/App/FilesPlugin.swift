import Capacitor
import UIKit
import MobileCoreServices
import UniformTypeIdentifiers
import Foundation
import JavaScriptCore

@objc(FilesPlugin)
public class FilesPlugin: CAPPlugin, UIDocumentPickerDelegate, UINavigationControllerDelegate {
    private var delegate: UIDocumentPickerDelegate? = nil

    @objc func openFile(_ call: CAPPluginCall) {
        guard let viewController = self.bridge?.viewController else {
            return
        }
        let types = [UTType.data]

        DispatchQueue.main.async {
            let documentPickerController = UIDocumentPickerViewController(
                forOpeningContentTypes: types
            )

            self.delegate = OpenFileDelegate(call);
            documentPickerController.delegate = self.delegate;

            viewController.present(documentPickerController, animated: true, completion: nil)
        }
    }

    @objc func saveFile(_ call: CAPPluginCall) {
        guard let dataBytes = call.getArray("data")?.map({ value in
            (value as! NSNumber).uint8Value
        })
        else {
            call.reject("Couldn't convert data to UTF")
            return
        }
        let data = Data(bytes: dataBytes, count: dataBytes.count)
        guard let url = getPathFromCall(call) else {
            showSaveFilePicker(call, data);
            return;
        }

        let error: NSErrorPointer = nil
        let coordinator = NSFileCoordinator(filePresenter: nil)
        coordinator.coordinate(writingItemAt: url, error: error) { urlToWrite in
            do {
                try data.write(to: urlToWrite)
                call.resolve(FileMetadata(url))
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    private func getPathFromCall(_ call: CAPPluginCall) -> URL? {
        guard let encodedBookmarkData = call.getString("path") else {
            return nil
        }
        guard let bookmarkData = Data(base64Encoded: encodedBookmarkData) else {
            return nil
        }
        do {
            var bookmarkDataIsStale = false
            let url = try URL(resolvingBookmarkData: bookmarkData, bookmarkDataIsStale: &bookmarkDataIsStale)
            if bookmarkDataIsStale {
                return nil
            }
            return url
        } catch {
            return nil
        }
    }

    private func showSaveFilePicker(_ call: CAPPluginCall, _ data: Data) {
        guard let viewController = self.bridge?.viewController else {
            return
        }
        let fileManager = FileManager.default

        let fileName = call.getString("defaultFileName")!

        DispatchQueue.main.async {
            let documentPickerController = UIDocumentPickerViewController(
                forOpeningContentTypes: [.folder])

            self.delegate = SaveFileDelegate(call, fileName, data);
            documentPickerController.delegate = self.delegate;

            viewController.present(documentPickerController, animated: true, completion: nil)
        }
    }
}

private func FileMetadata(_ path: URL) -> [String: Any] {
    let metadata = ["name": path.lastPathComponent]
    do {
        return metadata
            .merging([
                         "path": try path.bookmarkData(
                                 options: .minimalBookmark,
                                 includingResourceValuesForKeys: nil,
                                 relativeTo: nil
                             )
                             .base64EncodedString()
                     ]
            ) { (current, _) in
                current
            }
    } catch {
        return metadata
    }
}

private func PlatformFile(_ path: URL, _ data: [UInt8]) -> [String: Any] {
    FileMetadata(path).merging(["data": data]) { (current, _) in
        current
    }
}

private class OpenFileDelegate: NSObject, UIDocumentPickerDelegate {
    private let call: CAPPluginCall;

    init(_ call: CAPPluginCall) {
        self.call = call;
    }

    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let filePath = urls.first else {
            return
        }
        if (filePath.startAccessingSecurityScopedResource()) {
            let error: NSErrorPointer = nil
            let coordinator = NSFileCoordinator(filePresenter: nil)
            coordinator.coordinate(readingItemAt: filePath, error: error) { url in
                do {
                    let data = [UInt8](try Data(contentsOf: url))
                    call.resolve(PlatformFile(filePath, data));
                } catch {
                    call.reject("Unable to read the selected file", nil, error);
                }
            }
            if (error != nil) {
                call.reject("Unable to read the selected file", nil, error?.pointee)
            }
        } else {
            call.reject("Unable to read the selected file")
        }
    }

    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        self.call.resolve();
    }
}

private class SaveFileDelegate: NSObject, UIDocumentPickerDelegate {
    private let call: CAPPluginCall;
    private let fileName: String;
    private let data: Data;

    init(_ call: CAPPluginCall, _ fileName: String, _ data: Data) {
        self.call = call;
        self.fileName = fileName;
        self.data = data;
    }

    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let chosenDirectory = urls.first else {
            return
        }

        if (!chosenDirectory.startAccessingSecurityScopedResource() || !chosenDirectory.hasDirectoryPath) {
            return call.reject("Unable to save the file - bad directory");
        }
        let userSelectedFilePath = URL(string: self.fileName, relativeTo: chosenDirectory)!

        let filePath: URL
        if (FileManager.default.fileExists(atPath: userSelectedFilePath.path)) {
            let fileName1 = userSelectedFilePath.lastPathComponent
            let newFileName = "\(self.getCurrentShortDateTime())-\(fileName1)"

            filePath = userSelectedFilePath.deletingLastPathComponent().appendingPathComponent(newFileName)
        } else {
            filePath = userSelectedFilePath
        }

        if (!FileManager.default.createFile(atPath: filePath.path, contents: self.data)) {
            self.call.reject("Unable to save the file - bad file " + filePath.absoluteString)
            return
        }

        call.resolve(FileMetadata(filePath))
    }

    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        self.call.resolve();
    }

    private func getCurrentShortDateTime() -> String {
        return Date().ISO8601Format()
    }
}

extension UTType {
    static let LyricsFileFormat = UTType(exportedAs: "com.wardellbagby.lyrics")
}
