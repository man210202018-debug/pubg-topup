const ordersTable = document.getElementById('ordersTable');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');

let allOrders = [];

async function loadOrders() {
    const { data, error } = await _supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    allOrders = data || [];
    renderOrders();
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
                <td>$${order.price}</td>
                <td>${order.payment}</td>
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
    document.getElementById('totalRevenue').textContent = '$' + revenue.toFixed(2);
}

async function updateStatus(id, newStatus) {
    const { error } = await _supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', id);

    if (error) {
        console.error(error);
        return;
    }

    const order = allOrders.find(o => o.id === id);
    if (order) order.status = newStatus;
    renderOrders();
}

async function deleteOrder(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;

    const { error } = await _supabase
        .from('orders')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(error);
        return;
    }

    allOrders = allOrders.filter(o => o.id !== id);
    renderOrders();
}

exportBtn.addEventListener('click', () => {
    if (allOrders.length === 0) {
        alert('لا توجد طلبات للتصدير!');
        return;
    }

    let csv = 'معرف اللاعب,السيرفر,الباقة,المبلغ,طريقة الدفع,التاريخ,الحالة\n';
    allOrders.forEach(order => {
        csv += `${order.player_id},${order.server},${order.uc} UC,$${order.price},${order.payment},${new Date(order.created_at).toLocaleString('ar-EG')},${order.status}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
});

clearBtn.addEventListener('click', async () => {
    if (!confirm('هل أنت متأكد من مسح جميع الطلبات؟')) return;

    const { error } = await _supabase.from('orders').delete().neq('id', 0);
    if (error) {
        console.error(error);
        return;
    }

    allOrders = [];
    renderOrders();
});

searchInput.addEventListener('input', renderOrders);
filterStatus.addEventListener('change', renderOrders);

loadOrders();

_supabase
    .channel('orders-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        loadOrders();
    })
    .subscribe();

setInterval(loadOrders, 5000);
