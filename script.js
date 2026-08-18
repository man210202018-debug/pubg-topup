let selectedPackage = null;
let selectedPayment = null;

const playerId = document.getElementById('playerId');
const server = document.getElementById('server');
const packages = document.querySelectorAll('.package');
const paymentMethods = document.querySelectorAll('.payment-method');
const buyBtn = document.getElementById('buyBtn');
const summary = document.getElementById('summary');

packages.forEach(pkg => {
    pkg.addEventListener('click', () => {
        packages.forEach(p => p.classList.remove('selected'));
        pkg.classList.add('selected');
        selectedPackage = {
            uc: pkg.dataset.uc,
            price: pkg.dataset.price
        };
        updateSummary();
    });
});

paymentMethods.forEach(method => {
    method.addEventListener('click', () => {
        paymentMethods.forEach(m => m.classList.remove('selected'));
        method.classList.add('selected');
        selectedPayment = method.dataset.method;
        updateSummary();
    });
});

playerId.addEventListener('input', updateSummary);
server.addEventListener('change', updateSummary);

function updateSummary() {
    const id = playerId.value.trim();
    const srv = server.value;

    if (id && srv && selectedPackage && selectedPayment) {
        summary.style.display = 'block';
        buyBtn.disabled = false;

        document.getElementById('summaryId').textContent = id;
        document.getElementById('summaryServer').textContent = server.options[server.selectedIndex].text;
        document.getElementById('summaryPackage').textContent = selectedPackage.uc + ' UC';
        document.getElementById('summaryPayment').textContent = getPaymentName(selectedPayment);
        document.getElementById('summaryTotal').textContent = '$' + selectedPackage.price;
    } else {
        summary.style.display = 'none';
        buyBtn.disabled = true;
    }
}

function getPaymentName(method) {
    const names = {
        'visa': 'فيزا / ماستركارد',
        'paypal': 'PayPal',
        'stc': 'STC Pay',
        'apple': 'Apple Pay'
    };
    return names[method] || method;
}

buyBtn.addEventListener('click', async () => {
    const id = playerId.value.trim();
    if (!id) {
        alert('من فضلك أدخل معرف اللاعب!');
        return;
    }
    if (!server.value) {
        alert('من فضلك اختر السيرفر!');
        return;
    }
    if (!selectedPackage) {
        alert('من فضلك اختر باقة الشحن!');
        return;
    }
    if (!selectedPayment) {
        alert('من فضلك اختر طريقة الدفع!');
        return;
    }

    buyBtn.disabled = true;
    buyBtn.textContent = 'جاري الإرسال...';

    const { error } = await _supabase.from('orders').insert({
        player_id: id,
        server: server.options[server.selectedIndex].text,
        uc: selectedPackage.uc,
        price: selectedPackage.price,
        payment: getPaymentName(selectedPayment),
        status: 'جديد'
    });

    if (error) {
        alert('حدث خطأ! حاول مرة أخرى.');
        console.error(error);
        buyBtn.disabled = false;
        buyBtn.textContent = 'اشحن الآن';
        return;
    }

    alert('تم استلام طلبك بنجاح! 🎉\n\nمعرف اللاعب: ' + id + '\nالباقة: ' + selectedPackage.uc + ' UC\nالمبلغ: $' + selectedPackage.price);

    playerId.value = '';
    server.value = '';
    selectedPackage = null;
    selectedPayment = null;
    packages.forEach(p => p.classList.remove('selected'));
    paymentMethods.forEach(m => m.classList.remove('selected'));
    summary.style.display = 'none';
    buyBtn.disabled = true;
    buyBtn.textContent = 'اشحن الآن';
});
