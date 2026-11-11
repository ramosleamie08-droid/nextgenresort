export type Category = 'all' | 'day' | 'night' | 'rooms' | 'halls' | 'extras';

export type ListingCategory = 'day' | 'night' | 'rooms' | 'halls' | 'extras';

export interface ListingOption {
  id: string;
  name: string;
  price: number;
}

export interface Listing {
  id: string;
  name: string;
  label: string;
  category: ListingCategory;
  price: number;
  priceText: string;
  image: string;
  description: string;
  tags: string[];
  maxGuests?: number;
  perPerson?: boolean;
  kidPrice?: number;
  options?: ListingOption[];
}

// Absolute path para sa GitHub Pages
const img = (name: string) => `/nextgenresort/${name}`;

export const formatPeso = (amount: number) =>
  `₱${amount.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;

export const LISTINGS: Listing[] = [
  {
    id: 'day-tour',
    name: 'Day Tour Package',
    label: 'Day Tour Packages',
    category: 'day',
    price: 50,
    priceText: 'Starts at ₱50',
    image: img('494517900_716753637549759_375016760891777905_n.jpg'),
    description: 'Enjoy a full day of swimming and relaxation. Includes access to the pool and cottages.',
    tags: ['Entrance + Cottage', 'Open 9am - 6pm'],
    perPerson: true,
    options: [
      { id: 'day-cottage', name: 'Day Tour Cottage', price: 400 },
    ],
  },
  {
    id: 'night-tour',
    name: 'Night Tour Package',
    label: 'Night Tour Packages',
    category: 'night',
    price: 70,
    priceText: 'Starts at ₱70',
    image: img('486122217_684413427450447_6378603950109487763_n.jpg'),
    description: 'Experience the resort at night with our night tour package. Perfect for romantic evenings.',
    tags: ['Entrance + Cottage', 'Open 6pm - 10pm'],
    perPerson: true,
    options: [
      { id: 'night-cottage', name: 'Night Tour Cottage', price: 500 },
    ],
  },
  {
    id: 'couple-room',
    name: 'Couple Room (Max of 4)',
    label: 'Rooms',
    category: 'rooms',
    price: 2000,
    priceText: '₱2,000',
    image: img('4f1179bd-a614-4e6b-a762-3d1f233744c0.png'),
    description: 'Cozy air-conditioned room perfect for couples or small families. Includes private restroom and 24-hour stay.',
    tags: ['Airconditioned', 'Private Restroom', '24 hrs stay'],
    maxGuests: 4,
  },
  {
    id: 'family-room',
    name: 'Family or Barkada Room (4-8 pax)',
    label: 'Rooms',
    category: 'rooms',
    price: 2000,
    priceText: '₱2,000',
    image: img('752f06fc-84c0-443a-adb4-545c4b542f95.png'),
    description: 'Spacious room for the whole family or barkada. Features air-conditioning and a private restroom.',
    tags: ['Airconditioned', 'Private Restroom', '24 hrs stay'],
    maxGuests: 8,
  },
  {
    id: 'family-room-large',
    name: 'Family Room (10-20 pax)',
    label: 'Rooms',
    category: 'rooms',
    price: 3500,
    priceText: '₱3,500',
    image: img('388f953c-d299-4e12-8b36-14c610f1ad0d.png'),
    description: 'Large family room for bigger groups. Equipped with air-conditioning, private restroom, and ample space.',
    tags: ['Airconditioned', 'Private Restroom', '24 hrs stay'],
    maxGuests: 20,
  },
  {
    id: 'mini-function-hall',
    name: 'Mini Function Hall (Max of 30 persons)',
    label: 'Function Halls',
    category: 'halls',
    price: 5000,
    priceText: '₱5,000',
    image: img('ca866647fafee9cdbc055feb3f27cd1e.jpg'),
    description: 'Perfect venue for small events, birthdays, and gatherings. Air-conditioned with a spacious area.',
    tags: ['Airconditioned', 'Good for 30 pax'],
    maxGuests: 30,
  },
  {
    // TODO: PALITAN ang presyo, kapasidad at description ng totoong detalye
    id: 'large-function-hall',
    name: 'Large Function Hall (Max of 100 persons)', // TODO: tamang kapasidad
    label: 'Function Halls',
    category: 'halls',
    price: 10000, // TODO: tamang presyo
    priceText: '₱10,000', // TODO: dapat tugma sa price
    image: img('f812eaef86f96ee74947afafe18530f6.jpg'),
    description: 'Spacious venue for big events, weddings, reunions, and celebrations.', // TODO
    tags: ['Airconditioned', 'Good for 100 pax'], // TODO
    maxGuests: 100, // TODO
  },
  {
    id: 'videoke',
    name: 'Videoke Rental',
    label: 'Extras',
    category: 'extras',
    price: 500,
    priceText: '₱500',
    image: img('renta-de-karaoke-en-cdmx-renta-de-karaoke-rockola-karaoke-alquiler-de-karaoke-ciudad-de-mexico-02.webp'),
    description: 'Sing your heart out with our videoke rental. Perfect for bonding with family and friends.',
    tags: ['Unlimited songs', '2 hours use'],
  },
];