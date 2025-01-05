import UIKit
import Capacitor

class LyricistantViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        bridge?.registerPluginInstance(FilesPlugin())
    }
}
