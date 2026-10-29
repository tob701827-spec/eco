// Enlace a tu modelo entrenado en Teachable Machine
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/R_t4l0Odo/";

let model, webcam, labelContainer, maxPredictions;

// Base de datos de información por cada material reconocido
const ecoData = {
    "carton y papel": {
        co2: "0.08 kg",
        bin: "Contenedor Azul / Cartón y Papel",
        tip: "Asegúrate de que las cajas estén desarmadas y no tengan grasa ni restos de comida."
    },
    "plastico": {
        co2: "0.15 kg",
        bin: "Contenedor Amarillo / Plásticos",
        tip: "Enjuaga los envases y aplástalos para reducir el espacio que ocupan."
    },
    "vidrio": {
        co2: "0.20 kg",
        bin: "Contenedor Verde / Vidrios",
        tip: "Retira las tapas o corchos antes de depositar las botellas o frascos."
    },
    "NADA": {
        co2: "0.00 kg",
        bin: "Esperando residuo...",
        tip: "Muestra un objeto frente a la cámara para iniciar la clasificación."
    }
};

// Inicializa el modelo y la cámara web
async function init() {
    const modelURL = MODEL_URL + "model.json";
    const metadataURL = MODEL_URL + "metadata.json";

    // Cargar el modelo
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Configurar la cámara web
    const flip = true; 
    webcam = new tmImage.Webcam(300, 300, flip); 
    await webcam.setup(); 
    await webcam.play();
    window.requestAnimationFrame(loop);

    // Insertar el video de la cámara en el HTML
    const container = document.getElementById("webcam-container");
    container.innerHTML = "";
    container.appendChild(webcam.canvas);

    labelContainer = document.getElementById("label-container");
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

// Analizar la imagen de la cámara en tiempo real
async function predict() {
    const prediction = await model.predict(webcam.canvas);
    
    let highestPrediction = { className: "", probability: 0 };

    // Buscar la categoría con mayor probabilidad
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > highestPrediction.probability) {
            highestPrediction = prediction[i];
        }
    }

    // Actualizar la interfaz si la certeza es mayor al 75%
    if (highestPrediction.probability > 0.75) {
        updateUI(highestPrediction.className, highestPrediction.probability);
    }
}

// Mostrar los datos del residuo en pantalla
function updateUI(className, probability) {
    const data = ecoData[className] || {
        co2: "N/A",
        bin: "Contenedor Desconocido",
        tip: "Por favor revisa la clasificación manual del residuo."
    };

    if (labelContainer) {
        labelContainer.innerHTML = `
            <div class="p-4 bg-white rounded-lg shadow border border-green-100">
                <h3 class="text-xl font-bold text-green-700 capitalize mb-1">${className}</h3>
                <p class="text-sm text-gray-500 mb-2">Confianza: <strong>${(probability * 100).toFixed(1)}%</strong></p>
                <div class="text-sm space-y-1">
                    <p>🌱 <strong>Ahorro de CO2:</strong> ${data.co2}</p>
                    <p>♻️ <strong>Destino:</strong> ${data.bin}</p>
                    <p class="text-xs text-gray-600 mt-2 bg-green-50 p-2 rounded">💡 ${data.tip}</p>
                </div>
            </div>
        `;
    }
}
