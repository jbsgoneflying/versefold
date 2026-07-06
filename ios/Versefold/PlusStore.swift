import Foundation
import StoreKit

/// Versefold Plus subscription (Phase 3 scaffolding, StoreKit 2).
///
/// Reading, highlights, notes, and cards are free forever; Plus raises AI
/// limits and unlocks multiple active studies. Products are defined in
/// `Versefold.storekit` for local testing and must be mirrored in App Store
/// Connect before release. NOTE (rights): enabling monetization triggers the
/// NIV/AMP commercial-license requirement — see docs/product/translation-rights.md.
@MainActor
final class PlusStore: ObservableObject {
    static let monthlyId = "app.versefold.plus.monthly"
    static let annualId = "app.versefold.plus.annual"

    @Published private(set) var products: [Product] = []
    @Published private(set) var isSubscribed = false

    private var updatesTask: Task<Void, Never>?

    init() {
        updatesTask = Task { [weak self] in
            for await update in Transaction.updates {
                if let transaction = try? update.payloadValue {
                    await transaction.finish()
                    await self?.refreshEntitlement()
                }
            }
        }
        Task {
            await loadProducts()
            await refreshEntitlement()
        }
    }

    deinit { updatesTask?.cancel() }

    func loadProducts() async {
        // Silently no-op until products exist in App Store Connect / storekit config.
        products = (try? await Product.products(for: [Self.monthlyId, Self.annualId])) ?? []
    }

    func purchase(_ product: Product) async {
        guard let result = try? await product.purchase() else { return }
        if case .success(let verification) = result, let transaction = try? verification.payloadValue {
            await transaction.finish()
            await refreshEntitlement()
        }
    }

    func restore() async {
        try? await AppStore.sync()
        await refreshEntitlement()
    }

    func refreshEntitlement() async {
        for await entitlement in Transaction.currentEntitlements {
            if let transaction = try? entitlement.payloadValue,
               transaction.productID == Self.monthlyId || transaction.productID == Self.annualId {
                isSubscribed = true
                return
            }
        }
        isSubscribed = false
    }
}
