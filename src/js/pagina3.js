document.addEventListener('DOMContentLoaded', () => {
    const convertBtn = document.getElementById('convertBtn');
    const input = document.getElementById('inputValue');
    const resultArea = document.getElementById('resultArea');
    const resultValue = document.getElementById('resultValue');

    convertBtn.addEventListener('click', () => {
        const val = parseFloat(input.value);
        
        if (isNaN(val)) {
            alert("Error: Ingrese un valor numérico válido.");
            return;
        }

        // Ejemplo: Conversor de Kilómetros a Años Luz
        const conversion = val * 0.0000000000001057;
        
        resultValue.innerText = conversion.toExponential(4) + " AL";
        resultArea.classList.remove('hidden');
        
        console.log(`Conversión ejecutada: ${val} -> ${conversion}`);
    });
});