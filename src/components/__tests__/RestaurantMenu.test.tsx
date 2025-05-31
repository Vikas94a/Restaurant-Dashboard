import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '@/store/features/cartSlice';
import RestaurantMenu from '../RestaurantMenu';
import { getDocs, collection } from 'firebase/firestore';
import { useCart } from '@/hooks/useCart';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  getFirestore: jest.fn(() => ({})),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
}));

// Mock useCart hook
jest.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    handleAddToCart: jest.fn(),
    handleIncreaseQuantity: jest.fn(),
    handleDecreaseQuantity: jest.fn(),
    handleRemoveItem: jest.fn(),
    cart: { items: [], total: 0 },
  }),
}));

// Create mock store
const mockStore = configureStore({
  reducer: {
    cart: cartReducer,
  },
});

// Mock restaurant data
const mockRestaurantId = 'test-restaurant';
const mockMenuData = [
  {
    name: 'Appetizers',
    items: [
      {
        id: '1',
        name: 'Test Item',
        price: 9.99,
        description: 'Test description',
        available: true,
      },
    ],
  },
];

describe('RestaurantMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (getDocs as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(
      <Provider store={mockStore}>
        <RestaurantMenu restaurantId={mockRestaurantId} />
      </Provider>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders menu categories and items after loading', async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockMenuData.map(category => ({
        id: category.name,
        data: () => category,
      })),
    });

    render(
      <Provider store={mockStore}>
        <RestaurantMenu restaurantId={mockRestaurantId} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Appetizers')).toBeInTheDocument();
      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.getByText('$9.99')).toBeInTheDocument();
    });
  });

  it('handles adding item to cart', async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockMenuData.map(category => ({
        id: category.name,
        data: () => category,
      })),
    });

    render(
      <Provider store={mockStore}>
        <RestaurantMenu restaurantId={mockRestaurantId} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);

    // Verify cart was updated
    expect(useCart().handleAddToCart).toHaveBeenCalledWith(expect.objectContaining({
      restaurantId: mockRestaurantId,
      itemName: 'Test Item',
      itemPrice: 9.99,
      categoryName: 'Appetizers',
    }));
  });

  it('handles error state', async () => {
    (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <Provider store={mockStore}>
        <RestaurantMenu restaurantId={mockRestaurantId} />
      </Provider>
    );

    // Wait for loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Failed to load menu')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    // Test retry functionality
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [],
    });
    fireEvent.click(screen.getByText('Retry'));
    
    // Wait for loading state again
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByText('No menu items available')).toBeInTheDocument();
    });
  });

  it('handles unavailable items', async () => {
    const unavailableMenuData = [{
      name: 'Appetizers',
      items: [{
        id: '1',
        name: 'Unavailable Item',
        price: 9.99,
        description: 'Test description',
        available: false,
      }],
    }];

    (getDocs as jest.Mock).mockResolvedValue({
      docs: unavailableMenuData.map(category => ({
        id: category.name,
        data: () => category,
      })),
    });

    render(
      <Provider store={mockStore}>
        <RestaurantMenu restaurantId={mockRestaurantId} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Unavailable Item')).toBeInTheDocument();
      expect(screen.getByText('Currently Unavailable')).toBeInTheDocument();
    });
  });

  it('handles category selection', async () => {
    const multiCategoryData = [
      {
        name: 'Appetizers',
        items: [{
          id: '1',
          name: 'Appetizer Item',
          price: 9.99,
          description: 'Test description',
          available: true,
        }],
      },
      {
        name: 'Main Course',
        items: [{
          id: '2',
          name: 'Main Course Item',
          price: 19.99,
          description: 'Test description',
          available: true,
        }],
      },
    ];

    (getDocs as jest.Mock).mockResolvedValue({
      docs: multiCategoryData.map(category => ({
        id: category.name,
        data: () => category,
      })),
    });

    render(
      <Provider store={mockStore}>
        <RestaurantMenu restaurantId={mockRestaurantId} />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Appetizers')).toBeInTheDocument();
      expect(screen.getByText('Main Course')).toBeInTheDocument();
    });

    // Click on Main Course category
    fireEvent.click(screen.getByText('Main Course'));

    // Verify Main Course items are shown
    expect(screen.getByText('Main Course Item')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
  });
}); 