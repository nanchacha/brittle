import { db } from './firebase-config.js';
import { collection, query, getDocs, doc, updateDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let allOrders = [];
let currentTab = 'pending'; // 'pending' or 'shipped'

const loadingEl = document.getElementById('loading');
const containerEl = document.getElementById('orders-container');
const tabPendingBtn = document.getElementById('tab-pending');
const tabShippedBtn = document.getElementById('tab-shipped');
const countPendingEl = document.getElementById('count-pending');
const countShippedEl = document.getElementById('count-shipped');

async function loadOrders() {
    loadingEl.classList.remove('hidden');
    containerEl.classList.add('hidden');
    
    try {
        // Firestore에서 최신순으로 주문 데이터 불러오기
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        allOrders = [];
        querySnapshot.forEach((doc) => {
            allOrders.push({ id: doc.id, ...doc.data() });
        });
        
        renderOrders();
    } catch (e) {
        console.error("Error loading orders: ", e);
        loadingEl.textContent = "주문을 불러오는데 실패했습니다. 파이어베이스 설정을 확인해주세요.";
    }
}

function renderOrders() {
    // 상태가 없으면 예전 데이터이므로 기본적으로 'pending'(새 주문)으로 취급
    const filtered = allOrders.filter(o => o.status === currentTab || (!o.status && currentTab === 'pending'));
    
    // 건수 업데이트
    const pendingCount = allOrders.filter(o => o.status === 'pending' || !o.status).length;
    const shippedCount = allOrders.filter(o => o.status === 'shipped').length;
    
    countPendingEl.textContent = pendingCount;
    countShippedEl.textContent = shippedCount;
    
    if (filtered.length === 0) {
        containerEl.innerHTML = `<div class="text-center py-20 text-3xl text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-200">이곳에 보여줄 주문이 없습니다.</div>`;
    } else {
        containerEl.innerHTML = filtered.map(order => createOrderCard(order)).join('');
    }
    
    loadingEl.classList.add('hidden');
    containerEl.classList.remove('hidden');
}

function createOrderCard(order) {
    const dateObj = new Date(order.createdAt);
    const dateStr = !isNaN(dateObj) ? dateObj.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' }) : '날짜 정보 없음';
    
    const items = order.items || [];
    const itemsHtml = items.map(i => `<li class="text-2xl text-gray-700 py-1">✔️ ${i.name} <span class="font-bold text-[#885210]">(${i.quantity}개)</span></li>`).join('');
    
    let actionBtnHtml = '';
    if (currentTab === 'pending') {
        actionBtnHtml = `
            <button onclick="window.markAsShipped('${order.id}')" class="w-full mt-8 bg-[#885210] hover:bg-[#6b400c] text-white text-3xl font-bold py-6 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-3">
                <span class="material-symbols-outlined text-4xl" style="font-variation-settings: 'FILL' 1;">local_shipping</span>
                택배 발송 처리 완료하기
            </button>
        `;
    } else {
        actionBtnHtml = `
            <div class="w-full mt-8 bg-gray-200 text-gray-600 text-2xl font-bold py-6 rounded-2xl text-center flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-3xl">check_circle</span>
                이미 발송 처리가 완료된 주문입니다.
            </div>
        `;
    }

    const buyer = order.buyer || {};
    
    return `
        <div class="bg-white rounded-2xl p-8 shadow-md border-l-[12px] ${currentTab === 'pending' ? 'border-[#885210]' : 'border-gray-400'}">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b-2 border-gray-100 pb-4 gap-2">
                <span class="text-xl text-gray-500 font-bold bg-gray-100 px-4 py-2 rounded-lg">주문일시: ${dateStr}</span>
                <span class="text-lg text-gray-400">주문번호: ${order.orderId || order.id}</span>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- 고객 정보 -->
                <div class="bg-gray-50 p-8 rounded-2xl border border-gray-200">
                    <h3 class="text-2xl text-gray-500 mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-3xl">person</span>받으시는 분
                    </h3>
                    <div class="text-5xl font-black text-gray-900 mb-4">${buyer.name || '이름 없음'}</div>
                    <div class="text-4xl text-blue-600 font-bold mb-6">${buyer.tel || '전화번호 없음'}</div>
                    <div class="text-2xl text-gray-800 leading-relaxed bg-white p-4 rounded-xl border border-gray-200">
                        ${buyer.address || '주소 없음'} <br> <span class="text-gray-500 text-xl">${buyer.postcode || ''}</span>
                    </div>
                </div>
                
                <!-- 상품 및 결제 정보 -->
                <div class="bg-[#fdf9f4] p-8 rounded-2xl border border-[#dec1af] flex flex-col justify-between">
                    <div>
                        <h3 class="text-2xl text-[#885210] mb-6 flex items-center gap-2 font-bold">
                            <span class="material-symbols-outlined text-3xl">shopping_bag</span>주문하신 상품
                        </h3>
                        <ul class="space-y-2 mb-8 bg-white p-6 rounded-xl border border-[#f8dac8]">
                            ${itemsHtml}
                        </ul>
                    </div>
                    <div class="border-t-2 border-[#f8dac8] pt-6 flex justify-between items-end">
                        <span class="text-2xl text-gray-600">총 결제금액</span>
                        <span class="text-5xl font-black text-[#885210]">${(order.totalAmount || 0).toLocaleString()}원</span>
                    </div>
                </div>
            </div>
            
            ${actionBtnHtml}
        </div>
    `;
}

// 글로벌 영역에 버튼 클릭 함수 노출
window.markAsShipped = async (orderId) => {
    if(!confirm('이 주문의 택배를 발송하셨습니까?\\n\\n확인을 누르시면 [발송 완료한 주문] 탭으로 이동합니다.')) return;
    
    try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
            status: "shipped"
        });
        
        // 데이터 다시 불러오지 않고 로컬 배열만 업데이트하여 빠른 화면 전환
        const orderIndex = allOrders.findIndex(o => o.id === orderId);
        if(orderIndex !== -1) {
            allOrders[orderIndex].status = "shipped";
        }
        renderOrders();
    } catch (e) {
        console.error("Error updating document: ", e);
        alert("상태 변경 중 오류가 발생했습니다. 파이어베이스 권한 설정을 확인하세요.");
    }
};

// 탭 전환 이벤트
tabPendingBtn.addEventListener('click', () => {
    currentTab = 'pending';
    tabPendingBtn.classList.add('active');
    tabShippedBtn.classList.remove('active');
    renderOrders();
});

tabShippedBtn.addEventListener('click', () => {
    currentTab = 'shipped';
    tabShippedBtn.classList.add('active');
    tabPendingBtn.classList.remove('active');
    renderOrders();
});

// 초기 실행
loadOrders();
