import { useState, useMemo, useEffect } from 'react';
import { Card, Button, Input, Badge, EmptyState, Modal, NumberInput, Select } from '../components/ui';
import { addLootDBItem, updateLootDBItem, deleteLootDBItem } from '../utils/storage';
import { useLootDBItems } from '../hooks/useStorageQuery';
import { formatCurrency } from '../utils/economy';
import { RARITY_COLORS, VENDORS, AMMO_CALIBERS } from '../data/constants';
import { Database, Plus, Search, Edit, Trash2, DollarSign, Package, TrendingDown, Store } from 'lucide-react';
import type { LootDBItem } from '../types';

const RARITY_OPTIONS = [
  { value: 'common', label: 'Gray' },
  { value: 'uncommon', label: 'Green' },
  { value: 'rare', label: 'Blue' },
  { value: 'epic', label: 'Purple' },
  { value: 'legendary', label: 'Gold' },
  { value: 'red', label: 'Red' },
];

const TYPE_OPTIONS = [
  { value: 'armor', label: 'Armor' },
  { value: 'weapon', label: 'Weapon' },
  { value: 'ammo', label: 'Ammo' },
  { value: 'medic', label: 'Medic' },
  { value: 'grenade', label: 'Grenade' },
  { value: 'misc', label: 'Misc' },
];

const MISC_SUBTYPE_OPTIONS = [
  { value: 'flammable', label: 'Flammable' },
  { value: 'building_mats', label: 'Building mats' },
  { value: 'computer_parts', label: 'Computer parts' },
  { value: 'energy_items', label: 'Energy items' },
  { value: 'tools', label: 'Tools' },
  { value: 'household', label: 'Household' },
  { value: 'misc_medic', label: 'Misc medic' },
  { value: 'paper', label: 'Paper' },
  { value: 'instruments', label: 'Instruments' },
  { value: 'misc_military', label: 'Misc military' },
  { value: 'boss_token', label: 'Boss token' },
  { value: 'electronics', label: 'Electronics' },
];

const MEDIC_SUBTYPE_OPTIONS = [
  { value: 'medicine', label: 'Medicine' },
  { value: 'treatments', label: 'Treatments' },
  { value: 'medkits', label: 'Medkits' },
];

const GRENADE_SUBTYPE_OPTIONS = [
  { value: 'defend', label: 'Defend' },
  { value: 'blast', label: 'Blast' },
];

export function LootDB() {
  const items = useLootDBItems();
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
  const [rarity, setRarity] = useState<string>(item?.rarity || '');
  const [type, setType] = useState<string>(item?.type || 'misc');
  const [subtype, setSubtype] = useState<string>(item?.subtype || '');
  const [tier, setTier] = useState<string>(item?.tier || '');
  const [caliber, setCaliber] = useState<string>(item?.caliber || '');
  const [marketPrice, setMarketPrice] = useState<number | undefined>(item?.marketPrice ?? undefined);
  const [lowestPrice, setLowestPrice] = useState<number | undefined>(item?.lowestPrice ?? undefined);
  const [vendorName, setVendorName] = useState('');
  const [vendorPrice, setVendorPrice] = useState<number | undefined>(undefined);
  const [vendorPrices, setVendorPrices] = useState(item?.vendorPrices || []);
  const [amount, setAmountState] = useState<number>(1);
  const setAmount = (val: number | undefined) => {
    if (val !== undefined) setAmountState(val);
  };

  const handleAddVendorPrice = () => {
    if (vendorName && (vendorPrice ?? 0) > 0) {
      setVendorPrices([...vendorPrices, { vendor: vendorName, price: vendorPrice ?? 0 }]);
      setVendorName('');
      setVendorPrice(undefined);
    }
  };

  const handleRemoveVendorPrice = (vendor: string) => {
    setVendorPrices(vendorPrices.filter(v => v.vendor !== vendor));
  };

  // Get subtype options based on type
  const getSubtypeOptions = () => {
    switch (type) {
      case 'misc':
        return MISC_SUBTYPE_OPTIONS;
      case 'medic':
        return MEDIC_SUBTYPE_OPTIONS;
      case 'grenade':
        return GRENADE_SUBTYPE_OPTIONS;
      default:
        return [];
    }
  };

  // Get caliber options for ammo
  const getCaliberOptions = () => {
    return [
      { value: '', label: 'Select caliber' },
      ...AMMO_CALIBERS.map(c => ({ value: c.id, label: c.name }))
    ];
  };

  // Get tier options for selected caliber
  const getTierOptions = () => {
    if (!caliber) return [];
    const caliberData = AMMO_CALIBERS.find(c => c.id === caliber);
    if (!caliberData) return [];
    return [
      { value: '', label: 'Select tier' },
      ...caliberData.tiers.map(t => ({ value: t.id, label: `${t.name} (${formatCurrency(t.costPerRound)}/round)` }))
    ];
  };

  // Calculate auto-cost for ammo
  const calculateAmmoCost = () => {
    if (type !== 'ammo' || !caliber || !tier || !amount) return 0;
    const caliberData = AMMO_CALIBERS.find(c => c.id === caliber);
    if (!caliberData) return 0;
    const tierData = caliberData.tiers.find(t => t.id === tier);
    if (!tierData) return 0;
    return tierData.costPerRound * amount;
  };

  const autoCost = calculateAmmoCost();

  // Calculate market return
  const marketReturn = marketPrice ? marketPrice * 0.9 : 0; // 10% tax
  const vendorBest = vendorPrices.length > 0 ? Math.max(...vendorPrices.map(v => v.price)) : 0;
  const recommendVendor = vendorBest > marketReturn;

  const handleSave = () => {
    const newItem: LootDBItem = {
      id: item?.id || `item-${Date.now()}`,
      name,
      category,
      rarity: (rarity || 'common') as any,
      type: type as any,
      subtype: subtype || undefined,
      tier: tier || undefined,
      caliber: caliber || undefined,
      marketPrice: marketPrice ?? 0,
      vendorPrices,
      lowestPrice: lowestPrice ?? 0,
      lowestPriceHistory: item?.lowestPriceHistory || [],
      bestSellTo: recommendVendor ? 'Vendor' : 'Market',
      notes: item?.notes,
    };
    onSave(newItem);
  };

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category);
      setRarity(item.rarity);
      setType(item.type || 'misc');
      setSubtype(item.subtype || '');
      setTier(item.tier || '');
      setCaliber(item.caliber || '');
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

        <Select
          label="Type"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setSubtype(''); // Reset subtype when type changes
          }}
          options={TYPE_OPTIONS}
        />

        {/* Dynamic Subtype Field */}
        {type !== 'ammo' && type !== 'weapon' && type !== 'armor' && (
          <Select
            label="Subtype"
            value={subtype}
            onChange={(e) => setSubtype(e.target.value)}
            options={getSubtypeOptions()}
          />
        )}

        {/* Ammo-specific fields */}
        {type === 'ammo' && (
          <>
            <Select
              label="Caliber"
              value={caliber}
              onChange={(e) => {
                setCaliber(e.target.value);
                setTier(''); // Reset tier when caliber changes
              }}
              options={getCaliberOptions()}
            />

            {caliber && (
              <Select
                label="Ammo Tier"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                options={getTierOptions()}
              />
            )}

            {tier && (
              <div>
                <label className="block text-sm text-abi-text-muted mb-2">Amount</label>
                <NumberInput
                  value={amount}
                  onChange={setAmount}
                  min={1}
                  className="w-full"
                />
              </div>
            )}

            {autoCost > 0 && (
              <div className="p-3 bg-abi-bg-elevated border border-abi-border rounded-lg">
                <p className="text-xs text-abi-text-dim">Auto-Calculated Cost</p>
                <p className="text-lg font-bold text-abi-orange font-orbitron">
                  ${formatCurrency(autoCost)}
                </p>
                <p className="text-xs text-abi-text-dim mt-1">
                  {amount} rounds × tier price
                </p>
              </div>
            )}
          </>
        )}

        <NumberInput
          label="Market Price"
          value={marketPrice}
          onChange={setMarketPrice}
          min={0}
        />

        {/* Market Logic Recommendation */}
        {marketPrice !== undefined && marketPrice > 0 && (
          <div className={`p-3 rounded-lg border ${recommendVendor ? 'bg-green-900/20 border-green-700/30' : 'bg-blue-900/20 border-blue-700/30'}`}>
            <p className="text-xs text-abi-text-dim mb-1">Sell Recommendation</p>
            <p className={`text-sm font-semibold ${recommendVendor ? 'text-green-400' : 'text-blue-400'}`}>
              {recommendVendor ? '↑ Sell to Vendor' : '↓ Sell to Market'}
            </p>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-abi-text-muted">Market (after tax):</span>
              <span className="text-abi-text">${formatCurrency(marketReturn)}</span>
            </div>
            {vendorBest > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-abi-text-muted">Best Vendor:</span>
                <span className="text-green-400">${formatCurrency(vendorBest)}</span>
              </div>
            )}
          </div>
        )}

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
