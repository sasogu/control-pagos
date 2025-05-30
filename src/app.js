// Archivo de lógica de la aplicación para controlar los pagos
const form = document.getElementById('payment-form');
const paymentList = document.getElementById('payment-list');

let editIndex = null;

// Referencias a los nuevos selects
const payerSelect = document.getElementById('payer');
const receiverSelect = document.getElementById('receiver');

// Cargar pagos desde Local Storage
function loadPayments() {
    const payments = JSON.parse(localStorage.getItem('payments')) || [];
    const persons = JSON.parse(localStorage.getItem('persons')) || [];

    // Contar participaciones de cada persona
    const usageCount = {};
    persons.forEach(person => usageCount[person] = 0);
    payments.forEach(p => {
        if (usageCount[p.payer] !== undefined) usageCount[p.payer]++;
        if (usageCount[p.receiver] !== undefined) usageCount[p.receiver]++;
    });

    // Ordenar pagos: primero los que involucran a personas más activas
    payments.sort((a, b) => {
        const aCount = (usageCount[a.payer] || 0) + (usageCount[a.receiver] || 0);
        const bCount = (usageCount[b.payer] || 0) + (usageCount[b.receiver] || 0);
        return bCount - aCount;
    });

    paymentList.innerHTML = '';
    payments.forEach((payment, index) => {
        const li = document.createElement('li');
        const signo = payment.type === "entrada" ? "+" : "-";
        li.className = payment.type;
        li.textContent = `${signo} ${payment.payer} → ${payment.receiver} - ${payment.type} - ${payment.description}: ${payment.amount} € (${payment.month})`;

        // Botón Editar con icono
        const btnEdit = document.createElement('button');
        btnEdit.textContent = '✏️ Editar';
        btnEdit.onclick = () => editPayment(payments.length - 1 - index);

        // Botón Eliminar con icono
        const btnDelete = document.createElement('button');
        btnDelete.textContent = '🗑️ Eliminar';
        btnDelete.onclick = () => deletePayment(payments.length - 1 - index);

        li.appendChild(btnEdit);
        li.appendChild(btnDelete);
        paymentList.appendChild(li);
    });
}

// Guardar pagos en Local Storage
function savePayments(payments) {
    localStorage.setItem('payments', JSON.stringify(payments));
}

// Eliminar pago
function deletePayment(index) {
    const payments = JSON.parse(localStorage.getItem('payments')) || [];
    payments.splice(index, 1);
    savePayments(payments);
    loadPayments();
    loadPersons(); // <-- Añade esta línea
}

// Editar pago (cargar datos en el formulario)
function editPayment(index) {
    const payments = JSON.parse(localStorage.getItem('payments')) || [];
    const payment = payments[index];
    document.getElementById('description').value = payment.description;
    document.getElementById('amount').value = payment.amount;
    payerSelect.value = payment.payer;
    receiverSelect.value = payment.receiver;
    document.getElementById('type').value = payment.type;
    document.getElementById('month').value = payment.month;
    editIndex = index;
}

// Manejar el envío del formulario
form.addEventListener('submit', function(e) {
    e.preventDefault();
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const payer = payerSelect.value;
    const receiver = receiverSelect.value;
    const type = document.getElementById('type').value;
    const month = document.getElementById('month').value;

    if (payer === receiver) {
        alert('El pagador y el receptor deben ser diferentes.');
        return;
    }

    const payments = JSON.parse(localStorage.getItem('payments')) || [];
    const payment = { description, amount, payer, receiver, type, month };

    if (editIndex !== null) {
        payments[editIndex] = payment;
        editIndex = null;
    } else {
        payments.push(payment);
    }
    savePayments(payments);
    loadPayments();
    loadPersons();
    form.reset();

    // Selecciona de nuevo el mes actual tras resetear el formulario
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('month').value = currentMonth;
});

// Seleccionar el mes actual por defecto
document.addEventListener('DOMContentLoaded', function() {
    const monthSelect = document.getElementById('month');
    if (monthSelect) {
        const now = new Date();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        monthSelect.value = currentMonth;
    }
    loadPayments();
});

// Botones de backup y restore
const backupBtn = document.getElementById('backup-btn');
const restoreBtn = document.getElementById('restore-btn');
const restoreFile = document.getElementById('restore-file');

// Descargar copia de seguridad
if (backupBtn) {
    backupBtn.addEventListener('click', function() {
        const payments = JSON.parse(localStorage.getItem('payments')) || [];
        const blob = new Blob([JSON.stringify(payments, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pagos_backup.json';
        a.click();
        URL.revokeObjectURL(url);
    });
}

// Restaurar copia de seguridad
if (restoreBtn && restoreFile) {
    restoreBtn.addEventListener('click', function() {
        restoreFile.click();
    });

    restoreFile.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    localStorage.setItem('payments', JSON.stringify(data));
                    loadPayments();
                    alert('Copia de seguridad restaurada correctamente.');
                } else {
                    alert('El archivo no es válido.');
                }
            } catch {
                alert('El archivo no es válido.');
            }
        };
        reader.readAsText(file);
        // Limpiar input para permitir restaurar el mismo archivo varias veces
        restoreFile.value = '';
    });
}

// --- Gestión dinámica de personas ---

const personSelect = document.getElementById('person');
const newPersonInput = document.getElementById('new-person');
const addPersonBtn = document.getElementById('add-person-btn');
const personList = document.getElementById('person-list');

// Cargar personas desde Local Storage
function loadPersons() {
    if (!payerSelect || !receiverSelect || !personList) return;

    let persons = JSON.parse(localStorage.getItem('persons')) || ["Joan", "David Campos", "Marga", "Enrique"];
    const payments = JSON.parse(localStorage.getItem('payments')) || [];

    // Contar participaciones como pagador y receptor
    const payerCount = {}, receiverCount = {};
    persons.forEach(person => {
        payerCount[person] = 0;
        receiverCount[person] = 0;
    });
    payments.forEach(p => {
        if (payerCount[p.payer] !== undefined) payerCount[p.payer]++;
        if (receiverCount[p.receiver] !== undefined) receiverCount[p.receiver]++;
    });

    // Ordenar para pagador y receptor por separado
    const personsByPayer = [...persons].sort((a, b) => payerCount[b] - payerCount[a]);
    const personsByReceiver = [...persons].sort((a, b) => receiverCount[b] - receiverCount[a]);

    // Llenar selects
    payerSelect.innerHTML = '<option value="" disabled selected>Selecciona pagador</option>';
    personsByPayer.forEach(person => {
        const opt = document.createElement('option');
        opt.value = person;
        opt.textContent = person;
        payerSelect.appendChild(opt);
    });

    receiverSelect.innerHTML = '<option value="" disabled selected>Selecciona receptor</option>';
    personsByReceiver.forEach(person => {
        const opt = document.createElement('option');
        opt.value = person;
        opt.textContent = person;
        receiverSelect.appendChild(opt);
    });

    // Calcular el saldo de cada persona
    personList.innerHTML = '';
    persons.forEach((person, idx) => {
        let total = 0;
        payments.forEach(p => {
            if (p.payer === person) {
                total -= Number(p.amount);
            }
            if (p.receiver === person) {
                total += Number(p.amount);
            }
        });

        const signo = total >= 0 ? "+" : "-";
        const clase = total >= 0 ? "entrada" : "salida";

        const li = document.createElement('li');
        li.innerHTML = `${person} — <span class="${clase}">${signo} ${Math.abs(total).toFixed(2)} €</span>`;
        const delBtn = document.createElement('button');
        delBtn.textContent = '❌';
        delBtn.style.marginLeft = '8px';
        delBtn.onclick = () => deletePerson(idx);
        li.appendChild(delBtn);
        personList.appendChild(li);
    });
}

// Guardar personas en Local Storage
function savePersons(persons) {
    localStorage.setItem('persons', JSON.stringify(persons));
}

// Añadir persona
if (addPersonBtn) {
    addPersonBtn.addEventListener('click', function() {
        const name = newPersonInput.value.trim();
        if (!name) return;
        let persons = JSON.parse(localStorage.getItem('persons')) || ["Joan", "David Campos", "Marga", "Enrique"];
        if (!persons.includes(name)) {
            persons.push(name);
            savePersons(persons);
            loadPersons();
            newPersonInput.value = '';
        } else {
            alert('La persona ya existe.');
        }
    });
}

// Eliminar persona
function deletePerson(idx) {
    let persons = JSON.parse(localStorage.getItem('persons')) || ["Joan", "David Campos", "Marga", "Enrique"];
    persons.splice(idx, 1);
    savePersons(persons);
    loadPersons();
}

// Al cargar la página, cargar personas
document.addEventListener('DOMContentLoaded', loadPersons);