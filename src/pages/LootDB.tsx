import { useState, useMemo, useEffect } from 'react';
import { Card, Button, Input, Badge, EmptyState, Modal, NumberInput, Select } from '../components/ui';
import { getLootDBItems, addLootDBItem, updateLootDBItem, deleteLootDBItem } from '../utils/storage';
import { formatCurrency } from '../utils/economy';
import { RARITY_COLORS, VENDORS } from '../data/constants';
import { Database, Plus, Search, Edit, Trash2, DollarSign, Package, TrendingDown, Store } from 'lucide-react';
import type { LootDBItem } from '../types';

const RARITY_OPTIONS = [
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'red', label: 'Red' },
];

export function LootDB() {
  const items = getLootDBItems();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LootDBItem | null>(null);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!search) return items;
    const searchLower = search.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower)
    );
  }, [items, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-abi-text flex items-center gap-2">
            <Database className="text-abi-orange" size={28} />
            LootDB
          </h1>
          <p className="text-abi-text-muted text-sm mt-1">
            {items.length} items in database
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)} glow>
          <Plus size={18} className="mr-1" /> Add Item
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search items..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search size={16} />}
        className="w-full max-w-md"
      />

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className={`font-semibold ${RARITY_COLORS[item.rarity]}`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-abi-text-dim">{item.category}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-1.5 rounded text-abi-text-muted hover:text-abi-text hover:bg-abi-bg-hover transition-colors"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => deleteLootDBItem(item.id)}
                    className="p-1.5 rounded text-abi-text-muted hover:text-red-400 hover:bg-abi-bg-hover transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-abi-text-muted flex items-center gap-1">
                    <DollarSign size={12} /> Market
                  </span>
                  <span className="text-sm font-bold text-abi-text">
                    ${formatCurrency(item.marketPrice)}
                  </span>
                </div>

                {/* Best Sell To */}
                {item.bestSellTo && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-abi-text-muted flex items-center gap-1">
                      <Store size={12} /> Best Vendor
                    </span>
                    <Badge variant="success" size="sm">
                      {item.bestSellTo}
                    </Badge>
                  </div>
                )}

                {/* Lowest Price */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-abi-text-muted flex items-center gap-1">
                    <TrendingDown size={12} /> Lowest
                  </span>
                  <span className="text-sm text-green-400">
                    ${formatCurrency(item.lowestPrice)}
                  </span>
                </div>
              </div>

              {/* Vendor Prices */}
              {item.vendorPrices.length > 0 && (
                <div className="mt-3 pt-3 border-t border-abi-border">
                  <p className="text-xs text-abi-text-dim mb-2">Vendor Prices</p>
                  <div className="flex flex-wrap gap-1">
                    {item.vendorPrices.map(vp => (
                      <Badge key={vp.vendor} variant="default" size="sm">
                        {vp.vendor}: ${formatCurrency(vp.price)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Package size={48} />}
          title="No items in database"
          description="Add items to track their market and vendor prices"
          action={
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              Add First Item
            </Button>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <LootDBItemModal
        isOpen={showAddModal || !!editingItem}
        onClose={() => {
          setShowAddModal(false);
          setEditingItem(null);
        }}
        item={editingItem}
        onSave={(item) => {
          if (editingItem) {
            updateLootDBItem(item);
          } else {
            addLootDBItem(item);
          }
          setShowAddModal(false);
          setEditingItem(null);
        }}
      />
    </div>
  );
}

interface LootDBItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: LootDBItem | null;
  onSave: (item: LootDBItem) => void;
}

function LootDBItemModal({ isOpen, onClose, item, onSave }: LootDBItemModalProps) {
  const [name, setName] = useState(item?.name || '');
  const [category, setCategory] = useState(item?.category || '');
  const [rarity, setRarity] = useState<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'red'>(item?.rarity || 'common');
  const [marketPrice, setMarketPrice] = useState(item?.marketPrice || 0);
  const [lowestPrice, setLowestPrice] = useState(item?.lowestPrice || 0);
  const [vendorName, setVendorName] = useState('');
  const [vendorPrice, setVendorPrice] = useState(0);
  const [vendorPrices, setVendorPrices] = useState(item?.vendorPrices || []);

  const handleAddVendorPrice = () => {
    if (vendorName && vendorPrice > 0) {
      setVendorPrices([...vendorPrices, { vendor: vendorName, price: vendorPrice }]);
      setVendorName('');
      setVendorPrice(0);
    }
  };

  const handleRemoveVendorPrice = (vendor: string) => {
    setVendorPrices(vendorPrices.filter(v => v.vendor !== vendor));
  };

  const handleSave = () => {
    const newItem: LootDBItem = {
      id: item?.id || `item-${Date.now()}`,
      name,
      category,
      rarity,
      marketPrice,
      vendorPrices,
      lowestPrice,
      lowestPriceHistory: item?.lowestPriceHistory || [],
      bestSellTo: '', // Would be calculated based on prices
      notes: item?.notes,
    };
    onSave(newItem);
  };

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category);
      setRarity(item.rarity);
      setMarketPrice(item.marketPrice);
      setLowestPrice(item.lowestPrice);
      setVendorPrices(item.vendorPrices);
    }
  }, [item]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Item' : 'Add Item'} size="md">
      <div className="space-y-4">
        <Input
          label="Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., GPU"
        />

        <Input
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g., Electronics"
        />

        <Select
          label="Rarity"
          value={rarity}
          onChange={(e) => setRarity(e.target.value as typeof rarity)}
          options={RARITY_OPTIONS}
        />

        <NumberInput
          label="Market Price"
          value={marketPrice}
          onChange={setMarketPrice}
          min={0}
        />

        <NumberInput
          label="Lowest Price Seen"
          value={lowestPrice}
          onChange={setLowestPrice}
          min={0}
        />

        {/* Vendor Prices */}
        <div>
          <label className="block text-sm text-abi-text-muted mb-2">Vendor Prices</label>
          <div className="flex gap-2 mb-2">
            <Select
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              options={[{ value: '', label: 'Select vendor' }, ...VENDORS.map(v => ({ value: v.id, label: v.name }))]}
              className="flex-1"
            />
            <NumberInput
              value={vendorPrice}
              onChange={setVendorPrice}
              min={0}
              className="w-28"
            />
            <Button variant="secondary" onClick={handleAddVendorPrice}>
              <Plus size={16} />
            </Button>
          </div>
          {vendorPrices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {vendorPrices.map(vp => (
                <Badge key={vp.vendor} variant="default" size="sm">
                  {vp.vendor}: ${formatCurrency(vp.price)}
                  <button onClick={() => handleRemoveVendorPrice(vp.vendor)} className="ml-1">
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-abi-border">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!name || !category}>
            {item ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
