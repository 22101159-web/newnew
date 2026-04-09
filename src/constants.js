import haciendaRusticImg from './assets/images/hacienda-rustic.jpeg';
import oldManilaGlamImg from './assets/images/old-manila-glam.jpeg';
import fiestaTropicalImg from './assets/images/fiesta-tropical.jpeg';
import modernPinasImg from './assets/images/modern-pinas.jpg';
import mariaClaraRoyalImg from './assets/images/maria-clara-royal.jpg';
import nativeBohoImg from './assets/images/native-boho.jpg';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop';
const COMING_SOON_IMAGE = 'https://placehold.co/600x400?text=Coming+Soon';

export const MOCK_PRESETS = [
  { 
    id: 'p1', 
    name: 'Hacienda Rustic', 
    price: 35000, 
    eventType: 'Wedding', 
    description: 'Capiz lanterns, reclaimed wood, and lush local greenery.', 
    imageUrl: haciendaRusticImg,
    specifications: [
      'Signature Tablescape (20-30 people, 3 tables) with Burlap & Lace',
      'Reclaimed Wood Arch with Hanging Capiz Shells',
      'Warm Edison Bulb & Capiz Lantern Installation',
      'Mix of Silk and Premium Local Greenery Arrangements'
    ]
  },
  { 
    id: 'p2', 
    name: 'Modern Pinas', 
    price: 75000, 
    eventType: 'Corporate Celebration', 
    description: 'Sleek abaca accents, geometric capiz, and minimalist local flora.', 
    imageUrl: modernPinasImg,
    specifications: [
      'Geometric Capiz Backdrop (8FT X 8FT)',
      'Abaca-Woven Table Styling (Up to 50 people)',
      'Acrylic Signage with Baybayin Accents',
      'Minimalist Anthurium & Orchid Arrangements'
    ]
  },
  { 
    id: 'p3', 
    name: 'Maria Clara Royal', 
    price: 50000, 
    eventType: 'Wedding', 
    description: 'Inabel fabrics, grand sampaguita scents, and gold-leafed capiz.', 
    imageUrl: mariaClaraRoyalImg,
    specifications: [
      'Tunnel Entrance (10FT X 10FT X 10FT) in Inabel Fabric Manipulation',
      'Signature Tablescape (50-80 people, 8-10 tables) with Gold-Leafed Capiz',
      'Premium Brass Candelabras and Hand-Woven Runners',
      'Grand Premium Floral Arrangements (Silk & Fresh Sampaguita Mix)'
    ]
  },
  { 
    id: 'p4', 
    name: 'Native Boho', 
    price: 45000, 
    eventType: 'Birthday', 
    description: 'Rattan weaves, banig runners, and dried anahaw leaves.', 
    imageUrl: nativeBohoImg,
    specifications: [
      'Dried Anahaw & Pampas Backdrop with Rattan Accents',
      'Low-Seating Banig Picnic Tablescape (20 people)',
      'Earthy Toned Saguran Fabric Draping',
      'Dried Local Blooms and Silk Floral Mix'
    ]
  },
  { 
    id: 'p5', 
    name: 'Old Manila Glam', 
    price: 50000, 
    eventType: 'Reunion', 
    description: 'Vintage sarswela vibes, barong-inspired drapes, and pastel blooms.', 
    imageUrl: oldManilaGlamImg,
    specifications: [
      'Ancestral Home Style Lounge Setup with Solihiya Chairs',
      'Barong-Lace Draped Tablescape (40 people)',
      'Vintage Brass Accents and Soft Pastel Local Florals',
      'Fabric Manipulation Backdrop with Piña Cloth Accents'
    ]
  },
  { 
    id: 'p6', 
    name: 'Fiesta Tropical', 
    price: 30000, 
    eventType: 'Birthday', 
    description: 'Bamboo structures, vibrant banderitas, and exotic local flowers.', 
    imageUrl: fiestaTropicalImg,
    specifications: [
      'Bamboo Arch with Vibrant Heliconia Arrangements',
      'Modern Fiesta Tablescape (30 people) with Colorful Accents',
      'Bamboo and Rattan Decorative Fiesta Elements',
      'Mix of Silk Tropical Local Florals'
    ]
  },
];

export const EVENT_TYPES = ['All', 'Wedding', 'Birthday', 'Reunion', 'Corporate Celebration', 'Others'];
