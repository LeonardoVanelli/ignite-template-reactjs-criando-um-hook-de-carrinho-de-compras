import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')
    
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    
    return [];
  });

  // useEffect(() => {
  //   localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
  // }, [cart])
  
  const addProduct = async (productId: number) => {
    try {
      const productExistent = cart.find(product => product.id === productId)
            
      const { data } = await api.get<Stock>(`stock/${productId}`);
      const stockAmount = data.amount;

      if (!stockAmount) {
        toast.error('Erro na adição do produto');
        return;
      }

      if ((stockAmount - (productExistent?.amount ?? 0)) <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      var newCart: Product[];
      if (productExistent) {
        newCart = cart.map(product => {
          if (product.id === productId)
            product.amount++

          return product;
        })

        setCart(newCart);        
      } else {
        const response = await api.get<Product>(`products/${productId}`)
        const product = response.data;
          
        newCart = [
          ...cart,
          {
            ...product,
            amount: 1
          }
        ];
        setCart(newCart)
      }
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch(err) {      
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try { 
      const product = cart.find(product => product.id === productId);
      if (!product) {
        toast.error('Erro na remoção do produto');
        return;
      }

      const newCart = cart.filter(product => product.id !== productId);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) 
        return;

      const productExistent = cart.find(product => product.id === productId)
      
      if (amount > (productExistent?.amount ?? 0)){
        const { data } = await api.get<Stock>(`stock/${productId}`);
        const stockAmount = data.amount;
  
        if ((stockAmount - (productExistent?.amount ?? 0)) <= 0) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      }

      const newCart = cart.map(product => {
        if (product.id === productId)
          product.amount = amount;

        return product;
      })

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto'); 
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
