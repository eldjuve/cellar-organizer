import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { WineItem } from '../../types';

// --- Mocks ---

const mockSetSelectedWineId = vi.fn();
const mockSetSelectedPosition = vi.fn();
let mockSelectedWine: WineItem | undefined = undefined;
let mockSelectedPosition: import('../../types').BottlePlacement | undefined = undefined;

vi.mock('../../app/components/AppContextProvider', () => ({
  useAppContext: () => ({
    selectedWine: mockSelectedWine,
    setSelectedWineId: mockSetSelectedWineId,
    setSelectedPosition: mockSetSelectedPosition,
    selectedPosition: mockSelectedPosition,
    activeTab: 'wine-list' as const,
    toggleTab: vi.fn(),
    setActiveTab: vi.fn(),
  }),
}));

import { WineRow } from '../../app/components/wine-list/WineRow';

// --- Helpers ---

function makeWine(overrides: Partial<WineItem> & { iWine: string; Quantity: string }): WineItem {
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
    placements: [],
    ...overrides,
  };
}

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectedWine = undefined;
  mockSelectedPosition = undefined;
});

describe('WineRow', () => {
  it('clicking a wine row does NOT clear selectedPosition', () => {
    // Regression: previously handleClick called setSelectedPosition(undefined) before
    // setSelectedWineId, so the async auto-placement effect found no position to place at.
    mockSelectedPosition = { setupId: 'setup-1', shelf: 1, layer: 1, slot: 1 };

    const wine = makeWine({ iWine: 'wine-1', Quantity: '2', placements: [] });
    render(<WineRow wine={wine} />);

    fireEvent.click(screen.getByRole('button'));

    expect(mockSetSelectedPosition).not.toHaveBeenCalled();
    expect(mockSetSelectedWineId).toHaveBeenCalledWith('wine-1');
  });

  it('clicking a wine row calls setSelectedWineId with the wine id', () => {
    const wine = makeWine({ iWine: 'wine-42', Quantity: '1', placements: [] });
    render(<WineRow wine={wine} />);

    fireEvent.click(screen.getByRole('button'));

    expect(mockSetSelectedWineId).toHaveBeenCalledWith('wine-42');
  });

  it('wine row is disabled when selectedPosition is set and wine is fully stored', () => {
    mockSelectedPosition = { setupId: 'setup-1', shelf: 1, layer: 1, slot: 1 };

    const wine = makeWine({
      iWine: 'wine-1',
      Quantity: '1',
      placements: [{ setupId: 'setup-1', shelf: 1, layer: 1, slot: 2 }],
    });
    render(<WineRow wine={wine} />);

    expect(screen.getByRole('button', { hidden: true })).toHaveProperty('disabled', true);
  });

  it('wine row is enabled when selectedPosition is set but wine has room', () => {
    mockSelectedPosition = { setupId: 'setup-1', shelf: 1, layer: 1, slot: 1 };

    const wine = makeWine({ iWine: 'wine-1', Quantity: '2', placements: [] });
    render(<WineRow wine={wine} />);

    expect(screen.getByRole('button')).toHaveProperty('disabled', false);
  });
});
