// Ruta donde se encuentra la carpeta de tu modelo con los 3 archivos
const URL = "./my_model/";

let model, webcam, labelContainer, maxPredictions;

async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // Cargar el modelo y los metadatos
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Configurar la cámara web (tamaño 224x224 según tu metadata)
    const flip = true; 
    webcam = new tmImage.Webcam(224, 224, flip);
    await webcam.setup(); // Solicita permisos de la cámara
    await webcam.play();
    window.requestAnimationFrame(loop);

    // Mostrar el canvas de la cámara en el HTML
    document.getElementById("webcam-container").replaceChildren(webcam.canvas);
    
    // Preparar el contenedor de etiquetas
    labelContainer = document.getElementById("label-container");
    labelContainer.replaceChildren();
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}

async function loop() {
    webcam.update(); // Actualiza el frame de la cámara
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    // Realiza la predicción usando la imagen actual de la cámara
    const prediction = await model.predict(webcam.canvas);
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ": " + (prediction[i].probability * 100).toFixed(1) + "%";
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }
}

// Función puente para que el botón del HTML reconozca la acción sin errores
function toggleWebcam() {
    init();
}
