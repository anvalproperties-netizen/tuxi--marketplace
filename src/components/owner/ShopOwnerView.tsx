import React, { useState, useMemo } from 'react';
import { useTuxi } from '../../context/TuxiContext';
import { ProductItem, POSProvider } from '../../types';
import { AISmartRestockManager } from './AISmartRestockManager';
import { evaluateShopInventoryAlerts } from '../../utils/aiRestockEngine';
import { 
  Store, 
  Package, 
  CheckSquare, 
  Square, 
  BarChart2, 
  AlertCircle, 
  Plus, 
  Check, 
  Tag, 
  Cpu, 
  RefreshCw, 
  Barcode, 
  Wifi, 
  Radio, 
  Layers,
  Sparkles,
  AlertTriangle,
  Send
} from 'lucide-react';

export const ShopOwnerView: React.FC = () => {
  const { 
    businesses, 
    updateBusiness, 
    orders, 
    updateOrderStatus, 
    config,
    syncStorePOS,
    connectStorePOS
  } = useTuxi();

  const myShop = businesses.find(b => b.type === 'shop' && b.status === 'live') || businesses.find(b => b.type === 'shop') || businesses[0];

  const [activeTab, setActiveTab] = useState<'pick_pack' | 'inventory' | 'smart_restock' | 'pos_integration' | 'finances'>('pick_pack');
  const [packedItems, setPackedItems] = useState<Record<string, boolean>>({});
  const [selectedPOSProvider, setSelectedPOSProvider] = useState<POSProvider>('square');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [posSyncFeedback, setPosSyncFeedback] = useState<string>('');

  const restockAlerts = useMemo(() => {
    return evaluateShopInventoryAlerts(myShop?.products || [], orders);
  }, [myShop?.products, orders]);

  const criticalAlertsCount = restockAlerts.filter(a => a.urgency === 'critical').length;

  const currentPos = myShop?.posConfig || {
    provider: 'square' as POSProvider,
    isConnected: true,
    merchantId: 'SQ-MERCH-99410',
    storeLocationId: 'LOC-SHOREDITCH-RETAIL',
    autoSyncInventory: true,
    auto86Items: true,
    autoSendOrdersToKitchenKDS: false,
    lastSyncTimestamp: new Date().toLocaleTimeString(),
    webhookStatus: 'active' as const
  };

  const handleRunPOSSync = () => {
    setIsSyncing(true);
    syncStorePOS(myShop.id, selectedPOSProvider);
    setTimeout(() => {
      setIsSyncing(false);
      setPosSyncFeedback(`Successfully synchronized ${myShop.products?.length || 10} retail SKUs & barcode inventory with ${selectedPOSProvider.toUpperCase()} POS.`);
      setTimeout(() => setPosSyncFeedback(''), 4000);
    }, 1000);
  };

  // Shop live orders
  const liveShopOrders = orders.filter(o => 
    o.type === 'shop' && 
    (o.status === 'placed' || o.status === 'accepted' || o.status === 'preparing' || o.status === 'ready')
  );

  const toggleItemPacked = (orderItemId: string) => {
    setPackedItems(prev => ({
      ...prev,
      [orderItemId]: !prev[orderItemId]
    }));
  };

  const handleMarkPackedReady = (orderId: string) => {
    updateOrderStatus(orderId, 'ready');
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    if (!myShop.products) return;
    const updated = myShop.products.map(p => 
      p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p
    );
    updateBusiness(myShop.id, { products: updated });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Shop Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{myShop.name}</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                {myShop.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{myShop.category} · {myShop.address}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block">Inventory SKUs</span>
          <span className="text-lg font-bold text-slate-900 font-mono">
            {myShop.products?.length || 0} Products Listed
          </span>
        </div>
      </div>

      {/* Automated AI Stock Alert Notification Banner */}
      {criticalAlertsCount > 0 && activeTab !== 'smart_restock' && (
        <div className="p-4 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border border-rose-600/50 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs animate-pulse shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm">
                  AI Inventory Alert: {criticalAlertsCount} popular item{criticalAlertsCount > 1 ? 's' : ''} below replenishment threshold
                </span>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-rose-500/30 text-rose-300 border border-rose-500/40">
                  STOCKOUT RISK
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Current sales velocity projects stockouts within 6 hours. AI has generated optimized supplier purchase orders ready for one-click approval.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('smart_restock')}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Review AI Restocks ({restockAlerts.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('pick_pack')}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'pick_pack' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Picking &amp; Packing ({liveShopOrders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('smart_restock')}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'smart_restock' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Smart Restock</span>
          {restockAlerts.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              criticalAlertsCount > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-100 text-amber-800'
            }`}>
              {restockAlerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'inventory' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Product Catalog &amp; Stock</span>
        </button>
        <button
          onClick={() => setActiveTab('pos_integration')}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === 'pos_integration' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>POS Integration &amp; Inventory</span>
        </button>
        <button
          onClick={() => setActiveTab('finances')}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === 'finances' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Store Revenue</span>
        </button>
      </div>

      {/* TAB 1: PICKING & PACKING */}
      {activeTab === 'pick_pack' && (
        <div className="space-y-4">
          {liveShopOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs space-y-2">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">Packing Queue is Empty</h3>
              <p className="text-slate-500">Retail grocery orders will arrive here with item-by-item checklists.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveShopOrders.map(order => (
                <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="font-mono text-[10px] text-indigo-600 font-bold uppercase">
                        Retail Order #{order.orderNumber}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">{order.customerName}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {order.status}
                    </span>
                  </div>

                  {/* Pick list checkboxes */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Shelf Pick List</span>
                    {order.items.map(item => {
                      const isPacked = packedItems[item.id];
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleItemPacked(item.id)}
                          className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                            isPacked
                              ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900 line-through'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isPacked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="font-semibold">{item.quantity}x {item.name}</span>
                          </div>
                          <span className="font-mono text-[11px] text-slate-500">
                            {config.currencySymbol}{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mark packed button */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleMarkPackedReady(order.id)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Bag Sealed &amp; Ready for Courier</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVENTORY & STOCK */}
      {activeTab === 'inventory' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Inventory Stock &amp; Pricing Management</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage real-time SKU inventory levels and sale pricing.</p>
            </div>
          </div>

          <div className="space-y-3">
            {myShop.products?.map(prod => (
              <div key={prod.id} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between gap-4 text-xs">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{prod.name}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-[10px] text-slate-500">SKU: {prod.sku}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">{prod.description}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-bold text-slate-900 tabular-nums text-sm">
                    {config.currencySymbol}{prod.price.toFixed(2)}
                  </span>

                  <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Stock:</span>
                    <button
                      onClick={() => handleUpdateStock(prod.id, prod.stock - 1)}
                      className="w-5 h-5 bg-white rounded border border-slate-200 text-slate-700 font-bold"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-slate-900">{prod.stock}</span>
                    <button
                      onClick={() => handleUpdateStock(prod.id, prod.stock + 1)}
                      className="w-5 h-5 bg-white rounded border border-slate-200 text-slate-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: AI SMART RESTOCK & AUTOMATED NOTIFICATIONS */}
      {activeTab === 'smart_restock' && (
        <AISmartRestockManager
          products={myShop.products || []}
          orders={orders}
          onStockUpdated={handleUpdateStock}
        />
      )}

      {/* TAB: POS INTEGRATION & LIVE RETAIL INVENTORY */}
      {activeTab === 'pos_integration' && (
        <div className="space-y-6">
          
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Retail Grocery &amp; Shop POS Integration Service</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Synchronize barcode inventory, till sales, and stock levels between your physical checkout terminals and TUXI Shop.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">POS Stream:</span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                CONNECTED (100% HEALTH)
              </span>
            </div>
          </div>

          {posSyncFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{posSyncFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: POS Hardware Provider */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Retail POS Terminal Bridge</h3>
                <p className="text-slate-500">Select your retail scanner &amp; till software.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'square', label: 'Square for Retail', desc: 'Barcode scanner & POS till' },
                  { id: 'clover', label: 'Clover Retail', desc: 'Station Solo & Flex' },
                  { id: 'shopify_pos', label: 'Shopify POS', desc: 'Unified multichannel store' },
                  { id: 'lightspeed', label: 'Lightspeed Retail (X-Series)', desc: 'Inventory-intensive stores' },
                  { id: 'custom_api', label: 'Custom ERP / SAP', desc: 'Direct webhook ledger' }
                ].map(provider => {
                  const isSelected = selectedPOSProvider === provider.id;
                  return (
                    <div
                      key={provider.id}
                      onClick={() => {
                        setSelectedPOSProvider(provider.id as POSProvider);
                        connectStorePOS(myShop.id, { provider: provider.id as POSProvider });
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <span className="font-bold text-slate-900 block">{provider.label}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{provider.desc}</span>
                      {isSelected && (
                        <span className="inline-block mt-2 text-[10px] font-mono text-indigo-700 font-bold bg-indigo-100 px-1.5 py-0.2 rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Merchant Store ID</label>
                  <input
                    type="text"
                    value={currentPos.merchantId}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Register Location ID</label>
                  <input
                    type="text"
                    value={currentPos.storeLocationId}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50 text-slate-700"
                  />
                </div>
              </div>

              {/* Automation Rules */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 text-xs">Retail Automation Directives:</h4>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-2.5">
                    <Barcode className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Instant In-Store Till Depletion</span>
                      <span className="text-slate-500 text-[11px]">
                        When a customer in your physical shop buys an item at the register, TUXI inventory decrements in real-time.
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    REAL-TIME
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-2.5">
                    <Radio className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Automatic Out-of-Stock Delisting</span>
                      <span className="text-slate-500 text-[11px]">
                        Zero stock automatically removes the item from the TUXI customer marketplace within 200 milliseconds.
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    ACTIVE
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Sync Status & Actions */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between text-xs space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-600 block mb-1">
                  Inventory Sync Status
                </span>
                <h3 className="font-bold text-sm text-slate-900">Retail Inventory Link</h3>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Last verified sync with {selectedPOSProvider.toUpperCase()} at{' '}
                  <strong className="text-slate-700">{currentPos.lastSyncTimestamp}</strong>.
                </p>

                <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Monitored Barcodes:</span>
                    <strong className="text-slate-900 font-mono">{myShop.products?.length || 10} SKUs</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Fulfillment Mode:</span>
                    <strong className="text-indigo-600 font-semibold">
                      {myShop.shopFulfillmentType === 'shop_and_deliver' ? 'Aisle Shop & Deliver' : 'Merchant Pick & Pack'}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Commission Tier:</span>
                    <strong className="text-emerald-600 font-semibold">{myShop.commissionRate}% Net Platform</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <button
                  onClick={handleRunPOSSync}
                  disabled={isSyncing}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing Barcodes...' : 'Sync Catalog from POS Now'}</span>
                </button>
                <p className="text-[10px] text-center text-slate-400">
                  Runs full retail catalog and stock parity audit.
                </p>
              </div>
            </div>

          </div>

          {/* Mapped POS Items Preview Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900">Mapped Barcodes &amp; Store Till SKUs</h3>
            <div className="divide-y divide-slate-100">
              {myShop.products?.map(prod => (
                <div key={prod.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{prod.name}</span>
                    <span className="text-slate-400 text-[11px] ml-2 font-mono">
                      Barcode: {prod.barcode || `8809${prod.sku.replace('-', '')}5`} · SKU: {prod.sku}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-slate-800">
                      {config.currencySymbol}{prod.price.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      {prod.stock} IN STOCK (POS SYNCED)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: FINANCES */}
      {activeTab === 'finances' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Retail Revenue &amp; Settlements</h2>
            <p className="text-xs text-slate-500 mt-0.5">Platform commission rate: {myShop.commissionRate}%.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-medium block">Total YTD Volume</span>
              <span className="text-2xl font-black text-slate-900 tabular-nums block mt-1">
                {config.currencySymbol}{myShop.salesVolumeYtd.toLocaleString()}
              </span>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-medium block">Platform Fee ({myShop.commissionRate}%)</span>
              <span className="text-2xl font-black text-slate-700 tabular-nums block mt-1">
                {config.currencySymbol}{(myShop.salesVolumeYtd * (myShop.commissionRate / 100)).toLocaleString()}
              </span>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-emerald-700 font-medium block">Net Payout to Merchant</span>
              <span className="text-2xl font-black text-emerald-900 tabular-nums block mt-1">
                {config.currencySymbol}{(myShop.salesVolumeYtd * (1 - myShop.commissionRate / 100)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
