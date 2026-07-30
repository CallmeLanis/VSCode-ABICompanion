import { useState, useMemo, useEffect } from 'react';
import {
  Button,
  Input,
  Badge,
  EmptyState,
  Modal,
  NumberInput,
  Select,
  PageHeader,
  StatCard,
  MetaLabel,
  Caption,
} from '../components/ui';
import { addLootDBItem, updateLootDBItem, deleteLootDBItem, getStoredSettings } from '../utils/storage';
import { useLootDBItems, useRaids } from '../hooks/useStorageQuery';
import { calculateLootIntelligence } from '../utils/analytics';
import { formatCurrency } from '../utils/economy';
import { RARITY_COLORS } from '../data/constants';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Store,
  TrendingDown,
  SortDesc,
  Database,
  Crosshair,
  ArrowDownToLine,
} from 'lucide-react';
import type { LootDBItem, LootDBRecord, LootSellAction } from '../types';
import {
  CrossfadeContent,
  RevealSection,
  StaggerContainer,
  StaggerItem,
} from '../components/motion';

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

type SortField = 'name' | 'marketPrice' | 'foundCount' | 'totalEarnings' | 'lowestPrice';
type RarityFilter = 'all' | LootDBItem['rarity'];
type TypeFilter = 'all' | LootDBItem['type'];
type ActionFilter = 'all' | LootSellAction;

const SORT_LABELS: Record<SortField, string> = {
  name: 'Name',
  marketPrice: 'Market',
  foundCount: 'Found',
  totalEarnings: 'Earnings',
  lowestPrice: 'Lowest',
};

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
  const raids = useRaids();
  const taxRate = getStoredSettings().globalTaxRate ?? 0.10;

  const intelligence = useMemo(
    () => calculateLootIntelligence(items, raids, taxRate),
    [items, raids, taxRate]
  );

  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LootDBItem | null>(null);

  const categories = useMemo(
    () => [...new Set(items.map(item => item.category).filter(Boolean))].sort(),
    [items]
  );

  const filteredRecords = useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    let result = intelligence.records.filter(record => {
      if (searchLower) {
        const matchesSearch =
          record.name.toLowerCase().includes(searchLower) ||
          record.category.toLowerCase().includes(searchLower) ||
          record.type.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (rarityFilter !== 'all' && record.rarity !== rarityFilter) return false;
      if (typeFilter !== 'all' && record.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && record.category !== categoryFilter) return false;
      if (actionFilter !== 'all' && record.action !== actionFilter) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'marketPrice':
          cmp = a.marketPrice - b.marketPrice;
          break;
        case 'foundCount':
          cmp = a.foundCount - b.foundCount;
          break;
        case 'totalEarnings':
          cmp = a.totalEarnings - b.totalEarnings;
          break;
        case 'lowestPrice':
          cmp = a.lowestPrice - b.lowestPrice;
          break;
      }
      return sortDesc ? -cmp : cmp;
    });

    return result;
  }, [intelligence.records, search, rarityFilter, typeFilter, categoryFilter, actionFilter, sortField, sortDesc]);

  const cycleSort = () => {
    const fields: SortField[] = ['name', 'marketPrice', 'foundCount', 'totalEarnings', 'lowestPrice'];
    const currentIndex = fields.indexOf(sortField);
    if (currentIndex === fields.length - 1) {
      setSortField(fields[0]);
      setSortDesc(false);
      return;
    }
    if (sortDesc) {
      setSortField(fields[currentIndex + 1]);
      setSortDesc(false);
      return;
    }
    setSortDesc(true);
  };

  const { summary } = intelligence;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence inventory"
        title="Loot Database"
        meta={`${summary.totalItems} catalog records`}
        actions={
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} className="mr-1" /> Add item
          </Button>
        }
      />

      <RevealSection immediate delay={0.04}>
      <section aria-label="Loot summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StaggerContainer className="contents xl:contents" immediate>
          <StaggerItem><StatCard label="Catalog items" value={String(summary.totalItems)} subValue={`$${formatCurrency(summary.catalogMarketValue)} market value`} icon={<Database size={18} />} /></StaggerItem>
          <StaggerItem><StatCard label="Tracked in ops" value={String(summary.trackedInRaids)} subValue={`${summary.totalFoundCount} total found`} icon={<Crosshair size={18} />} /></StaggerItem>
          <StaggerItem><StatCard label="Sell to market" value={String(summary.sellToMarket)} subValue="After-tax beats vendor" icon={<ArrowDownToLine size={18} />} /></StaggerItem>
          <StaggerItem><StatCard label="Sell to vendor" value={String(summary.sellToVendor)} subValue={summary.needsData > 0 ? `${summary.needsData} need pricing data` : 'Vendor beats market net'} icon={<Store size={18} />} /></StaggerItem>
        </StaggerContainer>
      </section>
      </RevealSection>

      {/* Inventory log */}
      <section aria-label="Loot inventory" className="hud-card rounded-xl p-0 relative overflow-hidden">
        <div className="px-4 py-4 border-b border-abi-border sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <MetaLabel tone="accent" className="block mb-1">Inventory records</MetaLabel>
              <Caption tone="muted">
                {filteredRecords.length} of {summary.totalItems} items · cross-referenced with raid loot
              </Caption>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-abi-text-dim uppercase tracking-wider font-mono">
                Sort: {SORT_LABELS[sortField]}{sortDesc ? ' ↓' : ' ↑'}
              </span>
              <button
                type="button"
                onClick={cycleSort}
                className="p-2 rounded border border-abi-border hover:border-abi-orange hover:text-abi-orange transition-colors"
                title="Cycle sort field"
              >
                <SortDesc size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-b border-abi-border flex flex-wrap gap-3 sm:px-5">
          <Input
            placeholder="Search name, category, type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={16} />}
            className="w-full max-w-xs"
          />

          <div className="filter-tabs">
            {(['all', ...RARITY_OPTIONS.map(o => o.value)] as RarityFilter[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setRarityFilter(tab)}
                className={`filter-tab ${rarityFilter === tab ? 'active' : ''}`}
              >
                {tab === 'all' ? 'All rarity' : RARITY_OPTIONS.find(o => o.value === tab)?.label ?? tab}
              </button>
            ))}
          </div>

          <div className="filter-tabs">
            {(['all', ...TYPE_OPTIONS.map(o => o.value)] as TypeFilter[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setTypeFilter(tab)}
                className={`filter-tab ${typeFilter === tab ? 'active' : ''}`}
              >
                {tab === 'all' ? 'All types' : TYPE_OPTIONS.find(o => o.value === tab)?.label ?? tab}
              </button>
            ))}
          </div>

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All categories' },
              ...categories.map(category => ({ value: category, label: category })),
            ]}
            className="min-w-[160px]"
          />

          <div className="filter-tabs">
            {(['all', 'market', 'vendor', 'hold'] as ActionFilter[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActionFilter(tab)}
                className={`filter-tab ${actionFilter === tab ? 'active' : ''}`}
              >
                {tab === 'all' ? 'All actions' : tab === 'market' ? 'Market' : tab === 'vendor' ? 'Vendor' : 'Hold'}
              </button>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div className="hidden md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_minmax(0,0.7fr)_48px] gap-3 px-4 py-2 border-b border-abi-border text-xs uppercase tracking-wider text-abi-text-dim font-mono sm:px-5">
          <div>Item</div>
          <div>Rarity</div>
          <div>Category</div>
          <div className="text-right">Market</div>
          <div className="text-right">Vendor</div>
          <div className="text-right">Found</div>
          <div className="text-right">Earnings</div>
          <div>Action</div>
          <div />
        </div>

        {/* Table body */}
        <CrossfadeContent contentKey={`${rarityFilter}-${typeFilter}-${actionFilter}-${search}-${sortField}-${sortDesc}`}>
        {filteredRecords.length > 0 ? (
          <div className="divide-y divide-abi-border/60 max-h-[640px] overflow-y-auto">
            {filteredRecords.map(record => (
              <InventoryRow
                key={record.id}
                record={record}
                onEdit={() => setEditingItem(record)}
                onDelete={() => deleteLootDBItem(record.id)}
              />
            ))}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={<Package size={48} />}
              title={items.length === 0 ? 'No items in database' : 'No matching records'}
              description={
                items.length === 0
                  ? 'Add items to track market prices, vendor rates, and sell recommendations.'
                  : 'Try clearing search or adjusting filters.'
              }
              action={
                items.length === 0 ? (
                  <Button variant="primary" onClick={() => setShowAddModal(true)}>
                    Add first item
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}
        </CrossfadeContent>
      </section>

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

interface InventoryRowProps {
  record: LootDBRecord;
  onEdit: () => void;
  onDelete: () => void;
}

function InventoryRow({ record, onEdit, onDelete }: InventoryRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_minmax(0,0.7fr)_48px] gap-2 md:gap-3 px-4 py-3 items-center hover:bg-abi-bg-hover/40 transition-colors sm:px-5">
      <div className="min-w-0">
        <p className={`font-semibold truncate ${RARITY_COLORS[record.rarity] ?? 'text-primary'}`}>
          {record.name}
        </p>
        <Caption tone="muted" className="truncate">{record.type}</Caption>
      </div>

      <div className="flex md:block">
        <Caption tone="muted" className="md:hidden mr-2">Rarity</Caption>
        <Badge variant="default" size="sm" className="capitalize">
          {record.rarity}
        </Badge>
      </div>

      <div className="min-w-0">
        <Caption tone="muted" className="md:hidden">Category</Caption>
        <p className="text-sm text-secondary truncate">{record.category}</p>
      </div>

      <div className="flex md:block justify-between">
        <Caption tone="muted" className="md:hidden">Market</Caption>
        <div className="text-right">
          <p className="text-sm font-semibold text-primary">${formatCurrency(record.marketPrice)}</p>
          {record.marketNet > 0 && (
            <Caption tone="muted">Net ${formatCurrency(record.marketNet)}</Caption>
          )}
        </div>
      </div>

      <div className="flex md:block justify-between">
        <Caption tone="muted" className="md:hidden">Vendor</Caption>
        <div className="text-right">
          {record.bestVendorPrice > 0 ? (
            <>
              <p className="text-sm font-semibold text-positive">${formatCurrency(record.bestVendorPrice)}</p>
              <Caption tone="muted" className="truncate">{record.bestVendorName}</Caption>
            </>
          ) : (
            <Caption tone="muted">—</Caption>
          )}
        </div>
      </div>

      <div className="flex md:block justify-between">
        <Caption tone="muted" className="md:hidden">Found</Caption>
        <p className="text-sm text-right font-mono text-primary">{record.foundCount}</p>
      </div>

      <div className="flex md:block justify-between">
        <Caption tone="muted" className="md:hidden">Earnings</Caption>
        <p className={`text-sm text-right font-mono ${record.totalEarnings >= 0 ? 'text-positive' : 'text-negative'}`}>
          ${formatCurrency(record.totalEarnings)}
        </p>
      </div>

      <div className="flex md:block items-center gap-2">
        <Caption tone="muted" className="md:hidden">Action</Caption>
        <SellActionBadge action={record.action} />
        {record.lowestPrice > 0 && (
          <Caption tone="muted" className="hidden md:flex items-center gap-1 mt-0.5">
            <TrendingDown size={10} /> Low ${formatCurrency(record.lowestPrice)}
          </Caption>
        )}
      </div>

      <div className="flex gap-1 justify-end">
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded text-abi-text-muted hover:text-abi-text hover:bg-abi-bg-hover transition-colors"
          aria-label={`Edit ${record.name}`}
        >
          <Edit size={14} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded text-abi-text-muted hover:text-red-400 hover:bg-abi-bg-hover transition-colors"
          aria-label={`Delete ${record.name}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function SellActionBadge({ action }: { action: LootSellAction }) {
  if (action === 'vendor') {
    return <Badge variant="success" size="sm">Sell vendor</Badge>;
  }
  if (action === 'market') {
    return <Badge variant="default" size="sm" className="text-accent border-accent/40">Sell market</Badge>;
  }
  return <Badge variant="default" size="sm">Hold / add data</Badge>;
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
  const [vendorPrice, setVendorPrice] = useState<number | undefined>(
    item?.vendorPrices?.[0]?.price ?? undefined
  );

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

  const marketReturn = marketPrice ? marketPrice * 0.9 : 0; // 10% tax
  const vendorBest = vendorPrice ?? 0;
  const recommendVendor = vendorBest > 0 && vendorBest > marketReturn;

  // Ammo catalog: category follows caliber; type name lives in name/tier
  const resolvedCategory =
    type === 'ammo'
      ? (caliber.trim() || 'Ammo')
      : category;

  const resolvedTier = type === 'ammo' ? (tier.trim() || name.trim()) : (tier || undefined);

  const canSave =
    Boolean(name.trim()) &&
    (type === 'ammo' ? Boolean(caliber.trim()) : Boolean(category.trim()));

  const handleSave = () => {
    const savedVendorPrices =
      (vendorPrice ?? 0) > 0
        ? [{ vendor: item?.vendorPrices?.[0]?.vendor || 'Vendor', price: vendorPrice ?? 0 }]
        : [];

    const newItem: LootDBItem = {
      id: item?.id || `item-${Date.now()}`,
      name: name.trim(),
      category: resolvedCategory,
      rarity: (rarity || 'common') as LootDBItem['rarity'],
      type: type as LootDBItem['type'],
      subtype: subtype || undefined,
      tier: resolvedTier || undefined,
      caliber: type === 'ammo' ? caliber.trim() : caliber || undefined,
      marketPrice: marketPrice ?? 0,
      vendorPrices: savedVendorPrices,
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
      setVendorPrice(item.vendorPrices?.[0]?.price);
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

        {type !== 'ammo' && (
          <Input
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Electronics"
          />
        )}

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
            setSubtype('');
            if (e.target.value !== 'ammo') {
              setCaliber('');
              setTier('');
            }
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

        {/* Ammo-specific fields — catalog is free-entry (no hardcoded calibers) */}
        {type === 'ammo' && (
          <>
            <Input
              label="Caliber"
              value={caliber}
              onChange={(e) => setCaliber(e.target.value)}
              placeholder="e.g., 7.62x51"
            />
            <Input
              label="Ammo Type"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              placeholder="e.g., M80 (defaults to item name)"
            />
            <Caption tone="muted" className="block -mt-2">
              Market Price is used as cost per round when logging raids.
            </Caption>
          </>
        )}

        <NumberInput
          label="Market Price"
          value={marketPrice}
          onChange={setMarketPrice}
          min={0}
        />

        <NumberInput
          label="Vendor Price"
          value={vendorPrice}
          onChange={setVendorPrice}
          min={0}
        />

        {/* Market Logic Recommendation */}
        {(marketPrice !== undefined && marketPrice > 0) || (vendorPrice !== undefined && vendorPrice > 0) ? (
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
                <span className="text-abi-text-muted">Vendor:</span>
                <span className="text-green-400">${formatCurrency(vendorBest)}</span>
              </div>
            )}
          </div>
        ) : null}

        <NumberInput
          label="Lowest Price Seen"
          value={lowestPrice}
          onChange={setLowestPrice}
          min={0}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-abi-border">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!canSave}>
            {item ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
