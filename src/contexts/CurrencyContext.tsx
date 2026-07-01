
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export type Currency = 'EGY' | 'SAR' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (price: number) => string;
  formatPriceByCurrency: (priceEGY: number, targetCurrency: Currency) => string;
  convertPrice: (priceEGY: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_SYMBOLS = {
  EGY: 'EGY',
  SAR: 'ر.س',
  USD: '$',
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('store_currency');
    return (saved as Currency) || 'EGY';
  });

  const [rates, setRates] = useState({
    EGY: 1,
    SAR: 0.13,
    USD: 0.021,
  });

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const { data } = await supabase.from('settings').select('instagram_handle').single();
        if (data?.instagram_handle) {
          try {
            const parsed = JSON.parse(data.instagram_handle);
            if (parsed.usd && parsed.sar) {
              if (parsed.auto) {
                // Fetch live rates
                try {
                  const usdRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                  const usdData = await usdRes.json();
                  const usdRate = usdData.rates.EGP; // EGP per 1 USD
                  
                  const sarRes = await fetch('https://api.exchangerate-api.com/v4/latest/SAR');
                  const sarData = await sarRes.json();
                  const sarRate = sarData.rates.EGP; // EGP per 1 SAR
                  
                  setRates({
                    EGY: 1,
                    SAR: 1 / Number(sarRate),
                    USD: 1 / Number(usdRate),
                  });
                } catch (e) {
                  console.error('Failed to fetch live rates, falling back to manual');
                  setRates({
                    EGY: 1,
                    SAR: 1 / Number(parsed.sar),
                    USD: 1 / Number(parsed.usd),
                  });
                }
              } else {
                setRates({
                  EGY: 1,
                  SAR: 1 / Number(parsed.sar),
                  USD: 1 / Number(parsed.usd),
                });
              }
            }
          } catch (e) {
            // Not JSON or missing fields, keep default rates
          }
        }
      } catch (err) {
        console.error('Error fetching currency rates:', err);
      }
    };
    fetchRates();
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('store_currency', c);
  };

  const convertPrice = (priceEGY: number) => {
    return priceEGY * rates[currency];
  };

  const formatPriceByCurrency = (priceEGY: number, targetCurrency: Currency) => {
    const converted = priceEGY * rates[targetCurrency];
    const symbol = CURRENCY_SYMBOLS[targetCurrency];
    
    // تنسيق الأرقام
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: converted % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(converted);

    return `${formatted} ${symbol}`;
  };

  const formatPrice = (priceEGY: number) => {
    return formatPriceByCurrency(priceEGY, currency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, formatPriceByCurrency, convertPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
