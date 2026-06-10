import { db } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Cart
    let cart = JSON.parse(localStorage.getItem('brittle_cart')) || [];
    
    if (cart.length === 0) {
        alert('장바구니가 비어있습니다. 쇼핑을 먼저 진행해주세요.');
        window.location.href = 'index.html';
        return;
    }

    // 2. Render Order Summary
    const checkoutItemsEl = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('summary-subtotal');
    const totalEl = document.getElementById('summary-total');
    
    let subtotal = 0;
    const shipping = 3000;

    checkoutItemsEl.innerHTML = cart.map(item => {
        subtotal += item.price * item.quantity;
        return `
            <div class="flex gap-4 items-center p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <div class="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1">
                    <h4 class="font-label-md text-on-background">${item.name}</h4>
                    <p class="font-body-md text-on-surface-variant text-sm">수량: ${item.quantity}개</p>
                </div>
                <div class="font-label-md text-primary">
                    ₩${(item.price * item.quantity).toLocaleString()}
                </div>
            </div>
        `;
    }).join('');

    const total = subtotal + shipping;
    subtotalEl.textContent = `₩${subtotal.toLocaleString()}`;
    totalEl.textContent = `₩${total.toLocaleString()}`;

    // 3. Initialize PortOne
    // 테스트용 식별코드 (실제 서비스시 가입 후 발급받은 코드 사용)
    const IMP = window.IMP; 
    IMP.init("imp14397622"); 

    // 4. Handle Payment Button Click
    const payBtn = document.getElementById('pay-btn');
    payBtn.addEventListener('click', () => {
        // Validate Inputs
        const name = document.getElementById('buyer-name').value;
        const tel = document.getElementById('buyer-tel').value;
        const email = document.getElementById('buyer-email').value;
        const addr = document.getElementById('buyer-addr').value;
        const postcode = document.getElementById('buyer-postcode').value;

        if (!name || !tel) {
            alert('이름과 연락처를 입력해주세요.');
            return;
        }

        // Get selected payment method
        const selectedPg = document.querySelector('input[name="payment-method"]:checked').value;
        
        let pgProvider = "";
        if (selectedPg === 'kakaopay') {
            pgProvider = "kakaopay.TC0ONETIME"; // 카카오페이 테스트 CID
        } else if (selectedPg === 'naverpay') {
            pgProvider = "naverpay";
        }

        const orderName = cart.length > 1 ? `${cart[0].name} 외 ${cart.length - 1}건` : cart[0].name;

        // Call PortOne request_pay
        IMP.request_pay({
            pg: pgProvider,
            pay_method: "card",
            merchant_uid: "order_" + new Date().getTime(),
            name: orderName,
            amount: total,
            buyer_email: email || "test@example.com",
            buyer_name: name,
            buyer_tel: tel,
            buyer_addr: addr || "서울시 강남구",
            buyer_postcode: postcode || "12345",
        }, async function (rsp) {
            if (rsp.success) {
                try {
                    // Firebase DB 저장
                    await addDoc(collection(db, "orders"), {
                        orderId: rsp.merchant_uid,
                        buyer: {
                            name: name,
                            email: email || "test@example.com",
                            tel: tel,
                            address: addr || "서울시 강남구",
                            postcode: postcode || "12345"
                        },
                        items: cart,
                        totalAmount: total,
                        paymentMethod: selectedPg,
                        createdAt: new Date().toISOString()
                    });
                    
                    alert(`결제가 완료되었습니다. 주문번호: ${rsp.merchant_uid}`);
                    localStorage.removeItem('brittle_cart');
                    window.location.href = 'index.html';
                } catch (e) {
                    console.error("Error adding document: ", e);
                    alert("결제는 성공했으나, 주문 내역 저장 중 오류가 발생했습니다. 개발자 도구를 확인해주세요.");
                }
            } else {
                // Payment failed
                alert(`결제에 실패하였습니다. 에러 내용: ${rsp.error_msg}`);
            }
        });
    });
});
