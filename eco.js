// Ruta de tu modelo local
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
            placeholder.classList.add("hidden");
            imagePreview.classList.add("hidden");
            webcamContainer.classList.remove("hidden");

            webcam = new tmImage.Webcam(224, 224, true);
            await webcam.setup();
            await webcam.play();
            webcamActive = true;

            webcamContainer.replaceChildren(webcam.canvas);
            btnWebcam.innerHTML = `<i class="fa-solid fa-video-slash text-lg"></i> Detener Cámara`;
            btnWebcam.classList.replace("btn-extravagant-primary", "bg-rose-500");
            btnWebcam.classList.add("text-white", "font-bold", "rounded-xl");

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
    btnWebcam.innerHTML = `<i class="fa-solid fa-video text-lg"></i> Activar Cámara`;
    btnWebcam.classList.remove("bg-rose-500");
    btnWebcam.classList.add("btn-extravagant-primary");
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
        
        imagePreview.onload = async function () {
            if (!model) {
                await loadModel(URL);
            }
            await predict(imagePreview);
        };
    };
    reader.readAsDataURL(file);
}

// Realizar la predicción con BARRAS EXTRAVAGANTES y LLAMATIVAS
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

        // Crear barra de progreso extravagantemente llamativa
        const progressWrapper = document.createElement("div");
        progressWrapper.className = "space-y-1.5 p-3 rounded-2xl bg-white/70 border border-teal-100 shadow-sm";

        progressWrapper.innerHTML = `
            <div class="flex justify-between items-center text-sm font-black">
                <span class="capitalize text-slate-800 flex items-center gap-2">
                    <i class="fa-solid fa-leaf text-emerald-500"></i> ${className}
                </span>
                <span class="bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-mono text-xs px-2.5 py-1 rounded-full shadow-sm">
                    ${probability.toFixed(1)}%
                </span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-4 p-0.5 overflow-hidden border border-emerald-200 shadow-inner">
                <div class="bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-500 h-full rounded-full transition-all duration-500 shadow-md" style="width: ${probability}%"></div>
            </div>
        `;
        resultsContainer.appendChild(progressWrapper);
    }

    // Actualizar impacto ambiental si detecta un residuo válido (>75%)
    if (highestPrediction.probability > 0.75 && highestPrediction.className !== "nada") {
        updateEcoImpact(highestPrediction.className);
    }
}

// Información de impacto ambiental con contenedores y tips destacados
function updateEcoImpact(className) {
    const impactCard = document.getElementById("eco-impact-card");
    const co2Value = document.getElementById("co2-value");
    const binValue = document.getElementById("bin-value");
    const ecoTip = document.getElementById("eco-tip");

    impactCard.classList.remove("hidden");

    const impactData = {
        "carton y papel": {
            co2: "-0.5 kg CO₂ eq",
            bin: "📦 Contenedor Azul (Papel y Cartón)",
            tip: "¡Pliega muy bien las cajas! Ahorras hasta un 70% de espacio en el contenedor."
        },
        "plastico": {
            co2: "-1.2 kg CO₂ eq",
            bin: "🟡 Contenedor Amarillo (Envases y Plásticos)",
            tip: "¡Enjuaga la botella antes de reciclarla! Evita malos olores e insectos en el proceso."
        },
        "vidrio": {
            co2: "-0.8 kg CO₂ eq",
            bin: "🟢 Contenedor Verde (Vidrio)",
            tip: "¡Increíble! El vidrio es 100% reciclable e infinito sin perder nunca su calidad."
        }
    };

    const data = impactData[className.toLowerCase()];
    if (data) {
        co2Value.textContent = data.co2;
        binValue.textContent = data.bin;
        ecoTip.textContent = data.tip;

        userPoints += 10;
        document.getElementById("user-points").textContent = userPoints;
    }
}

// Cargar el modelo por defecto al iniciar
window.addEventListener("DOMContentLoaded", () => {
    loadModel(URL);
});
