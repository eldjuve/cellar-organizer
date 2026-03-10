import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { WineItem, InventoryMatrix, ShelfProps } from '../../types';

// --- Mocks ---

const mockFetcherSubmit = vi.fn();
vi.mock('react-router', () => ({
  useFetcher: () => ({ submit: mockFetcherSubmit, data: undefined, state: 'idle' }),
}));

const mockSetSelectedWineId = vi.fn();
const mockSetSelectedPosition = vi.fn();
let mockSelectedWine: WineItem | undefined = undefined;

vi.mock('../../app/components/AppContextProvider', () => ({
  useAppContext: () => ({
    selectedWine: mockSelectedWine,
    setSelectedWineId: mockSetSelectedWineId,
    setSelectedPosition: mockSetSelectedPosition,
    activeTab: 'storage' as const,
    toggleTab: vi.fn(),
    setActiveTab: vi.fn(),
    selectedPosition: undefined,
  }),
}));

vi.mock('../../app/components/Storage/Selected', () => ({
  Display: () => null,
}));

// --- Helpers ---

import { StorageView } from '../../app/components/Storage/Storage';

const config: ShelfProps[] = [{ capacity: 3, innerRow: false }];
const setupId = 'setup-1';

function makeWine(overrides: Partial<WineItem> & { iWine: string; Quantity: string; placements?: WineItem['placements'] }): WineItem {
  return {
    WineBarcode: '',
    Pending: '0',
    Size: '750',
    Price: '0',
    Valuation: '0',
    MyValue: '0',
    MenuPrice: '0',
    Currency: 'USD',
    Vintage: '2020',
    Wine: 'Test Wine',
    Locale: '',
    Country: '',
    Region: '',
    SubRegion: '',
    Appellation: '',
    Producer: '',
    SortProducer: '',
    Type: 'Red',
    Color: 'Red',
    Category: '',
    Varietal: '',
    MasterVarietal: '',
    Designation: '',
    Vineyard: '',
    CT: '',
    CNotes: '',
    BeginConsume: '',
    EndConsume: '',
    UPC: '',
    ...overrides,
  };
}

function renderStorage(inventory: InventoryMatrix = {}) {
  return render(
    <StorageView setupId={setupId} config={config} inventory={inventory} />,
  );
}

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectedWine = undefined;
});

describe('Storage slot selection', () => {
  it('Test 1 — fully placed wine + empty slot → slot selected, wine deselected', () => {
    mockSelectedWine = makeWine({
      iWine: 'wine-1',
      Quantity: '2',
      placements: [
        { setupId, shelf: 1, layer: 1, slot: 2 },
        { setupId, shelf: 1, layer: 1, slot: 3 },
      ],
    });

    renderStorage();

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // slot 1 — empty

    expect(mockSetSelectedPosition).toHaveBeenCalledWith({ setupId, shelf: 1, layer: 1, slot: 1 });
    expect(mockSetSelectedWineId).toHaveBeenCalledWith(undefined);
    expect(mockFetcherSubmit).not.toHaveBeenCalled();
  });

  it('Test 2 — not fully placed wine + empty slot → wine placed', () => {
    mockSelectedWine = makeWine({
      iWine: 'wine-1',
      Quantity: '3',
      placements: [{ setupId, shelf: 1, layer: 1, slot: 2 }],
    });

    renderStorage();

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // slot 1 — empty

    expect(mockFetcherSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'add', iWine: 'wine-1' }),
      expect.anything(),
    );
    expect(mockSetSelectedWineId).not.toHaveBeenCalledWith(undefined);
  });

  it('Test 3 — occupied slot → selects that wine', () => {
    mockSelectedWine = undefined;

    const wine2 = makeWine({ iWine: 'wine-2', Quantity: '1' });
    const inventory: InventoryMatrix = { 1: { 1: { 1: wine2 } } };

    renderStorage(inventory);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // slot 1 — occupied by wine-2

    expect(mockSetSelectedWineId).toHaveBeenCalledWith('wine-2');
    expect(mockSetSelectedPosition).not.toHaveBeenCalled();
  });
});
