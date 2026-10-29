/**
 * EcoTrack - Lógica del Cliente e Integración con Teachable Machine
 */

// URL del modelo predeterminado (o tu modelo subido a Teachable Machine)
let MODEL_URL = "https://teachablemachine.withgoogle.com/models/v5-G4XyE3/"; 

let model, webcam, maxPredictions;
let isWebcamActive = false;
let userPoints = 0;

// Datos ecológicos complementarios por categoría
const ecoData = {
    "Plástico": {
        co2: "0.05 kg",
        bin: "Contenedor Amarillo (Reciclables)",
        tip: "Enjuaga la botella y aplástala para optimizar el espacio antes de desecharla."
    },
    "Papel/Cartón": {
        co2: "0.08 kg",
        bin: "Contenedor Azul (Papel y Cartón)",
        tip: "Asegúrate de que no tenga grasa ni restos de comida (las cajas de pizza muy sucias van a basurero común)."
    },
    "Vidrio": {
        co2: "0.15 kg",
        bin: "Contenedor Verde (Vidrios)",
        tip: "Retira las tapas o corchos de botellas y frascos antes de depositar el vidrio."
    },
    "Orgánico": {
        co2: "0.12 kg",
        bin: "Contenedor Marrón (Compost/Orgánico)",
        tip: "Ideal para hacer compostaje casero y nutrir suelos de jardines."
    }
};

// Inicialización automática
window.addEventListener('DOMContentLoaded', () => {
    initModel();
});

// Cargar modelo de Teachable Machine
async function initModel() {
    try {
        const modelURL = MODEL_URL + "model.json";
        const metadataURL = MODEL_URL + "metadata.json";

        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log("Modelo EcoTrack cargado correctamente.");
    } catch (e) {
        console.warn("No se pudo cargar el modelo remoto. Se ejecutará en modo demostración/simulación.", e);
    }
}

// Cargar modelo personalizado por URL del usuario
async function loadCustomModel() {
    const inputUrl = document.getElementById('model-url').value.trim();
    if (!inputUrl) return alert("Por favor ingresa un enlace válido.");
    
    MODEL_URL = inputUrl.endsWith('/') ? inputUrl : inputUrl + '/';
    await initModel();
    alert("¡Modelo actualizado con éxito!");
}

// Controlar Cámara Web
async function toggleWebcam() {
    const webcamContainer = document.getElementById('webcam-container');
    const placeholder = document.getElementById('placeholder-ui');
    const imgPreview = document.getElementById('image-preview');
    const btnWebcam = document.getElementById('btn-webcam');

    if (!isWebcamActive) {
        // Encender Cámara
        try {
            const flip = true;
            webcam = new tmImage.Webcam(320, 240, flip);
            await webcam.setup();
            await webcam.play();
            
            webcamContainer.innerHTML = '';
            webcamContainer.appendChild(webcam.canvas);
            
            placeholder.classList.add('hidden');
            imgPreview.classList.add('hidden');
            webcamContainer.classList.remove('hidden');
            
            isWebcamActive = true;
            btnWebcam.innerHTML = `<i class="fa-solid fa-video-slash"></i> Apagar Cámara`;
            btnWebcam.classList.replace('btn-primary', 'bg-rose-600');
            
            window.requestAnimationFrame(webcamLoop);
        } catch (err) {
            alert("No se pudo acceder a la cámara web. Comprueba los permisos de tu navegador.");
        }
    } else {
        // Apagar Cámara
        if (webcam) await webcam.stop();
        webcamContainer.classList.add('hidden');
        placeholder.classList.remove('hidden');
        
        isWebcamActive = false;
        btnWebcam.innerHTML = `<i class="fa-solid fa-video"></i> Activar Cámara`;
        btnWebcam.classList.replace('bg-rose-600', 'btn-primary');
    }
}

// Bucle de predicción de la Cámara
async function webcamLoop() {
    if (isWebcamActive) {
        webcam.update();
        await predict(webcam.canvas);
        window.requestAnimationFrame(webcamLoop);
    }
}

// Subida e Inspección de Imagen Local
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (isWebcamActive) toggleWebcam(); // Apagar cámara si está encendida

    const reader = new FileReader();
    reader.onload = function(e) {
        const imgElement = document.getElementById('image-preview');
        imgElement.src = e.target.result;
        imgElement.classList.remove('hidden');
        
        document.getElementById('placeholder-ui').classList.add('hidden');
        document.getElementById('webcam-container').classList.add('hidden');

        imgElement.onload = async () => {
            await predict(imgElement);
        };
    };
    reader.readAsDataURL(file);
}

// Procesar Predicción del Modelo
async function predict(imageElement) {
    let predictions = [];

    if (model) {
        predictions = await model.predict(imageElement);
    } else {
        // Simulación si no hay modelo activo
        predictions = [
            { className: "Plástico", probability: 0.88 },
            { className: "Papel/Cartón", probability: 0.07 },
            { className: "Vidrio", probability: 0.03 },
            { className: "Orgánico", probability: 0.02 }
        ];
    }

    renderResults(predictions);
}

// Renderizar UI de Resultados
function renderResults(predictions) {
    const container = document.getElementById('results-container');
    container.innerHTML = '';

    // Ordenar predicciones de mayor a menor probabilidad
    predictions.sort((a, b) => b.probability - a.probability);
    
    const topPrediction = predictions[0];

    predictions.forEach(pred => {
        const percentage = (pred.probability * 100).toFixed(1);
        
        const itemHtml = `
            <div class="space-y-1">
                <div class="flex justify-between text-xs font-medium">
                    <span class="text-slate-200">${pred.className}</span>
                    <span class="text-emerald-400 font-bold">${percentage}%</span>
                </div>
                <div class="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div class="progress-bar-fill h-full rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
        container.innerHTML += itemHtml;
    });

    // Actualizar Panel de Impacto con el resultado principal
    if (topPrediction && topPrediction.probability > 0.40) {
        updateEcoImpact(topPrediction.className);
    }
}

// Actualizar Impacto Ambiental y Puntos Verdes
function updateEcoImpact(categoryName) {
    const impactCard = document.getElementById('eco-impact-card');
    const info = ecoData[categoryName] || {
        co2: "0.03 kg",
        bin: "Residuos Generales",
        tip: "Clasifica el material según las normas locales de reciclaje."
    };

    document.getElementById('co2-value').innerText = info.co2;
    document.getElementById('bin-value').innerText = info.bin;
    document.getElementById('eco-tip').innerText = info.tip;

    impactCard.classList.remove('hidden');

    // Sumar puntos verdes
    userPoints += 10;
    document.getElementById('user-points').innerText = userPoints;
}