import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { WineItem, WineMatrix, ShelfProps } from '../../types';

// --- Mocks ---

const mockFetcherSubmit = vi.fn();
vi.mock('react-router', () => ({
  useFetcher: () => ({ submit: mockFetcherSubmit, data: undefined, state: 'idle' }),
  useRevalidator: () => ({ revalidate: vi.fn(), state: 'idle' }),
}));

const mockSetSelectedWineId = vi.fn();
const mockSetSelectedPosition = vi.fn();
let mockSelectedWine: WineItem | undefined = undefined;

let mockSelectedPosition: import('../../types').BottlePlacement | undefined = undefined;

vi.mock('../../app/components/AppContextProvider', () => ({
  useAppContext: () => ({
    selectedWine: mockSelectedWine,
    setSelectedWineId: mockSetSelectedWineId,
    setSelectedPosition: mockSetSelectedPosition,
    activeTab: 'storage' as const,
    toggleTab: vi.fn(),
    setActiveTab: vi.fn(),
    selectedPosition: mockSelectedPosition,
  }),
}));

vi.mock('../../app/components/Storage/Selected', () => ({
  Display: () => null,
}));

// --- Helpers ---

import { StorageView } from '../../app/components/storage/StorageView';

const config: ShelfProps[] = [{ capacity: 3, innerRow: false }];
const configId = 'setup-1';

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

function renderStorage(inventory: WineMatrix = {}) {
  return render(
    <StorageView configId={configId} config={config} wineMatrix={inventory} />,
  );
}

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectedWine = undefined;
  mockSelectedPosition = undefined;
});

describe('Storage slot selection', () => {
  it('Test 1 — fully placed wine + empty slot → slot selected, wine deselected', () => {
    mockSelectedWine = makeWine({
      iWine: 'wine-1',
      Quantity: '2',
      placements: [
        { configId, shelf: 1, layer: 1, slot: 2 },
        { configId, shelf: 1, layer: 1, slot: 3 },
      ],
    });

    renderStorage();

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // slot 1 — empty

    expect(mockSetSelectedPosition).toHaveBeenCalledWith({ configId, shelf: 1, layer: 1, slot: 1 });
    expect(mockSetSelectedWineId).toHaveBeenCalledWith(undefined);
    expect(mockFetcherSubmit).not.toHaveBeenCalled();
  });

  it('Test 2 — not fully placed wine + empty slot → wine placed', () => {
    mockSelectedWine = makeWine({
      iWine: 'wine-1',
      Quantity: '3',
      placements: [{ configId, shelf: 1, layer: 1, slot: 2 }],
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
    const inventory: WineMatrix = { 1: { 1: { 1: wine2 } } };

    renderStorage(inventory);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // slot 1 — occupied by wine-2

    expect(mockSetSelectedWineId).toHaveBeenCalledWith('wine-2');
    expect(mockSetSelectedPosition).not.toHaveBeenCalled();
  });

  it('Test 4 — empty slot, no wine selected → position set, wine cleared', () => {
    mockSelectedWine = undefined;

    renderStorage();

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // slot 1 — empty, no selection

    expect(mockSetSelectedPosition).toHaveBeenCalledWith({ configId, shelf: 1, layer: 1, slot: 1 });
    expect(mockSetSelectedWineId).toHaveBeenCalledWith(undefined);
    expect(mockFetcherSubmit).not.toHaveBeenCalled();
  });

  it('Test 5 — occupied slot, same wine selected → removes placement and re-selects wine', () => {
    const wine1 = makeWine({
      iWine: 'wine-1',
      Quantity: '2',
      placements: [{ configId, shelf: 1, layer: 1, slot: 1 }],
    });
    mockSelectedWine = wine1;

    const inventory: WineMatrix = { 1: { 1: { 1: wine1 } } };
    renderStorage(inventory);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // slot 1 — occupied by same wine

    expect(mockFetcherSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'remove', iWine: 'wine-1', shelf: '1', layer: '1', slot: '1' }),
      expect.anything(),
    );
    expect(mockSetSelectedWineId).toHaveBeenCalledWith('wine-1');
  });

  it('Test 6 — occupied slot, different wine selected → switches selection, no submit', () => {
    mockSelectedWine = makeWine({ iWine: 'wine-1', Quantity: '1', placements: [] });

    const wine2 = makeWine({ iWine: 'wine-2', Quantity: '1' });
    const inventory: WineMatrix = { 1: { 1: { 1: wine2 } } };
    renderStorage(inventory);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // slot 1 — occupied by wine-2

    expect(mockSetSelectedWineId).toHaveBeenCalledWith('wine-2');
    expect(mockFetcherSubmit).not.toHaveBeenCalled();
  });

  it('Test 7 — position pre-selected, not-fully-placed wine selected → wine placed at position', () => {
    mockSelectedPosition = { configId, shelf: 1, layer: 1, slot: 1 };
    mockSelectedWine = makeWine({
      iWine: 'wine-1',
      Quantity: '3',
      placements: [{ configId, shelf: 1, layer: 1, slot: 2 }],
    });

    renderStorage({}); // slot 1 empty in inventory

    expect(mockFetcherSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'add', iWine: 'wine-1', shelf: '1', layer: '1', slot: '1' }),
      expect.anything(),
    );
    expect(mockSetSelectedPosition).toHaveBeenCalledWith(undefined);
  });

  it('Test 8 — coordinate fidelity: second shelf slot passes correct shelf/layer/slot', () => {
    const multiShelfConfig: ShelfProps[] = [
      { capacity: 3, innerRow: false },
      { capacity: 2, innerRow: false },
    ];
    mockSelectedWine = makeWine({ iWine: 'wine-1', Quantity: '5', placements: [] });

    render(<StorageView configId={configId} config={multiShelfConfig} wineMatrix={{}} />);

    const buttons = screen.getAllByRole('button');
    // Shelf 1 has 3 buttons (indices 0–2), shelf 2 starts at index 3
    fireEvent.click(buttons[3]); // first slot of shelf 2

    expect(mockFetcherSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'add', iWine: 'wine-1', shelf: '2', layer: '1', slot: '1' }),
      expect.anything(),
    );
  });
});
