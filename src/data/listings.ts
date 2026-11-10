export type Category = 'all' | 'day' | 'night' | 'rooms' | 'halls' | 'extras';
export type ListingCategory = Exclude<Category, 'all'>;

export interface CottageOption {
  id: string;
  name: string;
  price: number;
}

export interface Listing {
  id: string;
  name: string;
  category: ListingCategory;
  label: string;
  priceText: string;
  price: number;        // Tours: entrance ng adult. Iba: fixed na presyo.
  kidPrice?: number;    // Tours lang: entrance ng bata
  perPerson?: boolean;  // true = may bayad kada tao (adult/kids)
  maxGuests?: number;   // limit ng tao (rooms/halls)
  tags: string[];
  image: string;
  description: string;
  options?: CottageOption[];
}

export const formatPeso = (n: number) => `₱${n.toLocaleString('en-PH')}`;

// Larawan (nasa /public)
const IMG_DAY = '/486122217_684413427450447_6378603950109487763_n.jpg';
const IMG_NIGHT = '/494517900_716753637549759_375016760891777905_n.jpg';
const IMG_COUPLE = '/752f06fc-84c0-443a-adb4-545c4b542f95.png';
const IMG_BARKADA = '/4f1179bd-a614-4e6b-a762-3d1f233744c0.png';
const IMG_FAMILY = '/388f953c-d299-4e12-8b36-14c610f1ad0d.png';
const IMG_MINI_HALL = '/ca866647fafee9cdbc055feb3f27cd1e.jpg';
const IMG_BIG_HALL = '/f812eaef86f96ee74947afafe18530f6.jpg';

const LARGE_COTTAGE: CottageOption = { id: 'large-cottage', name: 'Large Cottage (20-30 pax)', price: 3500 };

export const LISTINGS: Listing[] = [
  {
    id: 'day-tour',
    name: 'Day Tour Package',
    category: 'day',
    label: 'Day Tour Packages',
    priceText: 'Starts at ₱50',
    price: 50,
    kidPrice: 50, // PALITAN kung iba ang presyo ng bata
    perPerson: true,
    tags: ['Entrance + Cottage', 'Open 9am - 6pm'],
    image: IMG_DAY,
    description:
      'Enjoy the pool and the resort grounds all day. Entrance fee is per person, and you choose a cottage for your group.',
    options: [{ id: 'day-cottage', name: 'Day Tour Cottage', price: 400 }, LARGE_COTTAGE],
  },
  {
    id: 'night-tour',
    name: 'Night Tour Package',
    category: 'night',
    label: 'Night Tour Packages',
    priceText: 'Starts at ₱70',
    price: 70,
    kidPrice: 70, // PALITAN kung iba ang presyo ng bata
    perPerson: true,
    tags: ['Entrance + Cottage', 'Open 6pm - 10pm'],
    image: IMG_NIGHT,
    description:
      'Swim and relax under the lights. Entrance fee is per person, and you choose a cottage for your group.',
    options: [{ id: 'night-cottage', name: 'Night Tour Cottage', price: 500 }, LARGE_COTTAGE],
  },
  {
    id: 'couple-room',
    name: 'Couple Room (Max of 4)',
    category: 'rooms',
    label: 'Rooms',
    priceText: '₱2,000',
    price: 2000,
    maxGuests: 4,
    tags: ['Airconditioned', 'Private Restroom', '24 hrs stay'],
    image: IMG_COUPLE,
    description: 'A comfortable airconditioned room with a private restroom. Good for couples, up to 4 persons.',
  },
  {
    id: 'barkada-room',
    name: 'Family or Barkada Room (4-8 pax)',
    category: 'rooms',
    label: 'Rooms',
    priceText: '₱2,000',
    price: 2000,
    maxGuests: 8,
    tags: ['Airconditioned', 'Private Restroom', '24 hrs stay'],
    image: IMG_BARKADA,
    description: 'A spacious room for families or barkada, good for 4 to 8 persons.',
  },
  {
    id: 'family-room',
    name: 'Family Room (10-20 pax)',
    category: 'rooms',
    label: 'Rooms',
    priceText: '₱4,000',
    price: 4000,
    maxGuests: 20,
    tags: ['Airconditioned', 'Private Restroom', '24 hrs stay'],
    image: IMG_FAMILY,
    description: 'Our biggest room, good for large families and groups of 10 to 20 persons.',
  },
  {
    id: 'mini-hall',
    name: 'Mini Function Hall (Max of 30 persons)',
    category: 'halls',
    label: 'Function Halls',
    priceText: '₱3,500',
    price: 3500,
    maxGuests: 30,
    tags: ['Max of 30 persons'],
    image: IMG_MINI_HALL,
    description: 'A cozy hall for small gatherings, birthdays and meetings, up to 30 persons.',
  },
  {
    id: 'function-hall',
    name: 'Function Hall (20-50 pax)',
    category: 'halls',
    label: 'Function Halls',
    priceText: '₱6,500',
    price: 6500,
    maxGuests: 50,
    tags: ['20-50 pax'],
    image: IMG_BIG_HALL,
    description: 'A spacious hall for parties, reunions and events, for 20 to 50 persons.',
  },
  {
    id: 'videoke',
    name: 'Videoke Rental',
    category: 'extras',
    label: 'Extras',
    priceText: '₱500',
    price: 500,
    tags: ['Extra'],
    image: IMG_NIGHT, // PALITAN ng larawan ng videoke
    description: 'Rent a videoke set for your stay.',
  },
  {
    id: 'all-in',
    name: 'All-In Package',
    category: 'extras',
    label: 'Extras',
    priceText: '₱23,000',
    price: 23000,
    tags: ['All-in'],
    image: IMG_BIG_HALL, // PALITAN ng larawan ng All-In
    description: 'The all-in package for big events.', // PALITAN: ilagay ang laman ng package
  },
];