let selectedPackage = null;
let selectedPayment = null;
let proofImageBase64 = null;

const playerId = document.getElementById('playerId');
const server = document.getElementById('server');
const packages = document.querySelectorAll('.package');
const paymentMethods = document.querySelectorAll('.payment-method');
const buyBtn = document.getElementById('buyBtn');
const summary = document.getElementById('summary');
const vodafoneInfo = document.getElementById('vodafoneInfo');
const phoneDisplay = document.getElementById('phoneDisplay');
const proofImage = document.getElementById('proofImage');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImg = document.getElementById('removeImg');

phoneDisplay.addEventListener('click', () => {
    navigator.clipboard.writeText(phoneDisplay.textContent).then(() => {
        phoneDisplay.style.background = 'rgba(52, 211, 153, 0.25)';
        phoneDisplay.textContent = 'تم النسخ!';
        setTimeout(() => {
            phoneDisplay.style.background = '';
            phoneDisplay.textContent = '01147062899';
        }, 1500);
    });
});

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
        vodafoneInfo.style.display = selectedPayment === 'vodafone' ? 'block' : 'none';
        updateSummary();
    });
});

playerId.addEventListener('input', updateSummary);
server.addEventListener('change', updateSummary);

proofImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('الصورة كبيرة جداً! الحد الأقصى 5 ميجا.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        proofImageBase64 = ev.target.result;
        previewImg.src = proofImageBase64;
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
});

removeImg.addEventListener('click', () => {
    proofImageBase64 = null;
    proofImage.value = '';
    imagePreview.style.display = 'none';
    previewImg.src = '';
});

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
        document.getElementById('summaryTotal').textContent = selectedPackage.price + ' ج.م';
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
        'apple': 'Apple Pay',
        'vodafone': 'فودافون كاش'
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
    if (selectedPayment === 'vodafone' && !proofImageBase64) {
        alert('من فضلك ارفع صورة إثبات التحويل!');
        return;
    }

    buyBtn.disabled = true;
    buyBtn.innerHTML = '<span>جاري الإرسال...</span> <span class="btn-icon">⏳</span>';

    try {
        await db.insert('orders', {
            player_id: id,
            server: server.options[server.selectedIndex].text,
            uc: selectedPackage.uc,
            price: selectedPackage.price,
            payment: getPaymentName(selectedPayment),
            status: 'جديد',
            proof_image: proofImageBase64 || null
        });

        alert('تم استلام طلبك بنجاح! 🎉\n\nمعرف اللاعب: ' + id + '\nالباقة: ' + selectedPackage.uc + ' UC\nالمبلغ: ' + selectedPackage.price + ' ج.م');

        playerId.value = '';
        server.value = '';
        selectedPackage = null;
        selectedPayment = null;
        proofImageBase64 = null;
        proofImage.value = '';
        imagePreview.style.display = 'none';
        previewImg.src = '';
        packages.forEach(p => p.classList.remove('selected'));
        paymentMethods.forEach(m => m.classList.remove('selected'));
        vodafoneInfo.style.display = 'none';
        summary.style.display = 'none';
    } catch (err) {
        alert('حدث خطأ! حاول مرة أخرى.');
        console.error(err);
    }

    buyBtn.disabled = false;
    buyBtn.innerHTML = '<span>اشحن الآن</span> <span class="btn-icon">⚡</span>';
});
