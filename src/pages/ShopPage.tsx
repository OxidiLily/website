import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { shopItemsData } from '../data/siteData';
import { ShopItem } from '../types';
import { ShoppingBag, Star, Check, Sparkles, X, ArrowRight, ShieldCheck, Download, Trash2 } from 'lucide-react';

export const ShopPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<ShopItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const categories = ['All', 'Component Pack', 'Shader & 3D', 'Template', 'Design Kit'];

  const filteredItems = selectedCategory === 'All'
    ? shopItemsData
    : shopItemsData.filter((i) => i.category === selectedCategory);

  const addToCart = (item: ShopItem) => {
    if (!cart.find((c) => c.id === item.id)) {
      setCart([...cart, item]);
    }
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCart([]);
      setCheckoutSuccess(false);
      setIsCartOpen(false);
    }, 2500);
  };

  return (
    <div className="w-full pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            Design Systems & 3D Tools
          </h1>
          <p className="text-neutral-400 text-base sm:text-lg max-w-2xl leading-relaxed">
            Premium component kits, WebGL shaders, icon libraries, and production starter templates built for speed and aesthetics.
          </p>
        </div>

        {/* Cart Trigger */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-white text-sm font-medium transition-all cursor-pointer shadow-md shrink-0"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Cart</span>
          {cart.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-12">
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredItems.map((item, idx) => {
          const isInCart = cart.some((c) => c.id === item.id);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="p-6 sm:p-8 rounded-3xl bg-neutral-950 border border-neutral-900 hover:border-neutral-800 transition-all duration-300 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-medium">
                      {item.category}
                    </span>
                    {item.badge && (
                      <span className="px-2.5 py-0.5 rounded-md bg-neutral-800 text-white text-xs font-semibold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-neutral-400">
                    <Star className="w-3.5 h-3.5 fill-white text-white" />
                    <span className="font-semibold text-white">{item.rating}</span>
                    <span>({item.reviewsCount})</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-neutral-400 text-sm mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Features Checklist */}
                <div className="space-y-2 pt-2">
                  {item.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-xs text-neutral-300">
                      <div className="w-4 h-4 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price & Action */}
              <div className="mt-8 pt-6 border-t border-neutral-900 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-extrabold text-white">
                    ${item.price}
                    {item.originalPrice && (
                      <span className="text-sm font-normal text-neutral-500 line-through ml-2">
                        ${item.originalPrice}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-500">Instant digital download</span>
                </div>

                <button
                  onClick={() => addToCart(item)}
                  disabled={isInCart}
                  className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                    isInCart
                      ? 'bg-neutral-800 text-neutral-400 cursor-default'
                      : 'bg-white text-black hover:bg-neutral-200 active:scale-95 shadow-md'
                  }`}
                >
                  {isInCart ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>In Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Cart Drawer Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md h-full bg-neutral-950 border-l border-neutral-800 p-6 sm:p-8 flex flex-col justify-between z-10 shadow-2xl overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-neutral-900">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-white" />
                    <h2 className="text-xl font-bold text-white">Your Cart ({cart.length})</h2>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 rounded-full bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Cart Items List */}
                <div className="divide-y divide-neutral-900 mt-4 space-y-4">
                  {cart.length === 0 ? (
                    <div className="py-16 text-center text-neutral-500 text-sm">
                      Your cart is currently empty.
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="pt-4 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-white">{item.title}</h4>
                          <p className="text-xs text-neutral-400">{item.category}</p>
                          <span className="text-sm font-semibold text-white mt-1 block">
                            ${item.price}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="pt-6 border-t border-neutral-900 space-y-4">
                  <div className="flex items-center justify-between text-base font-bold text-white">
                    <span>Total Amount</span>
                    <span>${totalAmount}</span>
                  </div>

                  {checkoutSuccess ? (
                    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-700 text-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center mx-auto">
                        <Check className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-semibold text-white">Order Simulated Successfully!</p>
                      <p className="text-xs text-neutral-400">Download links prepared.</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleCheckout}
                      className="w-full py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-neutral-200 transition-all active:scale-95 shadow-xl cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Proceed to Checkout (${totalAmount})</span>
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
