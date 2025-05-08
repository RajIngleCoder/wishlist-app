import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Product } from '../types';

// Enhanced mock product data with more realistic examples
const mockProducts = {
  amazon: {
    'headphones': {
      id: '1',
      title: 'Sony WH-1000XM4 Wireless Noise Cancelling Headphones',
      description: 'Industry-leading noise canceling with Dual Noise Sensor technology. Next-level music with Edge-AI, co-developed with Sony Music Studios Tokyo.',
      price: '348.00',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      source: 'amazon',
      rating: 4.8,
      reviews: 2345,
      url: 'https://amazon.com/sony-wh1000xm4',
      metadata: {
        brand: 'Sony',
        availability: 'In Stock',
        specifications: {
          'Battery Life': 'Up to 30 hours',
          'Color': 'Black',
          'Connectivity': 'Bluetooth 5.0'
        }
      }
    },
    'default': {
      id: '2',
      title: 'Amazon Basic Product',
      description: 'High-quality Amazon product with premium features',
      price: '199.99',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
      source: 'amazon',
      rating: 4.5,
      reviews: 1234,
      metadata: {
        brand: 'Amazon Basics',
        availability: 'In Stock',
      }
    }
  },
  etsy: {
    'wallet': {
      id: '3',
      title: 'Handcrafted Leather Wallet',
      description: 'Premium handmade leather wallet, carefully crafted with genuine full-grain leather. Perfect for everyday use with multiple card slots and bill compartments.',
      price: '45.00',
      imageUrl: 'https://images.unsplash.com/photo-1627123364843-8c6b67b7a402?w=500',
      source: 'etsy',
      rating: 4.9,
      reviews: 856,
      url: 'https://etsy.com/handmade-wallet',
      metadata: {
        brand: 'LeatherCraft',
        availability: 'Made to order',
        specifications: {
          'Material': 'Full grain leather',
          'Color': 'Brown',
          'Dimensions': '4.5" x 3.5"'
        }
      }
    },
    'default': {
      id: '4',
      title: 'Handmade Etsy Item',
      description: 'Beautifully crafted handmade item from a skilled artisan',
      price: '59.99',
      imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=500',
      source: 'etsy',
      rating: 4.7,
      reviews: 432,
      metadata: {
        brand: 'Artisan Crafts',
        availability: 'Ready to ship',
      }
    }
  }
};

export async function searchProducts(query: string, source?: string): Promise<Product[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  if (source && source !== 'all') {
    return Object.values(mockProducts[source as keyof typeof mockProducts]);
  }
  
  return [
    ...Object.values(mockProducts.amazon),
    ...Object.values(mockProducts.etsy)
  ];
}

const apiKey = '52867b966adef06916a4043ed1fd4783'; // Replace with your actual API key

export async function scrapeProductInfo(url: string): Promise<Partial<Product> | null> {
  try {
    const scraperApiUrl = `https://api.scraperapi.com?api_key=${apiKey}&autoparse=true&url=${encodeURIComponent(url)}`;
    const response = await axios.get(scraperApiUrl);

    if (response.status !== 200) {
      console.error('ScraperAPI request failed:', response.status, response.statusText);
      return null;
    }

    const productData = response.data;
    console.log('ScraperAPI productData:', { productData });

    const $ = cheerio.load(productData);
    const captchaCheck = $('form[name="captcha"]').length > 0;

    if (captchaCheck) {
      console.log('CAPTCHA detected');
      return {
        title: 'CAPTCHA Detected',
        description: 'The scraper was blocked by a CAPTCHA. Please try again later.',
        price: 'Price Not Found',
        imageUrl: null,
      };
    }

    // Extract relevant product information from ScraperAPI response
    const title = productData.name || 'Product Title Not Found';
    let description = 'Description Not Found';
    const aboutItemSection = $('div#feature-bullets ul li');
    if (aboutItemSection.length > 0) {
      description = aboutItemSection.slice(0, 2).map((_, el) => $(el).text().trim()).get().join(' ');
    } else if (productData.small_description) {
      description = productData.small_description;
    } else if (productData.feature_bullets) {
        description = productData.feature_bullets.slice(0, 2).join(' ');
    }
    let price = productData.pricing || 'Price Not Found';
    if (typeof price === 'string') {
      price = price.replace(/[$,]/g, '');
    }
    const imageUrl = productData.images ? productData.images[0] : null;

    return {
      title,
      description,
      price,
      imageUrl,
    };
  } catch (error: any) {
    console.error('Error scraping product info with ScraperAPI:', error);
    return null;
  }
}
