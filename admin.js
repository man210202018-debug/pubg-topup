const ordersTable = document.getElementById('ordersTable');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');

let allOrders = [];

async function loadOrders() {
    try {
        const data = await db.select('orders', 'order=created_at.desc');
        allOrders = data || [];
        renderOrders();
    } catch (err) {
        console.error(err);
    }
}

function renderOrders() {
    const search = searchInput.value.trim().toLowerCase();
    const status = filterStatus.value;

    let filtered = allOrders.filter(order => {
        const matchSearch = order.player_id.toLowerCase().includes(search);
        const matchStatus = status === 'all' || order.status === status;
        return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
        ordersTable.innerHTML = '<tr><td colspan="9" class="empty">لا توجد طلبات</td></tr>';
    } else {
        ordersTable.innerHTML = filtered.map((order, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${order.player_id}</strong></td>
                <td>${order.server}</td>
                <td>${order.uc} UC</td>
                <td>${order.price} ج.م</td>
                <td>
                    ${order.payment}
                    ${order.proof_image ? `<button class="action-btn btn-view" onclick="viewImage('${order.id}')">📷 صورة</button>` : ''}
                </td>
                <td>${new Date(order.created_at).toLocaleString('ar-EG')}</td>
                <td><span class="status-badge ${getStatusClass(order.status)}">${order.status}</span></td>
                <td>
                    ${order.status === 'جديد' ? `<button class="action-btn btn-progress" onclick="updateStatus(${order.id}, 'قيد التنفيذ')">قيد التنفيذ</button>` : ''}
                    ${order.status === 'قيد التنفيذ' ? `<button class="action-btn btn-done" onclick="updateStatus(${order.id}, 'مكتمل')">مكتمل</button>` : ''}
                    ${order.status !== 'ملغي' && order.status !== 'مكتمل' ? `<button class="action-btn btn-cancel" onclick="updateStatus(${order.id}, 'ملغي')">إلغاء</button>` : ''}
                    <button class="action-btn btn-delete" onclick="deleteOrder(${order.id})">حذف</button>
                </td>
            </tr>
        `).join('');
    }

    updateStats();
}

function getStatusClass(status) {
    const classes = {
        'جديد': 'status-new',
        'قيد التنفيذ': 'status-progress',
        'مكتمل': 'status-done',
        'ملغي': 'status-cancelled'
    };
    return classes[status] || '';
}

function updateStats() {
    document.getElementById('totalOrders').textContent = allOrders.length;
    document.getElementById('newOrders').textContent = allOrders.filter(o => o.status === 'جديد').length;
    const revenue = allOrders.filter(o => o.status !== 'ملغي').reduce((sum, o) => sum + parseFloat(o.price), 0);
    document.getElementById('totalRevenue').textContent = revenue.toFixed(2) + ' ج.م';
}

function viewImage(orderId) {
    const order = allOrders.find(o => o.id == orderId);
    if (!order || !order.proof_image) return;

    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>صورة إثبات التحويل</h3>
                    <button class="modal-close" onclick="this.closest('.image-modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <p><strong>اللاعب:</strong> ${order.player_id}</p>
                    <p><strong>المبلغ:</strong> ${order.price} ج.م</p>
                    <p><strong>الباقة:</strong> ${order.uc} UC</p>
                    <img src="${order.proof_image}" alt="إثبات التحويل">
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function updateStatus(id, newStatus) {
    try {
        await db.update('orders', { status: newStatus }, `id=eq.${id}`);
        const order = allOrders.find(o => o.id === id);
        if (order) order.status = newStatus;
        renderOrders();
    } catch (err) {
        console.error(err);
    }
}

async function deleteOrder(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;

    try {
        await db.remove('orders', `id=eq.${id}`);
        allOrders = allOrders.filter(o => o.id !== id);
        renderOrders();
    } catch (err) {
        console.error(err);
    }
}

exportBtn.addEventListener('click', () => {
    if (allOrders.length === 0) {
        alert('لا توجد طلبات للتصدير!');
        return;
    }

    let csv = 'معرف اللاعب,السيرفر,الباقة,المبلغ,طريقة الدفع,التاريخ,الحالة\n';
    allOrders.forEach(order => {
        csv += `${order.player_id},${order.server},${order.uc} UC,${order.price} ج.م,${order.payment},${new Date(order.created_at).toLocaleString('ar-EG')},${order.status}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
});

clearBtn.addEventListener('click', async () => {
    if (!confirm('هل أنت متأكد من مسح جميع الطلبات؟')) return;

    try {
        for (const order of allOrders) {
            await db.remove('orders', `id=eq.${order.id}`);
        }
        allOrders = [];
        renderOrders();
    } catch (err) {
        console.error(err);
    }
});

searchInput.addEventListener('input', renderOrders);
filterStatus.addEventListener('change', renderOrders);

loadOrders();
setInterval(loadOrders, 5000);
