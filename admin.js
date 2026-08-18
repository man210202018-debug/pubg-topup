const ordersTable = document.getElementById('ordersTable');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');

function getOrders() {
    return JSON.parse(localStorage.getItem('pubgOrders')) || [];
}

function saveOrders(orders) {
    localStorage.setItem('pubgOrders', JSON.stringify(orders));
}

function renderOrders() {
    const orders = getOrders();
    const search = searchInput.value.trim().toLowerCase();
    const status = filterStatus.value;

    let filtered = orders.filter(order => {
        const matchSearch = order.playerId.toLowerCase().includes(search);
        const matchStatus = status === 'all' || order.status === status;
        return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
        ordersTable.innerHTML = '<tr><td colspan="9" class="empty">لا توجد طلبات</td></tr>';
    } else {
        ordersTable.innerHTML = filtered.map((order, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${order.playerId}</strong></td>
                <td>${order.server}</td>
                <td>${order.uc} UC</td>
                <td>$${order.price}</td>
                <td>${order.payment}</td>
                <td>${order.date}</td>
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

    updateStats(orders);
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

function updateStats(orders) {
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('newOrders').textContent = orders.filter(o => o.status === 'جديد').length;
    const revenue = orders.filter(o => o.status !== 'ملغي').reduce((sum, o) => sum + parseFloat(o.price), 0);
    document.getElementById('totalRevenue').textContent = '$' + revenue.toFixed(2);
}

function updateStatus(id, newStatus) {
    let orders = getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
        orders[index].status = newStatus;
        saveOrders(orders);
        renderOrders();
    }
}

function deleteOrder(id) {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        let orders = getOrders();
        orders = orders.filter(o => o.id !== id);
        saveOrders(orders);
        renderOrders();
    }
}

exportBtn.addEventListener('click', () => {
    const orders = getOrders();
    if (orders.length === 0) {
        alert('لا توجد طلبات للتصدير!');
        return;
    }

    let csv = 'معرف اللاعب,السيرفر,الباقة,المبلغ,طريقة الدفع,التاريخ,الحالة\n';
    orders.forEach(order => {
        csv += `${order.playerId},${order.server},${order.uc} UC,$${order.price},${order.payment},${order.date},${order.status}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
});

clearBtn.addEventListener('click', () => {
    if (confirm('هل أنت متأكد من مسح جميع الطلبات؟ هذا الإجراء لا يمكن التراجع عنه!')) {
        localStorage.removeItem('pubgOrders');
        renderOrders();
    }
});

searchInput.addEventListener('input', renderOrders);
filterStatus.addEventListener('change', renderOrders);

renderOrders();
