// Ruta de tu modelo local (asegúrate de tener la carpeta my_model con los 3 archivos)
const DEFAULT_URL = "./my_model/";
let URL = DEFAULT_URL;

let model, webcam, maxPredictions;
let webcamActive = false;
let userPoints = 0;

// Inicializar al cargar o cambiar de modelo
async function loadModel(customUrl) {
    const modelURL = (customUrl || URL) + "model.json";
    const metadataURL = (customUrl || URL) + "metadata.json";

    try {
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        console.log("Modelo cargado correctamente. Clases:", maxPredictions);
    } catch (error) {
        console.error("Error al cargar el modelo:", error);
        alert("No se pudo cargar el modelo. Verifica la ruta o los archivos en la carpeta my_model.");
    }
}

// Cargar modelo personalizado desde el input de texto
async function loadCustomModel() {
    const inputUrl = document.getElementById("model-url").value.trim();
    if (inputUrl) {
        URL = inputUrl.endsWith("/") ? inputUrl : inputUrl + "/";
        await loadModel(URL);
        alert("¡Enlace de modelo actualizado con éxito!");
    }
}

// Activar o desactivar la cámara web
async function toggleWebcam() {
    const placeholder = document.getElementById("placeholder-ui");
    const webcamContainer = document.getElementById("webcam-container");
    const imagePreview = document.getElementById("image-preview");
    const btnWebcam = document.getElementById("btn-webcam");

    if (!model) {
        await loadModel(URL);
    }

    if (!webcamActive) {
        try {
            // Ocultar placeholder e imagen estática
            placeholder.classList.add("hidden");
            imagePreview.classList.add("hidden");
            webcamContainer.classList.remove("hidden");

            // Configurar webcam (224x224 según metadata)
            webcam = new tmImage.Webcam(224, 224, true);
            await webcam.setup();
            await webcam.play();
            webcamActive = true;

            webcamContainer.replaceChildren(webcam.canvas);
            btnWebcam.innerHTML = `<i class="fa-solid fa-video-slash"></i> Detener Cámara`;
            btnWebcam.classList.replace("btn-primary", "bg-rose-600");

            window.requestAnimationFrame(loopWebcam);
        } catch (error) {
            console.error("Error al acceder a la cámara:", error);
            alert("No se pudo acceder a la cámara. Revisa los permisos del navegador.");
        }
    } else {
        stopWebcam();
    }
}

function stopWebcam() {
    if (webcam && webcamActive) {
        webcam.stop();
        webcamActive = false;
    }
    const placeholder = document.getElementById("placeholder-ui");
    const webcamContainer = document.getElementById("webcam-container");
    const btnWebcam = document.getElementById("btn-webcam");

    webcamContainer.classList.add("hidden");
    placeholder.classList.remove("hidden");
    btnWebcam.innerHTML = `<i class="fa-solid fa-video"></i> Activar Cámara`;
    btnWebcam.classList.replace("bg-rose-600", "btn-primary");
}

async function loopWebcam() {
    if (!webcamActive) return;
    webcam.update();
    await predict(webcam.canvas);
    window.requestAnimationFrame(loopWebcam);
}

// Manejar la subida de una imagen estática
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (webcamActive) {
        stopWebcam();
    }

    const placeholder = document.getElementById("placeholder-ui");
    const webcamContainer = document.getElementById("webcam-container");
    const imagePreview = document.getElementById("image-preview");

    placeholder.classList.add("hidden");
    webcamContainer.classList.add("hidden");
    imagePreview.classList.remove("hidden");

    const reader = new FileReader();
    reader.onload = async function (e) {
        imagePreview.src = e.target.result;
        
        // Esperar a que la imagen cargue en el DOM para predecir
        imagePreview.onload = async function () {
            if (!model) {
                await loadModel(URL);
            }
            await predict(imagePreview);
        };
    };
    reader.readAsDataURL(file);
}

// Realizar la predicción y actualizar la interfaz visual
async function predict(sourceElement) {
    if (!model) return;

    const prediction = await model.predict(sourceElement);
    const resultsContainer = document.getElementById("results-container");
    resultsContainer.replaceChildren();

    let highestPrediction = prediction[0];

    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probability = (prediction[i].probability * 100);

        if (prediction[i].probability > highestPrediction.probability) {
            highestPrediction = prediction[i];
        }

        // Crear barra de progreso visual para cada clase
        const progressWrapper = document.createElement("div");
        progressWrapper.className = "space-y-1";

        progressWrapper.innerHTML = `
            <div class="flex justify-between text-xs">
                <span class="font-medium text-slate-200 capitalize">${className}</span>
                <span class="font-mono text-emerald-400">${probability.toFixed(1)}%</span>
            </div>
            <div class="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-300" style="width: ${probability}%"></div>
            </div>
        `;
        resultsContainer.appendChild(progressWrapper);
    }

    // Actualizar impacto ambiental y gamificación si detecta un residuo válido con confianza > 75%
    if (highestPrediction.probability > 0.75 && highestPrediction.className !== "nada") {
        updateEcoImpact(highestPrediction.className);
    }
}

// Información de impacto ambiental según la clase detectada
function updateEcoImpact(className) {
    const impactCard = document.getElementById("eco-impact-card");
    const co2Value = document.getElementById("co2-value");
    const binValue = document.getElementById("bin-value");
    const ecoTip = document.getElementById("eco-tip");

    impactCard.classList.remove("hidden");

    const impactData = {
        "carton y papel": {
            co2: "-0.5 kg CO₂ eq",
            bin: "Contenedor Azul (Papel y Cartón)",
            tip: "Pliega las cajas antes de reciclarlas para optimizar el espacio en los centros de acopio."
        },
        "plastico": {
            co2: "-1.2 kg CO₂ eq",
            bin: "Contenedor Amarillo (Envases y Plásticos)",
            tip: "Enjuaga ligeramente los envases plásticos antes de depositarlos para facilitar su reciclaje."
        },
        "vidrio": {
            co2: "-0.8 kg CO₂ eq",
            bin: "Contenedor Verde (Vidrio)",
            tip: "El vidrio es 100% reciclable y puede reutilizarse infinitamente sin perder calidad."
        }
    };

    const data = impactData[className.toLowerCase()];
    if (data) {
        co2Value.textContent = data.co2;
        binValue.textContent = data.bin;
        ecoTip.textContent = data.tip;

        // Sumar puntos verdes (ejemplo: 10 puntos por acierto)
        userPoints += 1;
        document.getElementById("user-points").textContent = userPoints;
    }
}

// Cargar el modelo por defecto al iniciar la página
window.addEventListener("DOMContentLoaded", () => {
    loadModel(URL);
});
