document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Cart State
    let cart = JSON.parse(localStorage.getItem('brittle_cart')) || [];

    // 2. Inject Cart UI into DOM
    const cartOverlay = document.createElement('div');
    cartOverlay.id = 'cart-overlay';
    cartOverlay.className = 'fixed inset-0 bg-black/50 z-[100] hidden opacity-0 transition-opacity duration-300';
    
    const cartDrawer = document.createElement('div');
    cartDrawer.id = 'cart-drawer';
    cartDrawer.className = 'fixed top-0 right-0 h-full w-full max-w-md bg-surface-container-lowest shadow-2xl z-[101] transform translate-x-full transition-transform duration-300 flex flex-col';
    
    cartDrawer.innerHTML = `
        <div class="p-6 flex items-center justify-between border-b border-outline-variant/30">
            <h2 class="font-headline-md text-headline-md text-on-background">장바구니</h2>
            <button id="close-cart-btn" class="text-on-surface-variant hover:text-primary transition-colors">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">close</span>
            </button>
        </div>
        <div id="cart-items-container" class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Cart items will be rendered here -->
        </div>
        <div class="p-6 border-t border-outline-variant/30 bg-surface">
            <div class="flex justify-between items-center mb-6">
                <span class="font-body-lg text-body-lg text-on-surface-variant">총 결제금액</span>
                <span id="cart-total" class="font-headline-md text-headline-md text-primary">₩0</span>
            </div>
            <button id="checkout-btn" class="w-full bg-primary text-on-primary rounded-full py-4 font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-md">
                결제하기
            </button>
        </div>
    `;

    document.body.appendChild(cartOverlay);
    document.body.appendChild(cartDrawer);

    // 3. Select Elements
    const cartToggleBtns = document.querySelectorAll('.cart-toggle-btn');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalEl = document.getElementById('cart-total');

    // 4. Cart Functions
    const saveCart = () => {
        localStorage.setItem('brittle_cart', JSON.stringify(cart));
        updateCartBadge();
        renderCartItems();
    };

    window.addToCart = (id, name, price, image) => {
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, image, quantity: 1 });
        }
        saveCart();
        openCart();
    };

    window.updateQuantity = (id, change) => {
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            saveCart();
        }
    };

    window.removeFromCart = (id) => {
        cart = cart.filter(item => item.id !== id);
        saveCart();
    };

    const updateCartBadge = () => {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartToggleBtns.forEach(btn => {
            let badge = btn.querySelector('.cart-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'cart-badge absolute -top-1 -right-1 bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center';
                btn.style.position = 'relative';
                btn.appendChild(badge);
            }
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'block' : 'none';
        });
    };

    const renderCartItems = () => {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-60">
                    <span class="material-symbols-outlined text-6xl mb-4" style="font-variation-settings: 'FILL' 0;">shopping_bag</span>
                    <p class="font-body-md text-body-md">장바구니가 비어있습니다.</p>
                </div>
            `;
            cartTotalEl.textContent = '₩0';
            return;
        }

        let total = 0;
        cartItemsContainer.innerHTML = cart.map(item => {
            total += item.price * item.quantity;
            return `
                <div class="flex gap-4 items-center">
                    <div class="w-20 h-20 rounded-lg overflow-hidden border border-outline-variant/30 flex-shrink-0">
                        <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1">
                        <h3 class="font-label-md text-label-md text-on-background mb-1">${item.name}</h3>
                        <p class="font-body-md text-body-md text-primary mb-2">₩${item.price.toLocaleString()}</p>
                        <div class="flex items-center gap-3">
                            <button onclick="updateQuantity('${item.id}', -1)" class="w-6 h-6 rounded-full border border-outline flex items-center justify-center text-on-background hover:bg-surface-variant transition-colors">-</button>
                            <span class="font-label-sm text-label-sm w-4 text-center">${item.quantity}</span>
                            <button onclick="updateQuantity('${item.id}', 1)" class="w-6 h-6 rounded-full border border-outline flex items-center justify-center text-on-background hover:bg-surface-variant transition-colors">+</button>
                        </div>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" class="text-on-surface-variant hover:text-error transition-colors p-2">
                        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">delete</span>
                    </button>
                </div>
            `;
        }).join('');

        cartTotalEl.textContent = `₩${total.toLocaleString()}`;
    };

    // 5. UI Controls
    const openCart = () => {
        cartOverlay.classList.remove('hidden');
        // Trigger reflow
        void cartOverlay.offsetWidth;
        cartOverlay.classList.remove('opacity-0');
        cartDrawer.classList.remove('translate-x-full');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    const closeCart = () => {
        cartOverlay.classList.add('opacity-0');
        cartDrawer.classList.add('translate-x-full');
        document.body.style.overflow = '';
        setTimeout(() => {
            cartOverlay.classList.add('hidden');
        }, 300);
    };

    // 6. Event Listeners
    cartToggleBtns.forEach(btn => btn.addEventListener('click', openCart));
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if(cart.length === 0) return alert('장바구니가 비어있습니다.');
        window.location.href = 'checkout.html';
    });

    // 7. Initial Render
    updateCartBadge();
    renderCartItems();
});
